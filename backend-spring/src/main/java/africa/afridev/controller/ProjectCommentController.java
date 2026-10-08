package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.project.ProjectCommentCreateRequest;
import africa.afridev.dto.project.ProjectCommentDto;
import africa.afridev.service.ProjectCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/comments")
@RequiredArgsConstructor
public class ProjectCommentController {

    private final ProjectCommentService commentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectCommentDto>>> getComments(@PathVariable String projectId) {
        List<ProjectCommentDto> comments = commentService.getCommentsForProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(comments));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectCommentDto>> addComment(
            @PathVariable String projectId,
            Authentication authentication,
            @Valid @RequestBody ProjectCommentCreateRequest request
    ) {
        ProjectCommentDto comment = commentService.addComment(authentication.getName(), projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(comment));
    }
}
