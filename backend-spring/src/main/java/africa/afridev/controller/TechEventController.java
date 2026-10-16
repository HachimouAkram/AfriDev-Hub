package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.event.EventVoteRequest;
import africa.afridev.dto.event.TechEventCreateRequest;
import africa.afridev.dto.event.TechEventDto;
import africa.afridev.model.enums.TechEventType;
import africa.afridev.service.TechEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class TechEventController {

    private final TechEventService eventService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TechEventDto>>> getEvents(
            @RequestParam(required = false) TechEventType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        Page<TechEventDto> events = eventService.getEvents(type, PageRequest.of(page, size), email);
        return ResponseEntity.ok(ApiResponse.ok(events));
    }

    @GetMapping("/my-events")
    public ResponseEntity<ApiResponse<java.util.List<TechEventDto>>> getMyEvents(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Vous devez être connecté."));
        }
        java.util.List<TechEventDto> myEvents = eventService.getMyEvents(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(myEvents));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TechEventDto>> getEventById(
            @PathVariable String id,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        TechEventDto event = eventService.getEventById(id, email);
        return ResponseEntity.ok(ApiResponse.ok(event));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TechEventDto>> updateEvent(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody TechEventCreateRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Vous devez être connecté."));
        }
        TechEventDto event = eventService.updateEvent(id, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(event));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TechEventDto>> createEvent(
            Authentication authentication,
            @Valid @RequestBody TechEventCreateRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Vous devez être connecté pour publier un événement."));
        }
        TechEventDto event = eventService.createEvent(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(event));
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<ApiResponse<TechEventDto>> voteEvent(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody EventVoteRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Vous devez être connecté pour soutenir ou réagir à un événement."));
        }
        TechEventDto event = eventService.voteEvent(id, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(event));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteEvent(
            @PathVariable String id,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Non autorisé."));
        }
        eventService.deleteEvent(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Événement supprimé avec succès")));
    }
}
