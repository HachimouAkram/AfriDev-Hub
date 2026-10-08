package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.follow.FollowStatsDto;
import africa.afridev.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/profiles/{userId}/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<FollowStatsDto>> getStats(
            @PathVariable String userId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        FollowStatsDto stats = followService.getFollowStats(email, userId);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FollowStatsDto>> followUser(
            @PathVariable String userId,
            Authentication authentication
    ) {
        FollowStatsDto stats = followService.followUser(authentication.getName(), userId);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<FollowStatsDto>> unfollowUser(
            @PathVariable String userId,
            Authentication authentication
    ) {
        FollowStatsDto stats = followService.unfollowUser(authentication.getName(), userId);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/followers")
    public ResponseEntity<ApiResponse<List<UserDto>>> getFollowers(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(followService.getFollowers(userId)));
    }

    @GetMapping("/following")
    public ResponseEntity<ApiResponse<List<UserDto>>> getFollowing(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(followService.getFollowing(userId)));
    }
}
