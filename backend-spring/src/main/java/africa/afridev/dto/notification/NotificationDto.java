package africa.afridev.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDto {
    private String id;
    private String type;
    private String title;
    private String body;
    private String link;
    private Boolean read;
    private LocalDateTime createdAt;
}
