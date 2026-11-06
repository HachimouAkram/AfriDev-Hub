package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.chat.GroupChannelCreateRequest;
import africa.afridev.dto.chat.GroupChannelDto;
import africa.afridev.dto.chat.GroupChatMessageDto;
import africa.afridev.dto.chat.GroupChatMessageRequest;
import africa.afridev.service.GroupChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour le Chat et les Canaux de Groupe (Phase 4).
 * Base URL : /api/v1/groups/{groupId}/chat
 */
@RestController
@RequestMapping("/groups/{groupId}/chat")
@RequiredArgsConstructor
public class GroupChatController {

    private final GroupChatService chatService;

    // ==========================================
    // CANAUX
    // ==========================================

    @GetMapping("/channels")
    public ResponseEntity<ApiResponse<List<GroupChannelDto>>> getChannels(
            @PathVariable String groupId,
            Authentication authentication
    ) {
        List<GroupChannelDto> channels = chatService.getGroupChannels(authentication.getName(), groupId);
        return ResponseEntity.ok(ApiResponse.ok(channels));
    }

    @PostMapping("/channels")
    public ResponseEntity<ApiResponse<GroupChannelDto>> createChannel(
            @PathVariable String groupId,
            Authentication authentication,
            @Valid @RequestBody GroupChannelCreateRequest request
    ) {
        GroupChannelDto channel = chatService.createChannel(authentication.getName(), groupId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(channel));
    }

    @DeleteMapping("/channels/{channelId}")
    public ResponseEntity<ApiResponse<Void>> deleteChannel(
            @PathVariable String groupId,
            @PathVariable String channelId,
            Authentication authentication
    ) {
        chatService.deleteChannel(authentication.getName(), groupId, channelId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ==========================================
    // MESSAGES
    // ==========================================

    @GetMapping("/channels/{channelId}/messages")
    public ResponseEntity<ApiResponse<Page<GroupChatMessageDto>>> getMessages(
            @PathVariable String groupId,
            @PathVariable String channelId,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<GroupChatMessageDto> messages = chatService.getChannelMessages(authentication.getName(), channelId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @PostMapping("/channels/{channelId}/messages")
    public ResponseEntity<ApiResponse<GroupChatMessageDto>> sendMessage(
            @PathVariable String groupId,
            @PathVariable String channelId,
            Authentication authentication,
            @Valid @RequestBody GroupChatMessageRequest request
    ) {
        GroupChatMessageDto message = chatService.sendMessage(authentication.getName(), channelId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(message));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable String groupId,
            @PathVariable String messageId,
            Authentication authentication
    ) {
        chatService.deleteMessage(authentication.getName(), messageId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}

