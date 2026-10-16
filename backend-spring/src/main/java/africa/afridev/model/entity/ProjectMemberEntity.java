package africa.afridev.model.entity;

import africa.afridev.model.enums.MemberStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_members", indexes = {
    @Index(name = "idx_project_member_project", columnList = "project_id"),
    @Index(name = "idx_project_member_user", columnList = "user_id"),
    @Index(name = "idx_project_member_status", columnList = "status")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_project_member", columnNames = {"project_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ProjectEntity project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String role; // e.g. "Développeur Frontend", "Designer UI/UX", "DevOps"

    @Column(columnDefinition = "TEXT")
    private String message; // Message de candidature

    @Column(name = "cv_url", length = 500)
    private String cvUrl; // CV joint ou CV du profil

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MemberStatus status = MemberStatus.PENDING;

    private LocalDateTime joinedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
