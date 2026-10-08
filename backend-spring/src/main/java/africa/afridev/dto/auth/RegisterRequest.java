package africa.afridev.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class RegisterRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    @NotBlank(message = "Le nom complet est obligatoire")
    private String fullName;

    @NotBlank(message = "Le pays est obligatoire")
    private String country;

    @NotBlank(message = "La ville est obligatoire")
    private String city;

    @NotBlank(message = "Le titre professionnel est obligatoire")
    private String title;

    private String bio;

    private List<String> skills;
}
