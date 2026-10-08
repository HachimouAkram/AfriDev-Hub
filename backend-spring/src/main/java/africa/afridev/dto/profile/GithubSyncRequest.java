package africa.afridev.dto.profile;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GithubSyncRequest {

    @NotBlank(message = "Le nom d'utilisateur GitHub est obligatoire")
    private String githubUsername;
}
