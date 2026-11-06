package africa.afridev.dto.group;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.enums.GroupPostType;
import africa.afridev.model.enums.GroupPostVisibility;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class GroupPostDto {
    private String id;
    private String groupId;
    private UserDto author;
    private String title;
    private String content;
    private GroupPostType type;
    private GroupPostVisibility visibility;
    private Boolean isPinned;
    private List<String> attachments;
    private Integer likesCount;
    private Integer commentsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean canEditOrDelete;
}
