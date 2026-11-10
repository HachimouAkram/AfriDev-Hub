package africa.afridev.model.entity;

import africa.afridev.model.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payout_accounts", indexes = {
    @Index(name = "idx_payout_user", columnList = "user_id"),
    @Index(name = "idx_payout_phone", columnList = "phone_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutAccountEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String country = "SN"; // SN, CI, TG, BF, BJ

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentMethod method; // WAVE, ORANGE_MONEY, MTN_MOMO, MOOV, TOGOCELL

    @Column(name = "phone_number", nullable = false, length = 32)
    private String phoneNumber;

    @Column(name = "account_name")
    private String accountName;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = true;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

