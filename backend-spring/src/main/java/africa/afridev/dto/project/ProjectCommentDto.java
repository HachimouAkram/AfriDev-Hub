package africa.afridev.dto.project;

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
public class ProjectCommentDto {
    private String id;
    private String projectId;
    private UserDto author;
    private String content;
    private LocalDateTime createdAt;
}
