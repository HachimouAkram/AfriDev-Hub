package africa.afridev.dto.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MessageCreateRequest {

    @NotBlank(message = "Le destinataire est obligatoire")
    private String recipientId;

    @NotBlank(message = "Le message ne peut pas être vide")
    @Size(min = 1, max = 2000, message = "Le message doit comporter entre 1 et 2000 caractères")
    private String content;
}
