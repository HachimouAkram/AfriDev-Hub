package africa.afridev.model.entity;

import africa.afridev.model.enums.ContentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies", indexes = {
    @Index(name = "idx_company_slug", columnList = "slug", unique = true),
    @Index(name = "idx_company_owner", columnList = "owner_id"),
    @Index(name = "idx_company_xp", columnList = "company_xp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 170)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String logoUrl;
    private String bannerUrl;
    private String websiteUrl;
    private String linkedinUrl;
    private String twitterUrl;

    @Column(nullable = false, length = 100)
    private String country;

    @Column(nullable = false, length = 100)
    private String city;

    private String sector; // e.g. Fintech, EdTech, IA, E-commerce, Logistique
    private String companySize; // e.g. 1-10, 11-50, 51-200, 200+

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private UserEntity owner;

    @Column(name = "company_xp", nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    @Builder.Default
    private Long companyXp = 0L;

    @Column(name = "company_level", nullable = false, columnDefinition = "VARCHAR(50) DEFAULT 'Startup'")
    @Builder.Default
    private String companyLevel = "Startup";

    @Column(name = "level_number", nullable = false, columnDefinition = "INTEGER DEFAULT 1")
    @Builder.Default
    private Integer levelNumber = 1;

    @Column(name = "badge", length = 10)
    @Builder.Default
    private String badge = "🌱";

    @Column(nullable = false)
    @Builder.Default
    private Boolean verified = false;

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

