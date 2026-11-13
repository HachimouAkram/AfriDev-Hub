package africa.afridev.dto.auth;

import africa.afridev.model.enums.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GithubAuthRequest {

    @NotBlank(message = "Le code d'autorisation GitHub est requis")
    private String code;

    private Role role;
}

