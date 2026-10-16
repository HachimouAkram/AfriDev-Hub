package africa.afridev.dto.auth;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TwoFactorToggleRequest {

    @NotNull(message = "Le statut d'activation est requis")
    private Boolean enabled;
}
