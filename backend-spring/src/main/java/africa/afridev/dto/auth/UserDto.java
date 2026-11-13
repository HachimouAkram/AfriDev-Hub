package africa.afridev.dto.auth;

import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private String id;
    private String email;
    private Boolean emailVerified;
    private Boolean mustChangePassword;
    private Boolean twoFactorEnabled;
    private String githubId;
    private Role role;
    private UserStatus status;
    private ProfileDto profile;
}
