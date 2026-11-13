package africa.afridev.dto.auth;

import africa.afridev.model.enums.Availability;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileDto {
    private String id;
    private String userId;
    private String userRole;
    private String fullName;
    private String country;
    private String city;
    private String title;
    private String companyName;
    private String bio;
    private List<String> skills;
    private List<String> languages;
    private Integer yearsExperience;
    private Availability availability;
    private BigDecimal hourlyRate;
    private String githubUrl;
    private String linkedinUrl;
    private String zindiUrl;
    private String portfolioUrl;
    private String avatarUrl;
    private String bannerUrl;
    private String cvUrl;
    private Integer completionScore;
    private Boolean mobileMoneyVerified;
    private Long xpPoints;
    private String levelTitle;
    private Integer levelNumber;

    // Champs Mentor (Phase 2)
    private Boolean isMentor;
    private String mentorBio;
    private Integer mentorHoursPerWeek;
    private List<String> mentorTopics;
    private Integer menteesHelpedCount;

    // Multilingue & WhatsApp
    private String preferredLanguage;
    private Boolean whatsappEnabled;
    private String whatsappNumber;
}
