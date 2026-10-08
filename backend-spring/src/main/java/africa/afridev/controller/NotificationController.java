package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.notification.NotificationDto;
import africa.afridev.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUserNotifications(Authentication authentication) {
        List<NotificationDto> notifications = notificationService.getUserNotifications(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(notifications));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Map<String, String>>> markAsRead(
            @PathVariable String id,
            Authentication authentication
    ) {
        notificationService.markAsRead(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Notification marquée comme lue.")));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, String>>> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Toutes les notifications ont été marquées comme lues.")));
    }
}
