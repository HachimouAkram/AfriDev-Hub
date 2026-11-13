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
    private static final long serialVersionUID = 2L;

    private String country;
    private long userCount;
    private long developerCount;
    private long recruiterCount;
    private long verifiedUsersCount;
    private long companyCount;
    private long verifiedCompanyCount;
    private long projectCount;
    private long opportunityCount;
    private long groupCount;
    private long trainingCount;
    private double adoptionPercentage;
    private double performanceScore; // Score de performance globale panafricaine (0 - 100)
    private String vitalityLevel; // 'Élite', 'Moteur Panafricain', 'En Croissance', 'Émergent'
    private int rank;
}
