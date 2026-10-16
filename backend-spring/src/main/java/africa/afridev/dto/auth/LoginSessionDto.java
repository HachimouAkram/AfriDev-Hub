package africa.afridev.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginSessionDto {
    private String id;
    private String deviceId;
    private String deviceType;
    private String deviceName;
    private String browser;
    private String operatingSystem;
    private String ipAddress;
    private String location;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime lastActiveAt;
    private Boolean isCurrent;
}
