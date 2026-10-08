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
public class MessageDto {
    private String id;
    private UserDto sender;
    private UserDto recipient;
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
