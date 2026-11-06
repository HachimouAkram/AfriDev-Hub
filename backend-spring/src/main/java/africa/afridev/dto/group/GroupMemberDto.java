package africa.afridev.dto.group;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.enums.GroupMemberRole;
import africa.afridev.model.enums.GroupMemberStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GroupMemberDto {
    private String id;
    private String groupId;
    private UserDto user;
    private GroupMemberRole role;
    private GroupMemberStatus status;
    private LocalDateTime joinedAt;
}
