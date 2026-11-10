package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.payment.PaymentDto;
import africa.afridev.dto.payment.PaymentInitiateRequest;
import africa.afridev.dto.payment.PaymentInitiateResponse;
import africa.afridev.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentInitiateResponse>> initiatePayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PaymentInitiateRequest request
    ) {
        String buyerIdentifier = (userDetails != null) ? userDetails.getUsername() : 
                (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank() ? request.getCustomerPhone() : "guest@afridev.africa");
        PaymentInitiateResponse response = paymentService.initiatePayment(buyerIdentifier, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/my-purchases")
    public ResponseEntity<ApiResponse<Page<PaymentDto>>> getMyPurchases(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable
    ) {
        Page<PaymentDto> page = paymentService.getMyPurchases(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/my-sales")
    public ResponseEntity<ApiResponse<Page<PaymentDto>>> getMySales(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable
    ) {
        Page<PaymentDto> page = paymentService.getMySales(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{orderNumber}/status")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentStatus(@PathVariable String orderNumber) {
        PaymentDto dto = paymentService.getPaymentStatus(orderNumber);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/webhook/unitech")
    public ResponseEntity<String> unitechWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-UnitechPay-Signature", required = false) String signatureHeader
    ) {
        paymentService.handleUnitechWebhook(rawPayload, signatureHeader);
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/webhook/stripe")
    public ResponseEntity<String> stripeWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signatureHeader
    ) {
        paymentService.handleStripeWebhook(rawPayload, signatureHeader);
        return ResponseEntity.ok("OK");
    }
}

