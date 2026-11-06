package africa.afridev.dto.help;

import africa.afridev.dto.auth.UserDto;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de réponse pour un commentaire sur une publication d'aide.
 */
@Data
@Builder
public class HelpCommentDto {

    private String id;
    private String helpPostId;
    private UserDto author;
    private String content;
    private String parentCommentId;
    private Boolean isAccepted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Sous-réponses (niveau 1 seulement) */
    private List<HelpCommentDto> replies;
}

