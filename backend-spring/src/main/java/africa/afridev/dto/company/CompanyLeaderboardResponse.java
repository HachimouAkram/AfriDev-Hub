package africa.afridev.dto.company;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompanyLeaderboardResponse {
    private List<CompanyLeaderboardItemDto> topCompanies;
    private CompanyLeaderboardItemDto myCompany;
    private long totalCompanies;
}

