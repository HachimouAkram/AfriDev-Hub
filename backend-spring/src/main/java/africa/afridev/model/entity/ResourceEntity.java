package africa.afridev.model.entity;

import africa.afridev.model.enums.ResourceType;
import africa.afridev.model.enums.SkillLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "resources", indexes = {
    @Index(name = "idx_res_type", columnList = "resource_type"),
    @Index(name = "idx_res_tech", columnList = "technology"),
    @Index(name = "idx_res_level", columnList = "skill_level"),
    @Index(name = "idx_res_lang", columnList = "language")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 32)
    private ResourceType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false, length = 32)
    private SkillLevel level;

    @Column(nullable = false, length = 255)
    private String technology; // e.g. "Spring Boot, Angular, TypeScript"

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String language = "fr"; // fr, en, wo, sw

    @Column(name = "youtube_url")
    private String youtubeUrl;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "content_markdown", columnDefinition = "TEXT")
    private String contentMarkdown;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "is_paid")
    @Builder.Default
    private Boolean isPaid = false;

    private BigDecimal price;

    @Column(length = 10)
    @Builder.Default
    private String currency = "XOF";

    @Column(name = "duration_minutes")
    @Builder.Default
    private Integer durationMinutes = 30;

    @Column(name = "xp_reward")
    @Builder.Default
    private Integer xpReward = 50;

    @Column(name = "views_count")
    @Builder.Default
    private Integer viewsCount = 0;

    @Column(name = "completions_count")
    @Builder.Default
    private Integer completionsCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private UserEntity author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private CompanyEntity company;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

