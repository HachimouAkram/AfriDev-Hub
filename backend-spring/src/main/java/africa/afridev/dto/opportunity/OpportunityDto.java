package africa.afridev.dto.opportunity;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.OpportunityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OpportunityDto {
    private String id;
    private UserDto publisher;
    private String title;
    private String description;
    private OpportunityType type;
    private String location;
    private Boolean isRemote;
    private List<String> stack;
    private String budget;
    private LocalDateTime deadline;
    private Integer maxApplicants;
    private Integer acceptedCount;
    private Boolean isPaid;
    private ContentStatus status;
    private LocalDateTime createdAt;

    // Informations entreprise si publiée au nom d'une entreprise
    private String companyId;
    private String companyName;
    private String companySlug;
    private String companyLogoUrl;
    private String companyBadge;
    private String companyLevel;

    // Champs de recommandation et affinité intelligente
    private Double matchPercentage;
    private String suggestionReason;
    private List<String> matchedStack;
    private Boolean isPublisherFollowed;
    private Boolean hasApplied;
}
