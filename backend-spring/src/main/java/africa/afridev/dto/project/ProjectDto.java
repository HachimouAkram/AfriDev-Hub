package africa.afridev.dto.project;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.ProjectType;
import africa.afridev.model.enums.SaleType;
import africa.afridev.model.enums.SaasPricingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectDto {
    private String id;
    private UserDto author;
    private String title;
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

    private Integer recognitionsCount;
    private Boolean recognizedByCurrentUser;
    private ContentStatus status;
    private LocalDateTime createdAt;
}
