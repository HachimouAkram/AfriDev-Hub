package africa.afridev.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_sessions", indexes = {
    @Index(name = "idx_login_session_user", columnList = "user_id"),
    @Index(name = "idx_login_session_device", columnList = "deviceId"),
    @Index(name = "idx_login_session_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String deviceId;

    private String deviceType; // MOBILE, DESKTOP, TABLET, UNKNOWN

    private String deviceName; // ex: Chrome sur Windows 11, Safari sur iPhone

    private String browser; // Chrome, Safari, Firefox, etc.

    private String operatingSystem; // Windows, Android, iOS, etc.

    private String ipAddress;

    private String location; // ex: Dakar, Sénégal ou Connexion locale

    @Column(columnDefinition = "TEXT")
    private String userAgent;

    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, REVOKED

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime lastActiveAt;
}
