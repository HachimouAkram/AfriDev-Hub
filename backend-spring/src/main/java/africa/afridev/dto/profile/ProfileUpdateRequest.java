package africa.afridev.dto.profile;

import africa.afridev.model.enums.Availability;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProfileUpdateRequest {
    private String fullName;
    private String country;
    private String city;
    private String title;
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

    // Multilingue & WhatsApp
    private String preferredLanguage;
    private Boolean whatsappEnabled;
    private String whatsappNumber;
}
