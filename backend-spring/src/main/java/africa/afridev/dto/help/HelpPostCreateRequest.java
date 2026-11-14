package africa.afridev.dto.help;

import africa.afridev.model.enums.HelpPostType;
import africa.afridev.model.enums.HelpPostVisibility;
import africa.afridev.model.enums.DeveloperLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO de création / mise à jour d'une publication d'aide.
 */
@Data
public class HelpPostCreateRequest {

    @NotBlank(message = "Le titre est obligatoire.")
    @Size(min = 5, max = 200, message = "Le titre doit contenir entre 5 et 200 caractères.")
    private String title;

    @NotBlank(message = "La description est obligatoire.")
    @Size(min = 20, message = "La description doit contenir au moins 20 caractères.")
    private String description;

    private HelpPostType type = HelpPostType.ORIENTATION;

    private List<String> tags = new ArrayList<>();

    private List<String> screenshotUrls = new ArrayList<>();

    private DeveloperLevel niveauDemandeur;

    private HelpPostVisibility visibility = HelpPostVisibility.PUBLIQUE;
}

