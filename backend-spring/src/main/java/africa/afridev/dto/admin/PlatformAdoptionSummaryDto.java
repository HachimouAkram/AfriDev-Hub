package africa.afridev.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PlatformAdoptionSummaryDto implements Serializable {
    private static final long serialVersionUID = 2L;

    private long totalContinentalUsers;
    private long totalContinentalDevelopers;
    private long totalContinentalRecruiters;
    private long totalContinentalCompanies;
    private long totalContinentalGroups;
    private long totalContinentalTrainings;
    private long totalContinentalOpportunities;
    private long totalContinentalProjects;
    private long totalContinentalVerifiedUsers;
    private int activeCountriesCount;
    private double averageContinentalPerformanceScore;
    private List<CountryAdoptionStatsDto> countries;
}
