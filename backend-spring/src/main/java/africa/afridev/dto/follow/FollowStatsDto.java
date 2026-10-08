package africa.afridev.dto.follow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowStatsDto {
    private long followersCount;
    private long followingCount;
    private boolean followedByCurrentUser;
    private boolean followsCurrentUser;
}
