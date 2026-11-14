package africa.afridev.model.entity;

import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.ProjectType;
import africa.afridev.model.enums.SaleType;
import africa.afridev.model.enums.SaasPricingType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects", indexes = {
    @Index(name = "idx_project_author", columnList = "author_id"),
    @Index(name = "idx_project_status_created", columnList = "status, createdAt"),
    @Index(name = "idx_project_type", columnList = "projectType")
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectType projectType = ProjectType.OPEN_SOURCE;

    private BigDecimal price;
    
    @Builder.Default
    private String currency = "XOF";

    @Column(name = "is_monetized")
    @Builder.Default
    private Boolean isMonetized = false;

    @Column(name = "payout_phone_number", length = 32)
    private String payoutPhoneNumber;

    @Column(name = "payout_operator", length = 32)
    private String payoutOperator;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_payment_methods", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "payment_method")
    @Builder.Default
    private List<String> acceptedPaymentMethods = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private SaleType saleType;

    @Enumerated(EnumType.STRING)
    private SaasPricingType saasPricingType;

    private String licenseType;

    @Column(columnDefinition = "TEXT")
    private String demoAccountInfo;

    private String companyName;
    private String companyRole;
    private String youtubeUrl;
    private String documentationPdfUrl;

    @Column(name = "source_code_archive_url")
    private String sourceCodeArchiveUrl;

    @Column(name = "max_members")
    private Integer maxMembers;

    @Builder.Default
    private Integer recognitionsCount = 0;

    @Column(name = "views_count")
    @Builder.Default
    private Integer viewsCount = 0;

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
