package africa.afridev.model.entity;

import africa.afridev.model.enums.GroupAccessType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "community_groups", indexes = {
    @Index(name = "idx_group_slug", columnList = "slug", unique = true),
    @Index(name = "idx_group_owner", columnList = "owner_id"),
    @Index(name = "idx_group_access", columnList = "access_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 140)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    private String avatarUrl;
    private String bannerUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false)
    @Builder.Default
    private GroupAccessType accessType = GroupAccessType.PUBLIC;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "group_tags", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private String country;
    private String city;

    @Column(name = "rules_markdown", columnDefinition = "TEXT")
    private String rulesMarkdown;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserEntity owner;

    @Column(name = "member_count", nullable = false)
    @Builder.Default
    private Integer memberCount = 1;

    @Column(name = "post_count", nullable = false)
    @Builder.Default
    private Integer postCount = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
