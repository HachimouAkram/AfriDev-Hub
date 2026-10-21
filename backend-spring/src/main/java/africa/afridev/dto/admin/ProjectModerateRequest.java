package africa.afridev.dto.admin;

import africa.afridev.model.enums.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectModerateRequest {

    @NotNull(message = "Le statut de modération est obligatoire (ex: HIDDEN, PUBLISHED, DELETED).")
    private ContentStatus status;

    @NotBlank(message = "Le motif de la décision de modération est obligatoire et sera consigné dans l'audit log.")
    private String reason;

    @Builder.Default
    private Boolean notifyAuthor = true;
}
