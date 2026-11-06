package africa.afridev.dto.group;

import africa.afridev.model.enums.GroupAccessType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class GroupCreateRequest {

    @NotBlank(message = "Le nom du groupe est obligatoire.")
    @Size(min = 3, max = 100, message = "Le nom du groupe doit contenir entre 3 et 100 caractères.")
    private String name;

    @NotBlank(message = "Le slug du groupe est obligatoire.")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets.")
    @Size(min = 3, max = 100)
    private String slug;

    @NotBlank(message = "La description est obligatoire.")
    @Size(min = 10, max = 2500, message = "La description doit contenir entre 10 et 2500 caractères.")
    private String description;

    private GroupAccessType accessType = GroupAccessType.PUBLIC;

    private List<String> tags = new ArrayList<>();

    private String country;
    private String city;
    private String rulesMarkdown;
    private String avatarUrl;
    private String bannerUrl;
}
