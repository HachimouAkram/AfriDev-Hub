package africa.afridev.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CountryAdoptionStatsDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private String country;
    private long userCount;
    private long developerCount;
    private long recruiterCount;
    private long verifiedUsersCount;
    private long projectCount;
    private long opportunityCount;
    private double adoptionPercentage;
    private int rank;
}
