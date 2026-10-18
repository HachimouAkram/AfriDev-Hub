package africa.afridev.dto.leaderboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardResponse {
    private Long userRank;
    private Long totalDevelopers;
    private Boolean isAuthenticated;
    private LeaderboardEntryDto targetDeveloper;
    private List<LeaderboardEntryDto> top5;
    private List<LeaderboardEntryDto> surroundingNeighborhood;
    private List<LeaderboardEntryDto> publicTop10;
    private Boolean fromCache;
    private Long cachedAt;
}
