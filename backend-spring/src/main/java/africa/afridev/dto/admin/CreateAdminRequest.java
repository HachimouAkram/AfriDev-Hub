package africa.afridev.dto.admin;

import africa.afridev.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    @NotBlank(message = "Le mot de passe initial est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit comporter au moins 8 caractères")
    private String password;

    @NotBlank(message = "Le nom complet est obligatoire")
    private String fullName;

    private String title;

    private String country;

    private String city;

    @NotNull(message = "Le rôle administratif est obligatoire")
    private Role role; // ADMIN ou SUPER_ADMIN
}

