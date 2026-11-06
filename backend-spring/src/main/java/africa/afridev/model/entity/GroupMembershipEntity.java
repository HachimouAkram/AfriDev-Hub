package africa.afridev.model.entity;

import africa.afridev.model.enums.GroupMemberRole;
import africa.afridev.model.enums.GroupMemberStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "community_group_memberships", uniqueConstraints = {
    @UniqueConstraint(name = "uk_group_user", columnNames = {"group_id", "user_id"})
}, indexes = {
    @Index(name = "idx_membership_group", columnList = "group_id"),
    @Index(name = "idx_membership_user", columnList = "user_id"),
    @Index(name = "idx_membership_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMembershipEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private GroupEntity group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GroupMemberRole role = GroupMemberRole.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GroupMemberStatus status = GroupMemberStatus.ACTIVE;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime joinedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

