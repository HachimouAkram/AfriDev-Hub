package africa.afridev.dto.help;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO de création d'un commentaire sur une publication d'aide.
 */
@Data
public class HelpCommentCreateRequest {

    @NotBlank(message = "Le contenu du commentaire est obligatoire.")
    @Size(min = 2, max = 5000, message = "Le commentaire doit contenir entre 2 et 5000 caractères.")
    private String content;

    /** Identifiant du commentaire parent (optionnel — pour les sous-réponses) */
    private String parentCommentId;
}

