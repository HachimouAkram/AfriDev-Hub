package africa.afridev.dto.evaluation;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.enums.CollaborationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CollaborationDto {
    private String id;
    private UserDto initiator;
    private UserDto partner;
    private CollaborationType type;
    private String proofUrl;
    private Boolean verified;
    private Boolean evaluatedByCurrentUser;
    private LocalDateTime createdAt;
}
