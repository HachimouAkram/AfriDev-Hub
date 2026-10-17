package africa.afridev.model.entity;

import africa.afridev.model.enums.Availability;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "profiles", indexes = {
    @Index(name = "idx_profile_country", columnList = "country"),
    @Index(name = "idx_profile_xp", columnList = "xp_points DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserEntity user;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String country;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "profile_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "profile_languages", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "language")
    @Builder.Default
    private List<String> languages = new ArrayList<>();

    private Integer yearsExperience;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Availability availability = Availability.OPEN;

    private BigDecimal hourlyRate;

    private String githubUrl;
    private String linkedinUrl;
    private String zindiUrl;
    private String portfolioUrl;
    private String avatarUrl;
    private String bannerUrl;
    private String cvUrl;

    @Column(columnDefinition = "TEXT")
    private String githubStatsJson;

    @Builder.Default
    private Integer completionScore = 0;

    @Builder.Default
    private Boolean mobileMoneyVerified = false;

    @Column(name = "xp_points", nullable = false)
    @Builder.Default
    private Long xpPoints = 0L;

    @Column(name = "level_title", nullable = false)
    @Builder.Default
    private String levelTitle = "Junior";

    @Column(name = "level_number", nullable = false)
    @Builder.Default
    private Integer levelNumber = 1;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
