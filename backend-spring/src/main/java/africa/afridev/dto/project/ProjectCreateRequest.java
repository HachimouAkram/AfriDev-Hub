package africa.afridev.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ProjectCreateRequest {

    @NotBlank(message = "Le titre du projet est obligatoire")
    @Size(min = 3, max = 100, message = "Le titre doit comporter au moins 3 caractères")
    private String title;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 3, max = 2000, message = "La description doit comporter au moins 3 caractères")
    private String description;

    private List<String> stack;
    private String repoUrl;
    private String demoUrl;
    private List<String> screenshots;
    private Boolean isOpenSource;
}
