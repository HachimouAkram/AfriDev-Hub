package africa.afridev.model.entity;

import africa.afridev.model.enums.CompanyMemberRole;
import africa.afridev.model.enums.CompanyMemberStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_members", indexes = {
    @Index(name = "idx_cm_company_user", columnList = "company_id, user_id", unique = true),
    @Index(name = "idx_cm_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyMemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private CompanyEntity company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CompanyMemberRole role = CompanyMemberRole.RECRUITER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CompanyMemberStatus status = CompanyMemberStatus.ACTIVE;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "invited_by_user_id")
    private String invitedByUserId;

    private LocalDateTime joinedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

