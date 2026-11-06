package africa.afridev.dto.chat;

import africa.afridev.dto.auth.UserDto;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GroupChatMessageDto {
    private String id;
    private String channelId;
    private String groupId;
    private UserDto sender;
    private String content;
    private String attachmentUrl;
    private String parentMessageId;
    private Boolean isPinned;
    private LocalDateTime createdAt;
    private Boolean isOwnMessage;
}

