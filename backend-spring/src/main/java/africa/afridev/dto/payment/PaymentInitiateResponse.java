package africa.afridev.dto.payment;

import africa.afridev.model.enums.PaymentMethod;
import africa.afridev.model.enums.PaymentProvider;
import africa.afridev.model.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentInitiateResponse {
    private String orderNumber;
    private PaymentProvider provider;
    private PaymentMethod method;
    private PaymentStatus status;
    private String paymentUrl;
    private String qrCodeData;
    private String instructions;

    // Décomposition transparente des montants (Frais à la charge de l'acheteur)
    private BigDecimal netSellerAmount;
    private BigDecimal platformFee;
    private BigDecimal providerFee;
    private BigDecimal totalBuyerAmount;
    private String currency;
}

