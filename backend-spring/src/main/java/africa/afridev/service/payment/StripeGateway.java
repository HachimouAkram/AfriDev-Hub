package africa.afridev.service.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Service
public class StripeGateway {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.payment.stripe.secret-key:sk_test_51UI1PAPu1LaSP7lQVEfrRHuzbUrGxuRgdzZz6dgo1IPP99zyMEtK0vjgzDK7sbdDxJJl0cFTEa34rCMdoaWztROp007aYIQM2e}")
    private String secretKey;

    @Value("${app.payment.stripe.webhook-secret:whsec_LH4sXxqY6KsGKm9hHxEmj8AN0SGDEEPu}")
    private String webhookSecret;

    /**
     * Création d'une session Stripe Checkout
     */
    public Map<String, Object> createCheckoutSession(
            BigDecimal totalBuyerAmount,
            String currency,
            String targetTitle,
            String orderNumber,
            String successUrl,
            String cancelUrl
    ) {
        String url = "https://api.stripe.com/v1/checkout/sessions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Bearer " + secretKey);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("payment_method_types[0]", "card");
        form.add("mode", "payment");
        form.add("client_reference_id", orderNumber);
        form.add("success_url", successUrl);
        form.add("cancel_url", cancelUrl);

        // Montant en plus petite unité de la monnaie (centimes pour EUR/USD, entier pour XOF)
        long unitAmount;
        String cur = currency != null ? currency.toLowerCase() : "eur";
        if ("xof".equals(cur) || "xaf".equals(cur)) {
            unitAmount = totalBuyerAmount.longValue();
        } else {
            unitAmount = totalBuyerAmount.multiply(BigDecimal.valueOf(100)).longValue();
        }

        form.add("line_items[0][price_data][currency]", cur);
        form.add("line_items[0][price_data][product_data][name]", targetTitle);
        form.add("line_items[0][price_data][unit_amount]", String.valueOf(unitAmount));
        form.add("line_items[0][quantity]", "1");
        form.add("metadata[order_number]", orderNumber);

        try {
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Erreur Stripe createCheckoutSession: {}", e.getMessage());
        }
        return Map.of("error", "Impossible de créer la session Stripe");
    }

    /**
     * Vérification de la signature du webhook Stripe
     */
    public boolean verifyWebhookSignature(String payload, String sigHeader) {
        if (sigHeader == null || webhookSecret == null) {
            return false;
        }
        try {
            // Header format: t=timestamp,v1=signature
            String[] parts = sigHeader.split(",");
            String timestamp = null;
            String v1 = null;
            for (String part : parts) {
                String[] kv = part.split("=", 2);
                if (kv.length == 2) {
                    if ("t".equals(kv[0].trim())) timestamp = kv[1].trim();
                    if ("v1".equals(kv[0].trim())) v1 = kv[1].trim();
                }
            }

            if (timestamp == null || v1 == null) return false;

            String signedPayload = timestamp + "." + payload;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(signedPayload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().equalsIgnoreCase(v1);
        } catch (Exception e) {
            log.error("Erreur vérification webhook Stripe: {}", e.getMessage());
            return false;
        }
    }
}

