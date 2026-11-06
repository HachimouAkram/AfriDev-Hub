package africa.afridev.model.entity;

import africa.afridev.model.enums.GroupPostType;
import africa.afridev.model.enums.GroupPostVisibility;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "community_group_posts", indexes = {
    @Index(name = "idx_gpost_group", columnList = "group_id"),
    @Index(name = "idx_gpost_author", columnList = "author_id"),
    @Index(name = "idx_gpost_created", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupPostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private GroupEntity group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GroupPostType type = GroupPostType.DISCUSSION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GroupPostVisibility visibility = GroupPostVisibility.PUBLIC;

    @Builder.Default
    private Boolean isPinned = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "group_post_attachments", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "attachment_url")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    @Column(name = "likes_count", nullable = false)
    @Builder.Default
    private Integer likesCount = 0;

    @Column(name = "comments_count", nullable = false)
    @Builder.Default
    private Integer commentsCount = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

