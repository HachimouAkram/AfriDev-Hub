package africa.afridev.dto.company;

import africa.afridev.model.enums.CompanyMemberRole;
import africa.afridev.model.enums.CompanyMemberStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompanyMemberDto {
    private String id;
    private String userId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String jobTitle;
    private CompanyMemberRole role;
    private CompanyMemberStatus status;
    private String invitedByUserId;
    private LocalDateTime joinedAt;
    private LocalDateTime createdAt;
}

