package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.collaboration.*;
import africa.afridev.service.ProjectCollaborationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projects/{projectId}/collaboration")
@RequiredArgsConstructor
public class ProjectCollaborationController {

    private final ProjectCollaborationService collaborationService;

    // ── GESTION DES MEMBRES ──────────────────────────────────────────────────

    @PostMapping("/members")
    public ResponseEntity<ApiResponse<ProjectMemberDto>> applyToJoin(
            @PathVariable String projectId,
            Authentication authentication,
            @Valid @RequestBody MemberApplyRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Vous devez être connecté pour postuler."));
        }
        ProjectMemberDto member = collaborationService.applyToJoin(projectId, authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(member));
    }

    @GetMapping("/members")
    public ResponseEntity<ApiResponse<List<ProjectMemberDto>>> getMembers(@PathVariable String projectId) {
        List<ProjectMemberDto> members = collaborationService.getProjectMembers(projectId);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    @PatchMapping("/members/{memberId}")
    public ResponseEntity<ApiResponse<ProjectMemberDto>> updateMemberStatus(
            @PathVariable String projectId,
            @PathVariable String memberId,
            Authentication authentication,
            @Valid @RequestBody MemberStatusUpdateRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Non autorisé."));
        }
        ProjectMemberDto member = collaborationService.updateMemberStatus(projectId, memberId, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(member));
    }

    // ── GESTION DES TÂCHES KANBAN ─────────────────────────────────────────────

    @PostMapping("/tasks")
    public ResponseEntity<ApiResponse<ProjectTaskDto>> createTask(
            @PathVariable String projectId,
            Authentication authentication,
            @Valid @RequestBody TaskCreateRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Vous devez être connecté."));
        }
        ProjectTaskDto task = collaborationService.createTask(projectId, authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(task));
    }

    @GetMapping("/tasks")
    public ResponseEntity<ApiResponse<List<ProjectTaskDto>>> getTasks(
            @PathVariable String projectId,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        List<ProjectTaskDto> tasks = collaborationService.getProjectTasks(projectId, email);
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    @PatchMapping("/tasks/{taskId}")
    public ResponseEntity<ApiResponse<ProjectTaskDto>> updateTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            Authentication authentication,
            @RequestBody TaskUpdateRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Non autorisé."));
        }
        ProjectTaskDto task = collaborationService.updateTask(projectId, taskId, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(task));
    }

    @PostMapping("/tasks/{taskId}/validate")
    public ResponseEntity<ApiResponse<ProjectTaskDto>> validateTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Non autorisé."));
        }
        ProjectTaskDto task = collaborationService.validateTask(projectId, taskId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(task));
    }

    @PostMapping("/tasks/{taskId}/reject")
    public ResponseEntity<ApiResponse<ProjectTaskDto>> rejectTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Non autorisé."));
        }
        String reason = body != null ? body.get("reason") : null;
        ProjectTaskDto task = collaborationService.rejectTask(projectId, taskId, authentication.getName(), reason);
        return ResponseEntity.ok(ApiResponse.ok(task));
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Non autorisé."));
        }
        collaborationService.deleteTask(projectId, taskId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Tâche supprimée avec succès")));
    }

    // ── MÉTRIQUES DE SUIVI DU PROJET ─────────────────────────────────────────

    @GetMapping("/progress")
    public ResponseEntity<ApiResponse<ProjectProgressDto>> getProgress(
            @PathVariable String projectId,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        ProjectProgressDto progress = collaborationService.getProjectProgress(projectId, email);
        return ResponseEntity.ok(ApiResponse.ok(progress));
    }
}
