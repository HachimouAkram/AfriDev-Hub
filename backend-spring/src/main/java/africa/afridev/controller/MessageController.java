package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.message.MessageCreateRequest;
import africa.afridev.dto.message.MessageDto;
import africa.afridev.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<ApiResponse<MessageDto>> sendMessage(
            Authentication authentication,
            @Valid @RequestBody MessageCreateRequest request
    ) {
        MessageDto message = messageService.sendMessage(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(message));
    }

    @GetMapping("/with/{targetUserId}")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getConversation(
            @PathVariable String targetUserId,
            Authentication authentication
    ) {
        List<MessageDto> messages = messageService.getConversation(authentication.getName(), targetUserId);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<UserDto>>> getRecentConversations(Authentication authentication) {
        List<UserDto> conversations = messageService.getRecentConversations(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(conversations));
    }
}
