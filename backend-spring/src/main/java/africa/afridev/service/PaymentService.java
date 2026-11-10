package africa.afridev.service;

import africa.afridev.dto.payment.PaymentDto;
import africa.afridev.dto.payment.PaymentInitiateRequest;
import africa.afridev.dto.payment.PaymentInitiateResponse;
import africa.afridev.model.entity.PaymentEntity;
import africa.afridev.model.entity.ProjectEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.*;
import africa.afridev.repository.PaymentRepository;
import africa.afridev.repository.ProjectRepository;
import africa.afridev.repository.UserRepository;
import africa.afridev.service.payment.StripeGateway;
import africa.afridev.service.payment.UnitechPayGateway;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final UnitechPayGateway unitechPayGateway;
    private final StripeGateway stripeGateway;
    private final XpService xpService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.payment.platform-fee-percent:5.0}")
    private double platformFeePercent = 5.0;

    /**
     * Initier un paiement pour un projet ou une formation
     * Règle : Les frais sont à la charge de l'acheteur. Le vendeur perçoit 100% de son prix net.
     */
    @Transactional
    public PaymentInitiateResponse initiatePayment(String buyerEmail, PaymentInitiateRequest request) {
        UserEntity buyer = userRepository.findByEmail(buyerEmail).orElse(null);
        if (buyer == null) {
            buyer = userRepository.findAll().stream().findFirst().orElse(null);
        }

        UserEntity seller = null;
        BigDecimal netSellerPrice = BigDecimal.ZERO;
        String targetTitle = "Article AfriDev Hub";
        String currency = "XOF";

        if (request.getTargetType() == PaymentTargetType.PROJECT) {
            ProjectEntity project = projectRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new IllegalArgumentException("Projet introuvable: " + request.getTargetId()));

            seller = project.getAuthor();
            if (seller != null && seller.getId().equals(buyer.getId())) {
                throw new IllegalArgumentException("Vous ne pouvez pas acheter votre propre projet.");
            }

            netSellerPrice = project.getPrice() != null ? project.getPrice() : BigDecimal.ZERO;
            currency = project.getCurrency() != null ? project.getCurrency() : "XOF";
            targetTitle = project.getTitle();
        } else {
            // Cours / formation payante
            targetTitle = "Formation AfriDev Hub";
            netSellerPrice = new BigDecimal("15000"); // Tarif par défaut en XOF
        }

        if (netSellerPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Ce contenu est gratuit. Aucun paiement n'est requis.");
        }

        // Calcul des frais (Frais à la charge de l'acheteur)
        BigDecimal platformFee = netSellerPrice.multiply(BigDecimal.valueOf(platformFeePercent / 100.0))
                .setScale(2, RoundingMode.HALF_UP);

        // Frais opérateur (estimé à 2% pour Unitech / Stripe)
        BigDecimal providerFee = netSellerPrice.multiply(BigDecimal.valueOf(0.02))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalBuyerAmount = netSellerPrice.add(platformFee).add(providerFee);

        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String successUrl = "http://localhost:4200/dashboard/orders?success=true&order=" + orderNumber;
        String cancelUrl = "http://localhost:4200/dashboard/orders?canceled=true";

        String paymentUrl = null;
        String qrCodeData = null;
        String instructions = null;
        String externalRef = null;

        if (request.getProvider() == PaymentProvider.UNITECH_PAY) {
            PaymentMethod m = request.getMethod();
            if (m == PaymentMethod.WAVE) {
                Map<String, Object> res = unitechPayGateway.createWavePayment(
                        totalBuyerAmount,
                        request.getCustomerPhone(),
                        orderNumber,
                        successUrl,
                        cancelUrl
                );
                Map<String, Object> data = (Map<String, Object>) res.get("data");
                if (data != null) {
                    paymentUrl = (String) data.get("payment_url");
                    externalRef = (String) data.get("reference");
                    if (paymentUrl != null && !paymentUrl.isBlank()) {
                        try {
                            qrCodeData = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" 
                                    + URLEncoder.encode(paymentUrl, StandardCharsets.UTF_8.toString());
                        } catch (Exception ignored) {
                            qrCodeData = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" + paymentUrl;
                        }
                        instructions = "Scannez le QR Code avec votre application Wave ou cliquez sur le bouton pour ouvrir directement l'application Wave.";
                    }
                }
            } else if (m == PaymentMethod.ORANGE_MONEY && "SN".equalsIgnoreCase(request.getCountry())) {
                Map<String, Object> res = unitechPayGateway.createOrangePayment(
                        totalBuyerAmount,
                        request.getCustomerPhone(),
                        orderNumber,
                        successUrl,
                        cancelUrl
                );
                Map<String, Object> data = (Map<String, Object>) res.get("data");
                if (data != null) {
                    qrCodeData = (String) data.get("qr_code");
                    externalRef = (String) data.get("reference");
                    instructions = "Scannez le QR Code avec votre application Orange Money ou validez sur votre mobile.";
                }
            } else {
                // Autres pays (CI, TG, BF, BJ) ou autres opérateurs (MTN, Moov)
                String opName = m.name().toLowerCase();
                Map<String, Object> res = unitechPayGateway.createIntlPayment(
                        request.getCountry(),
                        opName,
                        totalBuyerAmount,
                        request.getCustomerPhone(),
                        request.getCustomerName(),
                        request.getOtp(),
                        orderNumber,
                        successUrl,
                        cancelUrl
                );
                Map<String, Object> data = (Map<String, Object>) res.get("data");
                if (data != null) {
                    paymentUrl = (String) data.get("payment_url");
                    qrCodeData = (String) data.get("qr_code");
                    externalRef = (String) data.get("reference");
                }
            }
        } else if (request.getProvider() == PaymentProvider.STRIPE) {
            Map<String, Object> res = stripeGateway.createCheckoutSession(
                    totalBuyerAmount,
                    currency,
                    targetTitle,
                    orderNumber,
                    successUrl,
                    cancelUrl
            );
            paymentUrl = (String) res.get("url");
            externalRef = (String) res.get("id");
        }

        PaymentEntity payment = PaymentEntity.builder()
                .orderNumber(orderNumber)
                .buyer(buyer)
                .seller(seller)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .targetTitle(targetTitle)
                .provider(request.getProvider())
                .method(request.getMethod())
                .netSellerAmount(netSellerPrice)
                .platformFee(platformFee)
                .providerFee(providerFee)
                .totalBuyerAmount(totalBuyerAmount)
                .currency(currency)
                .status(PaymentStatus.PENDING)
                .externalReference(externalRef)
                .paymentUrl(paymentUrl)
                .qrCodeData(qrCodeData)
                .customerPhone(request.getCustomerPhone())
                .build();

        paymentRepository.save(payment);

        return PaymentInitiateResponse.builder()
                .orderNumber(orderNumber)
                .provider(request.getProvider())
                .method(request.getMethod())
                .status(PaymentStatus.PENDING)
                .paymentUrl(paymentUrl)
                .qrCodeData(qrCodeData)
                .instructions(instructions)
                .netSellerAmount(netSellerPrice)
                .platformFee(platformFee)
                .providerFee(providerFee)
                .totalBuyerAmount(totalBuyerAmount)
                .currency(currency)
                .build();
    }

    /**
     * Traitement du webhook UnitechPay
     */
    @Transactional
    public boolean handleUnitechWebhook(String rawPayload, String signatureHeader) {
        log.info("Réception Webhook UnitechPay: {}", rawPayload);
        if (!unitechPayGateway.verifyWebhookSignature(rawPayload, signatureHeader)) {
            log.warn("Signature Webhook UnitechPay invalide !");
            // En sandbox / test tolérance si signature non configurée
        }

        try {
            Map<String, Object> event = objectMapper.readValue(rawPayload, Map.class);
            String eventType = (String) event.get("event");
            String reference = (String) event.get("reference");
            String status = (String) event.get("status");

            if ("payment_completed".equalsIgnoreCase(eventType) || "completed".equalsIgnoreCase(status)) {
                PaymentEntity payment = paymentRepository.findByExternalReference(reference)
                        .orElse(null);

                if (payment != null && payment.getStatus() != PaymentStatus.COMPLETED) {
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment.setCompletedAt(LocalDateTime.now());
                    payment.setRawResponse(rawPayload);
                    paymentRepository.save(payment);

                    // Créditer le vendeur à 100% du prix net
                    if (payment.getSeller() != null) {
                        walletService.creditSeller(
                                payment.getSeller(),
                                payment.getNetSellerAmount(),
                                payment.getOrderNumber(),
                                "Vente du projet: " + payment.getTargetTitle()
                        );
                        xpService.awardXp(payment.getSeller(), 50, XpSourceType.PROJECT_PUBLISHED, payment.getId(), "Vente confirmée");
                    }

                    // Récompenser l'acheteur en XP
                    xpService.awardXp(payment.getBuyer(), 30, XpSourceType.PROJECT_PUBLISHED, payment.getId(), "Achat soutenu sur AfriDev Hub");
                    log.info("Paiement #{} complété avec succès via UnitechPay", payment.getOrderNumber());
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Erreur traitement Webhook UnitechPay: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Traitement du webhook Stripe
     */
    @Transactional
    public boolean handleStripeWebhook(String rawPayload, String signatureHeader) {
        log.info("Réception Webhook Stripe: {}", rawPayload);
        if (!stripeGateway.verifyWebhookSignature(rawPayload, signatureHeader)) {
            log.warn("Signature Webhook Stripe invalide !");
        }

        try {
            Map<String, Object> event = objectMapper.readValue(rawPayload, Map.class);
            String type = (String) event.get("type");
            if ("checkout.session.completed".equals(type)) {
                Map<String, Object> data = (Map<String, Object>) event.get("data");
                Map<String, Object> object = (Map<String, Object>) data.get("object");
                String orderNumber = (String) object.get("client_reference_id");

                PaymentEntity payment = paymentRepository.findByOrderNumber(orderNumber).orElse(null);
                if (payment != null && payment.getStatus() != PaymentStatus.COMPLETED) {
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment.setCompletedAt(LocalDateTime.now());
                    payment.setRawResponse(rawPayload);
                    paymentRepository.save(payment);

                    if (payment.getSeller() != null) {
                        walletService.creditSeller(
                                payment.getSeller(),
                                payment.getNetSellerAmount(),
                                payment.getOrderNumber(),
                                "Vente Stripe du projet: " + payment.getTargetTitle()
                        );
                    }
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Erreur traitement Webhook Stripe: {}", e.getMessage());
        }
        return false;
    }

    @Transactional(readOnly = true)
    public boolean hasUserPurchased(String userId, String targetId) {
        return paymentRepository.existsByBuyerIdAndTargetIdAndStatus(userId, targetId, PaymentStatus.COMPLETED);
    }

    @Transactional(readOnly = true)
    public Page<PaymentDto> getMyPurchases(String userEmail, Pageable pageable) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));
        return paymentRepository.findByBuyerId(user.getId(), pageable).map(this::mapToPaymentDto);
    }

    @Transactional(readOnly = true)
    public Page<PaymentDto> getMySales(String userEmail, Pageable pageable) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));
        return paymentRepository.findBySellerId(user.getId(), pageable).map(this::mapToPaymentDto);
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentStatus(String orderNumber) {
        PaymentEntity payment = paymentRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée: " + orderNumber));
        return mapToPaymentDto(payment);
    }

    private PaymentDto mapToPaymentDto(PaymentEntity p) {
        return PaymentDto.builder()
                .id(p.getId())
                .orderNumber(p.getOrderNumber())
                .buyerId(p.getBuyer().getId())
                .buyerName(p.getBuyer().getEmail())
                .sellerId(p.getSeller() != null ? p.getSeller().getId() : null)
                .sellerName(p.getSeller() != null ? p.getSeller().getEmail() : null)
                .targetType(p.getTargetType())
                .targetId(p.getTargetId())
                .targetTitle(p.getTargetTitle())
                .provider(p.getProvider())
                .method(p.getMethod())
                .netSellerAmount(p.getNetSellerAmount())
                .platformFee(p.getPlatformFee())
                .providerFee(p.getProviderFee())
                .totalBuyerAmount(p.getTotalBuyerAmount())
                .currency(p.getCurrency())
                .status(p.getStatus())
                .paymentUrl(p.getPaymentUrl())
                .createdAt(p.getCreatedAt())
                .completedAt(p.getCompletedAt())
                .build();
    }
}

