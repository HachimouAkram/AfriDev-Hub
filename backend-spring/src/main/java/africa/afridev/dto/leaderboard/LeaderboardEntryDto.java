package africa.afridev.dto.leaderboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {
    private Long rank;
    private String userId;
    private String profileId;
    private String fullName;
    private String avatarUrl;
    private String title;
    private String country;
    private String city;
    private Long xpPoints;
    private String levelTitle;
    private Integer levelNumber;
    private String levelBadge;
    private Boolean isCurrentUser;
    private Long pointsToNextRank;
}
