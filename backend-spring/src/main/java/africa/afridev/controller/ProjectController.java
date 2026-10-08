package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.project.ProjectCreateRequest;
import africa.afridev.dto.project.ProjectDto;
import africa.afridev.service.ProjectService;
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
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectDto>>> getAllProjects(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String email = authentication != null ? authentication.getName() : null;
        Page<ProjectDto> projects = projectService.getAllProjects(email, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(projects, Map.of("page", page, "perPage", size, "total", projects.getTotalElements())));
    }

    @GetMapping("/user/{authorId}")
    public ResponseEntity<ApiResponse<Page<ProjectDto>>> getProjectsByAuthorId(
            @PathVariable String authorId,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String email = authentication != null ? authentication.getName() : null;
        Page<ProjectDto> projects = projectService.getProjectsByAuthorId(authorId, email, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(projects, Map.of("page", page, "perPage", size, "total", projects.getTotalElements())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> getProjectById(
            @PathVariable String id,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        ProjectDto project = projectService.getProjectById(id, email);
        return ResponseEntity.ok(ApiResponse.ok(project));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(
            Authentication authentication,
            @Valid @RequestBody ProjectCreateRequest request
    ) {
        ProjectDto project = projectService.createProject(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(project));
    }

    @PostMapping("/{id}/recognize")
    public ResponseEntity<ApiResponse<ProjectDto>> recognizeProject(
            @PathVariable String id,
            Authentication authentication
    ) {
        ProjectDto project = projectService.recognizeProject(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(project));
    }

    @DeleteMapping("/{id}/recognize")
    public ResponseEntity<ApiResponse<ProjectDto>> unrecognizeProject(
            @PathVariable String id,
            Authentication authentication
    ) {
        ProjectDto project = projectService.unrecognizeProject(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(project));
    }
}
