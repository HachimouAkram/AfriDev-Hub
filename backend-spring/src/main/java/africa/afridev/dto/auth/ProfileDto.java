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
    private Integer completionScore;
    private Boolean mobileMoneyVerified;
}
