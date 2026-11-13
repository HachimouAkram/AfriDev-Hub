package africa.afridev.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDeletionImpactDto {
    private String userEmail;
    private String userRole;
    private boolean isCompanyOwner;
    private String companyId;
    private String companyName;
    private String companySlug;
    private int publishedOpportunitiesCount;
    private int teamMembersCount;
    private boolean isCompanyMember;
    private String memberCompanyName;
}
