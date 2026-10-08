package africa.afridev.dto.admin;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.enums.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportDto {
    private String id;
    private UserDto reporter;
    private String resource;
    private String resourceId;
    private String reason;
    private ReportStatus status;
    private String handledBy;
    private LocalDateTime handledAt;
    private LocalDateTime createdAt;
}
