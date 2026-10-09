package africa.afridev.dto.message;

import africa.afridev.dto.auth.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummaryDto {
    private UserDto partner;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Boolean isLastMessageFromMe;
    private Boolean isRead;
}
