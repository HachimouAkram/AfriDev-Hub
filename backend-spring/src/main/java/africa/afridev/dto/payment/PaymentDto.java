package africa.afridev.dto.payment;

import africa.afridev.model.enums.PaymentMethod;
import africa.afridev.model.enums.PaymentProvider;
import africa.afridev.model.enums.PaymentStatus;
import africa.afridev.model.enums.PaymentTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentDto {
    private String id;
    private String orderNumber;
    private String buyerId;
    private String buyerName;
    private String sellerId;
    private String sellerName;
    private PaymentTargetType targetType;
    private String targetId;
    private String targetTitle;
    private PaymentProvider provider;
    private PaymentMethod method;
    private BigDecimal netSellerAmount;
    private BigDecimal platformFee;
    private BigDecimal providerFee;
    private BigDecimal totalBuyerAmount;
    private String currency;
    private PaymentStatus status;
    private String paymentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}

