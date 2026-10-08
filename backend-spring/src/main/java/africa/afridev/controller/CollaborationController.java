package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.evaluation.CollaborationCreateRequest;
import africa.afridev.dto.evaluation.CollaborationDto;
import africa.afridev.service.EvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/collaborations")
@RequiredArgsConstructor
public class CollaborationController {

    private final EvaluationService evaluationService;

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<CollaborationDto>>> getMyCollaborations(Authentication authentication) {
        List<CollaborationDto> list = evaluationService.getMyCollaborations(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CollaborationDto>> declareCollaboration(
            Authentication authentication,
            @Valid @RequestBody CollaborationCreateRequest request
    ) {
        CollaborationDto collaboration = evaluationService.declareCollaboration(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(collaboration));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<CollaborationDto>> verifyCollaboration(
            @PathVariable String id,
            Authentication authentication
    ) {
        CollaborationDto collaboration = evaluationService.verifyCollaboration(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(collaboration));
    }
}
