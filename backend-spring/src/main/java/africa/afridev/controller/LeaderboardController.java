package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.leaderboard.LeaderboardResponse;
import africa.afridev.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/leaderboard", "/api/v1/leaderboard", "/api/leaderboard"})
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getPublicLeaderboard() {
        LeaderboardResponse response = leaderboardService.getPublicLeaderboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getMyLeaderboard(Authentication authentication) {
        String identifier = resolveUserIdentifier(authentication);
        LeaderboardResponse response = leaderboardService.getLeaderboardForUser(identifier);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<LeaderboardResponse>> searchLeaderboard(
            @RequestParam(required = false) String q,
            Authentication authentication
    ) {
        String identifier = resolveUserIdentifier(authentication);
        LeaderboardResponse response = leaderboardService.searchLeaderboard(q, identifier);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getLeaderboard(
            @RequestParam(required = false) String q,
            Authentication authentication
    ) {
        String identifier = resolveUserIdentifier(authentication);
        LeaderboardResponse response;
        if (q != null && !q.trim().isBlank()) {
            response = leaderboardService.searchLeaderboard(q, identifier);
        } else if (identifier != null) {
            response = leaderboardService.getLeaderboardForUser(identifier);
        } else {
            response = leaderboardService.getPublicLeaderboard();
        }
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private String resolveUserIdentifier(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return authentication.getName();
    }
}
