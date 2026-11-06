package africa.afridev.dto.chat;

import africa.afridev.model.enums.GroupChannelType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GroupChannelDto {
    private String id;
    private String groupId;
    private String name;
    private String description;
    private GroupChannelType type;
    private Boolean isDefault;
    private Integer position;
    private LocalDateTime createdAt;
}

