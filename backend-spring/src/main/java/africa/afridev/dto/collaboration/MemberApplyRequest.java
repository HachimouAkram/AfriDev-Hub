package africa.afridev.dto.collaboration;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberApplyRequest {

    @NotBlank(message = "Le rôle souhaité est requis (ex: Développeur Frontend, DevOps, etc.)")
    private String role;

    private String message;

    private String cvUrl;
}
