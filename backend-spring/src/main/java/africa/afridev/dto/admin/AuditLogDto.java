package africa.afridev.dto.admin;

import africa.afridev.dto.auth.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuditLogDto {
    private String id;
    private UserDto user;
    private String action;
    private String resource;
    private String resourceId;
    private String metadataJson;
    private String ipAddress;
    private LocalDateTime createdAt;
}
