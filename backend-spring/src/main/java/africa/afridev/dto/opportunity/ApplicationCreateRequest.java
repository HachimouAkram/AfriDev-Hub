package africa.afridev.dto.opportunity;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApplicationCreateRequest {

    /** Lettre de motivation écrite (optionnelle si coverLetterUrl est fourni) */
    @Size(max = 3000, message = "La lettre de motivation ne peut pas dépasser 3000 caractères")
    private String message;

    private String cvUrl;

    /** Lettre de motivation au format PDF (optionnelle si message est fourni) */
    private String coverLetterUrl;
}
