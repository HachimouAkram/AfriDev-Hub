package africa.afridev.dto.evaluation;

import africa.afridev.model.enums.CollaborationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CollaborationCreateRequest {

    @NotBlank(message = "L'identifiant du partenaire est obligatoire")
    private String partnerId;

    @NotNull(message = "Le type de collaboration est obligatoire")
    private CollaborationType type;

    @NotBlank(message = "Le lien de preuve (PR, Repo, Commit) est obligatoire")
    private String proofUrl;
}
