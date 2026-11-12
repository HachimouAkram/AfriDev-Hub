package africa.afridev.dto.company;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateCompanyRequest {
    @NotBlank(message = "Le nom de l'entreprise est obligatoire")
    private String name;

    private String description;
    private String websiteUrl;
    private String linkedinUrl;
    private String twitterUrl;
    private String logoUrl;
    private String bannerUrl;

    @NotBlank(message = "Le pays est obligatoire")
    private String country;

    @NotBlank(message = "La ville est obligatoire")
    private String city;

    private String sector;
    private String companySize;
}

