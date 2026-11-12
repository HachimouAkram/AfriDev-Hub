package africa.afridev.dto.company;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCompanyRequest {
    private String name;
    private String description;
    private String websiteUrl;
    private String linkedinUrl;
    private String twitterUrl;
    private String logoUrl;
    private String bannerUrl;
    private String country;
    private String city;
    private String sector;
    private String companySize;
}

