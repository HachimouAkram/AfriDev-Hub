package africa.afridev.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectCommentCreateRequest {

    @NotBlank(message = "Le commentaire ne peut pas être vide")
    @Size(min = 2, max = 1000, message = "Le commentaire doit comporter entre 2 et 1000 caractères")
    private String content;
}
