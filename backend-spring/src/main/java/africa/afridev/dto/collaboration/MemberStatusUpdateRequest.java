package africa.afridev.dto.collaboration;

import africa.afridev.model.enums.MemberStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberStatusUpdateRequest {

    @NotNull(message = "Le statut est requis (ACCEPTED, REJECTED)")
    private MemberStatus status;
}
