package africa.afridev.dto.admin;

import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserAdminDto {
    private String id;
    private String email;
    private Boolean emailVerified;
    private Boolean twoFactorEnabled;
    private Role role;
    private UserStatus status;
    private String fullName;
    private String country;
    private String city;
    private String title;
    private String avatarUrl;
    private Boolean mobileMoneyVerified;
    private Long xpPoints;
    private String levelTitle;
    private Integer completionScore;
    private long projectsCount;
    private long opportunitiesCount;
    private long reportsCount;
    private LocalDateTime createdAt;
}
