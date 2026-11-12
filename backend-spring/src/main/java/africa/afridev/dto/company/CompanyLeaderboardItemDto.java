package africa.afridev.dto.company;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompanyLeaderboardItemDto {
    private int rank;
    private String id;
    private String name;
    private String slug;
    private String logoUrl;
    private String country;
    private String city;
    private String sector;
    private Long companyXp;
    private String companyLevel;
    private Integer levelNumber;
    private String badge;
    private Boolean verified;
    private long activeOpportunitiesCount;
}

