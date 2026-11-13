package africa.afridev.dto.admin;

import africa.afridev.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAdminRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le nom complet est obligatoire")
    private String fullName;

    private String title;

    private String country;

    private String city;

    @NotNull(message = "Le rôle administratif est obligatoire")
    private Role role; // ADMIN ou SUPER_ADMIN
}


