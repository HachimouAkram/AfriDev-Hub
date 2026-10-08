package africa.afridev.dto.opportunity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApplicationCreateRequest {

    @NotBlank(message = "Le message de motivation est obligatoire")
    @Size(max = 1000, message = "Le message ne peut pas dépasser 1000 caractères")
    private String message;

    private String cvUrl;
}
