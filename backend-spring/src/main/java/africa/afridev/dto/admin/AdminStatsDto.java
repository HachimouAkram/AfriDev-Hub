package africa.afridev.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsDto {
    private long totalUsers;
    private long totalProfiles;
    private long totalProjects;
    private long totalOpportunities;
    private long totalEvaluations;
    private Map<String, Long> usersByCountry;
}
