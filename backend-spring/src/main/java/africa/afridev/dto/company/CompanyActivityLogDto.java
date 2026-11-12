package africa.afridev.dto.company;

import africa.afridev.model.enums.CompanyActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompanyActivityLogDto {
    private String id;
    private String companyId;
    private String actorId;
    private String actorName;
    private String actorEmail;
    private String actorAvatarUrl;
    private CompanyActivityType activityType;
    private String targetId;
    private String targetType;
    private String description;
    private LocalDateTime createdAt;
}

