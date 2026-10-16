package africa.afridev.dto.collaboration;

import africa.afridev.model.enums.MemberStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMemberDto {
    private String id;
    private String projectId;
    private String userId;
    private String userName;
    private String userEmail;
    private String userAvatar;
    private String userTitle;
    private String role;
    private String message;
    private String cvUrl;
    private MemberStatus status;
    private LocalDateTime joinedAt;
    private LocalDateTime createdAt;
}
