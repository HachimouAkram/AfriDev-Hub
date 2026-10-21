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
    private static final long serialVersionUID = 1L;

    private long totalContinentalUsers;
    private long totalContinentalProjects;
    private long totalContinentalOpportunities;
    private int activeCountriesCount;
    private List<CountryAdoptionStatsDto> countries;
}
