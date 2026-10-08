package africa.afridev.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user", columnList = "user_id"),
    @Index(name = "idx_audit_action_created", columnList = "action, createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String resource;

    private String resourceId;

    @Column(columnDefinition = "TEXT")
    private String metadataJson;

    private String ipAddress;
    private String userAgent;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
