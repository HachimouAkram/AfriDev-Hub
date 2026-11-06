package africa.afridev.dto.help;

import africa.afridev.model.enums.HelpPostStatus;
import africa.afridev.model.enums.HelpPostType;
import africa.afridev.model.enums.HelpPostVisibility;
import africa.afridev.model.enums.DeveloperLevel;
import africa.afridev.dto.auth.UserDto;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de réponse pour une publication d'aide.
 */
@Data
@Builder
public class HelpPostDto {

    private String id;
    private UserDto author;
    private String title;
    private String description;
    private HelpPostType type;
    private List<String> tags;
    private DeveloperLevel niveauDemandeur;
    private HelpPostStatus status;
    private HelpPostVisibility visibility;
    private Integer commentsCount;
    private Integer viewsCount;
    private UserDto resolvedBy;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Indique si l'utilisateur connecté est l'auteur */
    private Boolean isAuthor;
}
