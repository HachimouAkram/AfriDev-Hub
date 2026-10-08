package africa.afridev.dto.evaluation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EvaluationCreateRequest {

    @NotBlank(message = "L'identifiant du développeur évalué est obligatoire")
    private String evaluateeId;

    @NotBlank(message = "L'identifiant de la collaboration vérifiée est obligatoire")
    private String collaborationId;

    @NotNull(message = "La note Qualité du Code est obligatoire")
    @Min(value = 1, message = "La note doit être entre 1 et 5")
    @Max(value = 5, message = "La note doit être entre 1 et 5")
    private Integer codeQuality;

    @NotNull(message = "La note Collaboration est obligatoire")
    @Min(value = 1, message = "La note doit être entre 1 et 5")
    @Max(value = 5, message = "La note doit être entre 1 et 5")
    private Integer collaborationRating;

    @NotNull(message = "La note Profondeur Technique est obligatoire")
    @Min(value = 1, message = "La note doit être entre 1 et 5")
    @Max(value = 5, message = "La note doit être entre 1 et 5")
    private Integer technicalDepth;

    @NotNull(message = "La note Fiabilité est obligatoire")
    @Min(value = 1, message = "La note doit être entre 1 et 5")
    @Max(value = 5, message = "La note doit être entre 1 et 5")
    private Integer reliability;

    private String feedback;
    private Boolean isPublic = true;
}
