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
    private final africa.afridev.service.ProjectCollaborationService collaborationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectDto>>> getAllProjects(
            Authentication authentication,
            @RequestParam(required = false) africa.afridev.model.enums.ProjectType projectType,
            @RequestParam(defaultValue = "SUGGESTED") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String email = authentication != null ? authentication.getName() : null;
        Page<ProjectDto> projects = projectService.getAllProjects(email, projectType, sort, PageRequest.of(page, size));
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

    @GetMapping("/{id}/source-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> downloadProjectSourceCode(
            @PathVariable String id,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Veuillez vous connecter pour télécharger le code source."));
        }
        String downloadUrl = projectService.getSourceCodeDownloadUrl(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("downloadUrl", downloadUrl)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(
            Authentication authentication,
            @Valid @RequestBody ProjectCreateRequest request
    ) {
        ProjectDto project = projectService.createProject(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(project));
    }

    @GetMapping("/my-projects")
    public ResponseEntity<ApiResponse<Page<ProjectDto>>> getMyProjects(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<ProjectDto> projects = projectService.getMyProjects(authentication.getName(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(projects, Map.of("page", page, "perPage", size, "total", projects.getTotalElements())));
    }

    @GetMapping("/my-collaborations")
    public ResponseEntity<ApiResponse<java.util.List<africa.afridev.dto.collaboration.ProjectProgressDto>>> getMyCollaborations(
            Authentication authentication
    ) {
        java.util.List<africa.afridev.dto.collaboration.ProjectProgressDto> collaborations = 
                collaborationService.getMyCollaborativeProjectsProgress(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(collaborations));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody ProjectCreateRequest request
    ) {
        ProjectDto project = projectService.updateProject(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(project));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<ProjectDto>> toggleProjectStatus(
            @PathVariable String id,
            Authentication authentication
    ) {
        ProjectDto project = projectService.toggleProjectStatus(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(project));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable String id,
            Authentication authentication
    ) {
        projectService.deleteProject(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
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

    @PostMapping("/{id}/view")
    public ResponseEntity<ApiResponse<ProjectDto>> recordProjectView(
            @PathVariable String id,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        ProjectDto project = projectService.recordView(id, email);
        return ResponseEntity.ok(ApiResponse.ok(project));
    }
}
