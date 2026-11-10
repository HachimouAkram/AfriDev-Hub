package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.payment.PayoutAccountDto;
import africa.afridev.dto.payment.WalletDto;
import africa.afridev.dto.payment.WithdrawalRequest;
import africa.afridev.model.entity.WalletTransactionEntity;
import africa.afridev.model.entity.WithdrawalEntity;
import africa.afridev.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<ApiResponse<WalletDto>> getMyWallet(@AuthenticationPrincipal UserDetails userDetails) {
        WalletDto dto = walletService.getWalletDto(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/payout-accounts")
    public ResponseEntity<ApiResponse<PayoutAccountDto>> savePayoutAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PayoutAccountDto dto
    ) {
        PayoutAccountDto saved = walletService.savePayoutAccount(userDetails.getUsername(), dto);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<WithdrawalEntity>> requestWithdrawal(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WithdrawalRequest request
    ) {
        WithdrawalEntity entity = walletService.processWithdrawal(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok(entity));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<WalletTransactionEntity>>> getTransactions(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable
    ) {
        Page<WalletTransactionEntity> page = walletService.getTransactions(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }
}

