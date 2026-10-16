package africa.afridev.dto.network;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNetworkDto {
    private String id;
    private String email;
    private String fullName;
    private String role;
    private String title;
    private String country;
    private String city;
    private String avatarUrl;
    private List<String> skills;
    private Double reputationScore;
    private Long followersCount;
    private Long followingCount;
    private Boolean isFollowedByCurrentUser;
    private Double matchPercentage;
    private String suggestionReason;
    private List<String> matchedSkills;
}
