package africa.afridev.model.entity;

import africa.afridev.model.enums.PaymentMethod;
import africa.afridev.model.enums.PaymentProvider;
import africa.afridev.model.enums.PaymentStatus;
import africa.afridev.model.enums.PaymentTargetType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_buyer", columnList = "buyer_id"),
    @Index(name = "idx_payment_seller", columnList = "seller_id"),
    @Index(name = "idx_payment_target", columnList = "target_type, target_id"),
    @Index(name = "idx_payment_ref", columnList = "external_reference"),
    @Index(name = "idx_payment_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "order_number", nullable = false, unique = true, length = 64)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private UserEntity buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private UserEntity seller;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 32)
    private PaymentTargetType targetType;

    @Column(name = "target_id", nullable = false, length = 64)
    private String targetId;

    @Column(name = "target_title", nullable = false)
    private String targetTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentMethod method;

    // Frais et montants (en Franc CFA XOF ou devise cible)
    @Column(name = "net_seller_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netSellerAmount;

    @Column(name = "platform_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "provider_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal providerFee;

    @Column(name = "total_buyer_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalBuyerAmount;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "XOF";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "external_reference", length = 128)
    private String externalReference;

    @Column(name = "payment_url", length = 1024)
    private String paymentUrl;

    @Column(name = "qr_code_data", columnDefinition = "TEXT")
    private String qrCodeData;

    @Column(name = "customer_phone", length = 32)
    private String customerPhone;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}

