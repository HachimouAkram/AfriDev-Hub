package africa.afridev.dto.company;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompanyStatsDto {
    private long totalOpportunities;
    private long activeOpportunities;
    private long totalApplicants;
    private long totalHired;
    private long totalEvents;
    private long totalResources;
    private long totalTeamMembers;
    private Long companyXp;
    private String companyLevel;
    private String badge;
    private int leaderboardRank;
}

