package africa.afridev.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportCreateRequest {

    @NotBlank(message = "Le type de ressource est obligatoire")
    private String resource;

    @NotBlank(message = "L'ID de la ressource est obligatoire")
    private String resourceId;

    @NotBlank(message = "Le motif du signalement est obligatoire")
    private String reason;
}
