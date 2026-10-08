package africa.afridev.dto.admin;

import africa.afridev.model.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserStatusUpdateRequest {

    @NotNull(message = "Le nouveau statut utilisateur est obligatoire")
    private UserStatus status;

    private String reason;
}
