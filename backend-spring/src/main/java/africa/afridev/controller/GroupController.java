package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.group.*;
import africa.afridev.model.enums.GroupMemberRole;
import africa.afridev.model.enums.GroupMemberStatus;
import africa.afridev.model.enums.GroupPostType;
import africa.afridev.service.CommunityGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur REST pour la gestion des Groupes & Communautés Tech (Phase 3).
 * Base URL : /api/v1/groups
 */
@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class GroupController {

    private final CommunityGroupService groupService;

    // ==========================================
    // 3.2 & 3.11 : DÉCOUVERTE & CRUD GROUPES
    // ==========================================

    @GetMapping
    public ResponseEntity<ApiResponse<Page<GroupDto>>> searchGroups(
            Authentication authentication,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        String email = authentication != null ? authentication.getName() : null;
        PageRequest pageable = PageRequest.of(page, size, Sort.by("memberCount").descending());
        Page<GroupDto> groups = groupService.searchGroups(country, tag, query, email, pageable);
        return ResponseEntity.ok(ApiResponse.ok(groups,
                Map.of("page", page, "perPage", size, "total", groups.getTotalElements())));
    }

    @GetMapping("/my-groups")
    public ResponseEntity<ApiResponse<Page<GroupDto>>> getMyGroups(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<GroupDto> groups = groupService.getMyGroups(authentication.getName(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(groups,
                Map.of("page", page, "perPage", size, "total", groups.getTotalElements())));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<GroupDto>> getGroupBySlug(
            @PathVariable String slug,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.ok(groupService.getGroupBySlug(slug, email)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupDto>> getGroupById(
            @PathVariable String id,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.ok(groupService.getGroupById(id, email)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GroupDto>> createGroup(
            Authentication authentication,
            @Valid @RequestBody GroupCreateRequest request
    ) {
        GroupDto group = groupService.createGroup(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(group));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupDto>> updateGroup(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody GroupCreateRequest request
    ) {
        GroupDto group = groupService.updateGroup(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(group));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable String id,
            Authentication authentication
    ) {
        groupService.deleteGroup(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ==========================================
    // 3.3 & 3.4 : ADHÉSION & GESTION DES MEMBRES
    // ==========================================

    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<GroupMemberDto>> joinGroup(
            @PathVariable String id,
            Authentication authentication
    ) {
        GroupMemberDto member = groupService.joinGroup(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(member));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable String id,
            Authentication authentication
    ) {
        groupService.leaveGroup(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<Page<GroupMemberDto>>> getMembers(
            @PathVariable String id,
            @RequestParam(defaultValue = "ACTIVE") GroupMemberStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(groupService.getMembers(id, status, pageable)));
    }

    @PatchMapping("/{id}/members/{userId}/role")
    public ResponseEntity<ApiResponse<GroupMemberDto>> updateRole(
            @PathVariable String id,
            @PathVariable String userId,
            @RequestParam GroupMemberRole role,
            Authentication authentication
    ) {
        GroupMemberDto member = groupService.updateMemberRole(authentication.getName(), id, userId, role);
        return ResponseEntity.ok(ApiResponse.ok(member));
    }

    @PatchMapping("/{id}/members/{userId}/status")
    public ResponseEntity<ApiResponse<Void>> moderateMember(
            @PathVariable String id,
            @PathVariable String userId,
            @RequestParam GroupMemberStatus status,
            Authentication authentication
    ) {
        groupService.moderateMember(authentication.getName(), id, userId, status);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ==========================================
    // 3.5 & 3.6 : PUBLICATIONS DU GROUPE
    // ==========================================

    @PostMapping("/{id}/posts")
    public ResponseEntity<ApiResponse<GroupPostDto>> createPost(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody GroupPostCreateRequest request
    ) {
        GroupPostDto post = groupService.createPost(authentication.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(post));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<ApiResponse<Page<GroupPostDto>>> getGroupFeed(
            @PathVariable String id,
            Authentication authentication,
            @RequestParam(required = false) GroupPostType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        String email = authentication != null ? authentication.getName() : null;
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(groupService.getGroupFeed(id, email, type, pageable)));
    }

    @DeleteMapping("/{id}/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable String id,
            @PathVariable String postId,
            Authentication authentication
    ) {
        groupService.deletePost(authentication.getName(), id, postId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
