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
    @Index(name = "idx_profile_xp", columnList = "xp_points"),
    @Index(name = "idx_profile_mentor", columnList = "is_mentor")
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

    @Column(name = "xp_points", nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    @Builder.Default
    private Long xpPoints = 0L;

    @Column(name = "level_title", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'Junior'")
    @Builder.Default
    private String levelTitle = "Junior";

    @Column(name = "level_number", nullable = false, columnDefinition = "INTEGER DEFAULT 1")
    @Builder.Default
    private Integer levelNumber = 1;

    // --- Champs Mentor / Volontariat Tech (Phase 2) ---
    @Column(name = "is_mentor", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    @Builder.Default
    private Boolean isMentor = false;

    @Column(name = "mentor_bio", columnDefinition = "TEXT")
    private String mentorBio;

    @Column(name = "mentor_hours_per_week")
    @Builder.Default
    private Integer mentorHoursPerWeek = 2;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "profile_mentor_topics", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "topic")
    @Builder.Default
    private List<String> mentorTopics = new ArrayList<>();

    @Column(name = "mentees_helped_count")
    @Builder.Default
    private Integer menteesHelpedCount = 0;

    // --- Multilingue & Contact WhatsApp ---
    @Column(name = "preferred_language", length = 10)
    @Builder.Default
    private String preferredLanguage = "fr";

    @Column(name = "whatsapp_enabled")
    @Builder.Default
    private Boolean whatsappEnabled = false;

    @Column(name = "whatsapp_number", length = 32)
    private String whatsappNumber;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void setSkills(List<String> skills) {
        this.skills = skills != null ? new ArrayList<>(skills) : new ArrayList<>();
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages != null ? new ArrayList<>(languages) : new ArrayList<>();
    }

    public static class ProfileEntityBuilder {
        public ProfileEntityBuilder skills(List<String> skills) {
            this.skills$value = skills != null ? new ArrayList<>(skills) : new ArrayList<>();
            this.skills$set = true;
            return this;
        }

        public ProfileEntityBuilder languages(List<String> languages) {
            this.languages$value = languages != null ? new ArrayList<>(languages) : new ArrayList<>();
            this.languages$set = true;
            return this;
        }
    }
}
