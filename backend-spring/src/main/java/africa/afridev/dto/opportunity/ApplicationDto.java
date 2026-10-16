package africa.afridev.dto.opportunity;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.enums.ApplicationStatus;
import africa.afridev.model.enums.OpportunityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApplicationDto {
    private String id;
    private String opportunityId;
    private String opportunityTitle;
    private OpportunityType opportunityType;
    private String opportunityLocation;
    private String opportunityBudget;
    private String publisherId;
    private String publisherName;
    private UserDto applicant;
    private String message;
    private String cvUrl;
    private String coverLetterUrl;
    private ApplicationStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
}
