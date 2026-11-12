package africa.afridev.model.entity;

import africa.afridev.model.enums.CompanyActivityType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_activity_logs", indexes = {
    @Index(name = "idx_cal_company_created", columnList = "company_id, created_at"),
    @Index(name = "idx_cal_actor", columnList = "actor_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyActivityLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private CompanyEntity company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private UserEntity actor;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false)
    private CompanyActivityType activityType;

    @Column(name = "target_id")
    private String targetId;

    @Column(name = "target_type")
    private String targetType; // opportunity, event, resource, member, developer

    @Column(nullable = false, length = 500)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

