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
    private Boolean isMonetized;
    private String payoutPhoneNumber;
    private String payoutOperator;
    private List<String> acceptedPaymentMethods;
    private SaleType saleType;
    private SaasPricingType saasPricingType;
    private String licenseType;
    private String demoAccountInfo;
    private String companyName;
    private String companyRole;
    private String youtubeUrl;
    private String documentationPdfUrl;
    private Integer maxMembers;

    private Integer recognitionsCount;
    private Integer viewsCount;
    private Boolean recognizedByCurrentUser;
    private ContentStatus status;
    private LocalDateTime createdAt;
    private Double matchPercentage;
    private String suggestionReason;
    private List<String> matchedStack;
    private Boolean isAuthorFollowed;
}
