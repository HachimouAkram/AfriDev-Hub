package africa.afridev.dto.event;

import africa.afridev.model.enums.VoteType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventVoteRequest {

    @NotNull(message = "Le type de vote est requis (AGREE ou DISAGREE)")
    private VoteType voteType;
}
