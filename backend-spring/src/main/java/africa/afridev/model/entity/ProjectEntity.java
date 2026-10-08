package africa.afridev.model.entity;

import africa.afridev.model.enums.ContentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects", indexes = {
    @Index(name = "idx_project_author", columnList = "author_id"),
    @Index(name = "idx_project_status_created", columnList = "status, createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_stack", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "technology")
    @Builder.Default
    private List<String> stack = new ArrayList<>();

    private String repoUrl;
    private String demoUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_screenshots", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "screenshot_url")
    @Builder.Default
    private List<String> screenshots = new ArrayList<>();

    @Builder.Default
    private Boolean isOpenSource = false;

    @Builder.Default
    private Integer recognitionsCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ContentStatus status = ContentStatus.PUBLISHED;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
