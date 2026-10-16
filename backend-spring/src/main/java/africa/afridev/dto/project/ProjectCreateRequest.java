package africa.afridev.dto.project;

import africa.afridev.model.enums.ProjectType;
import africa.afridev.model.enums.SaleType;
import africa.afridev.model.enums.SaasPricingType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProjectCreateRequest {

    @NotBlank(message = "Le titre du projet est obligatoire")
    @Size(min = 3, max = 100, message = "Le titre doit comporter au moins 3 caractères")
    private String title;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 3, max = 2000, message = "La description doit comporter au moins 3 caractères")
    private String description;

    private List<String> stack;
    private String repoUrl;
    private String demoUrl;
    private List<String> screenshots;
    private Boolean isOpenSource;

    private ProjectType projectType;
    private BigDecimal price;
    private String currency;
    private SaleType saleType;
    private SaasPricingType saasPricingType;
    private String licenseType;
    private String demoAccountInfo;
    private String companyName;
    private String companyRole;
    private String youtubeUrl;
    private String documentationPdfUrl;
    private Integer maxMembers;
}
