package africa.afridev.service;

import africa.afridev.dto.payment.PayoutAccountDto;
import africa.afridev.dto.payment.WalletDto;
import africa.afridev.dto.payment.WithdrawalRequest;
import africa.afridev.model.entity.*;
import africa.afridev.model.enums.WalletTransactionType;
import africa.afridev.repository.*;
import africa.afridev.service.payment.UnitechPayGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final PayoutAccountRepository payoutAccountRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final UserRepository userRepository;
    private final UnitechPayGateway unitechPayGateway;

    @Transactional
    public WalletEntity getOrCreateWallet(UserEntity user) {
        return walletRepository.findByUserId(user.getId())
                .orElseGet(() -> walletRepository.save(WalletEntity.builder()
                        .user(user)
                        .balance(BigDecimal.ZERO)
                        .pendingEscrowBalance(BigDecimal.ZERO)
                        .totalEarned(BigDecimal.ZERO)
                        .totalWithdrawn(BigDecimal.ZERO)
                        .currency("XOF")
                        .build()));
    }

    @Transactional
    public void creditSeller(UserEntity seller, BigDecimal amount, String reference, String description) {
        WalletEntity wallet = getOrCreateWallet(seller);
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setTotalEarned(wallet.getTotalEarned().add(amount));
        walletRepository.save(wallet);

        WalletTransactionEntity tx = WalletTransactionEntity.builder()
                .wallet(wallet)
                .type(WalletTransactionType.CREDIT_SALE)
                .amount(amount)
                .balanceAfter(wallet.getBalance())
                .reference(reference)
                .description(description)
                .build();
        walletTransactionRepository.save(tx);
        log.info("Portefeuille crédité pour {}: +{} XOF (Solde: {})", seller.getEmail(), amount, wallet.getBalance());
    }

    @Transactional(readOnly = true)
    public WalletDto getWalletDto(String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé: " + userEmail));

        WalletEntity wallet = getOrCreateWallet(user);
        List<PayoutAccountEntity> accounts = payoutAccountRepository.findByUserId(user.getId());

        List<PayoutAccountDto> accountDtos = accounts.stream()
                .map(a -> PayoutAccountDto.builder()
                        .id(a.getId())
                        .country(a.getCountry())
                        .method(a.getMethod())
                        .phoneNumber(a.getPhoneNumber())
                        .accountName(a.getAccountName())
                        .isDefault(a.getIsDefault())
                        .isVerified(a.getIsVerified())
                        .build())
                .collect(Collectors.toList());

        return WalletDto.builder()
                .id(wallet.getId())
                .userId(user.getId())
                .balance(wallet.getBalance())
                .pendingEscrowBalance(wallet.getPendingEscrowBalance())
                .totalEarned(wallet.getTotalEarned())
                .totalWithdrawn(wallet.getTotalWithdrawn())
                .currency(wallet.getCurrency())
                .payoutAccounts(accountDtos)
                .build();
    }

    @Transactional
    public WithdrawalEntity processWithdrawal(String userEmail, WithdrawalRequest request) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé: " + userEmail));

        WalletEntity wallet = getOrCreateWallet(user);
        BigDecimal amount = request.getAmount();

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Solde insuffisant pour ce retrait. Solde disponible: " + wallet.getBalance() + " XOF");
        }

        // Débiter le portefeuille
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(amount));
        walletRepository.save(wallet);

        String reference = "WDR_" + System.currentTimeMillis();

        WalletTransactionEntity tx = WalletTransactionEntity.builder()
                .wallet(wallet)
                .type(WalletTransactionType.DEBIT_WITHDRAWAL)
                .amount(amount.negate())
                .balanceAfter(wallet.getBalance())
                .reference(reference)
                .description("Demande de retrait vers " + request.getMethod() + " (" + request.getAccount() + ")")
                .build();
        walletTransactionRepository.save(tx);

        // Appel API UnitechPay withdraw_funds
        String methodStr = request.getMethod().name().toLowerCase();
        if (methodStr.contains("wave")) methodStr = "wave";
        else if (methodStr.contains("orange")) methodStr = "orange";
        else if ("bank".equalsIgnoreCase(methodStr)) methodStr = "bank";
        else methodStr = "intl";

        Map<String, Object> apiRes = unitechPayGateway.withdrawFunds(
                amount,
                methodStr,
                request.getAccount(),
                request.getCountry(),
                request.getOperator()
        );

        boolean success = Boolean.TRUE.equals(apiRes.get("success"));
        Map<String, Object> data = (Map<String, Object>) apiRes.get("data");

        BigDecimal netAmount = amount;
        BigDecimal feeAmount = BigDecimal.ZERO;
        Long externalId = null;

        if (data != null) {
            if (data.get("net_amount") != null) {
                netAmount = new BigDecimal(data.get("net_amount").toString());
            }
            if (data.get("commission") != null) {
                feeAmount = new BigDecimal(data.get("commission").toString());
            }
            if (data.get("withdrawal_id") != null) {
                externalId = Long.valueOf(data.get("withdrawal_id").toString());
            }
        }

        WithdrawalEntity withdrawal = WithdrawalEntity.builder()
                .user(user)
                .amount(amount)
                .feeAmount(feeAmount)
                .netAmount(netAmount)
                .method(request.getMethod())
                .country(request.getCountry())
                .accountPhone(request.getAccount())
                .status(success ? "PROCESSED" : "PENDING")
                .reference(reference)
                .externalWithdrawalId(externalId)
                .note(success ? "Retrait automatique initié avec succès" : "Retrait en cours de traitement")
                .build();

        return withdrawalRepository.save(withdrawal);
    }

    @Transactional
    public PayoutAccountDto savePayoutAccount(String userEmail, PayoutAccountDto dto) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé: " + userEmail));

        PayoutAccountEntity account = PayoutAccountEntity.builder()
                .user(user)
                .country(dto.getCountry() != null ? dto.getCountry() : "SN")
                .method(dto.getMethod())
                .phoneNumber(dto.getPhoneNumber())
                .accountName(dto.getAccountName())
                .isDefault(Boolean.TRUE.equals(dto.getIsDefault()))
                .isVerified(true)
                .build();

        PayoutAccountEntity saved = payoutAccountRepository.save(account);

        return PayoutAccountDto.builder()
                .id(saved.getId())
                .country(saved.getCountry())
                .method(saved.getMethod())
                .phoneNumber(saved.getPhoneNumber())
                .accountName(saved.getAccountName())
                .isDefault(saved.getIsDefault())
                .isVerified(saved.getIsVerified())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<WalletTransactionEntity> getTransactions(String userEmail, Pageable pageable) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé: " + userEmail));
        WalletEntity wallet = getOrCreateWallet(user);
        return walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId(), pageable);
    }
}

