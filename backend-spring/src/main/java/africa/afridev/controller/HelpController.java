package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.help.*;
import africa.afridev.model.enums.HelpPostStatus;
import africa.afridev.model.enums.HelpPostType;
import africa.afridev.service.HelpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour le module Aide & Orientation.
 * Base URL : /api/v1/help
 */
@RestController
@RequestMapping("/help")
@RequiredArgsConstructor
public class HelpController {

    private final HelpService helpService;

    // =========================================================
    // PUBLICATIONS — HelpPost
    // =========================================================

    /**
     * GET /help — Lister les publications publiques avec filtres.
     * Tâches 1.4 (tags/catégories) et 1.5 (filtres & recherche).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<HelpPostDto>>> getPosts(
            Authentication authentication,
            @RequestParam(required = false) HelpPostType type,
            @RequestParam(required = false) HelpPostStatus status,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String email = authentication != null ? authentication.getName() : null;
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<HelpPostDto> posts = helpService.getPosts(email, type, status, query, tag, pageable);
        return ResponseEntity.ok(ApiResponse.ok(posts,
                Map.of("page", page, "perPage", size, "total", posts.getTotalElements())));
    }

    /**
     * GET /help/my-posts — Mes publications d'aide.
     */
    @GetMapping("/my-posts")
    public ResponseEntity<ApiResponse<Page<HelpPostDto>>> getMyPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<HelpPostDto> posts = helpService.getMyPosts(authentication.getName(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(posts,
                Map.of("page", page, "perPage", size, "total", posts.getTotalElements())));
    }

    /**
     * GET /help/{id} — Détail d'une publication.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HelpPostDto>> getPostById(
            @PathVariable String id,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        HelpPostDto post = helpService.getPostById(id, email);
        return ResponseEntity.ok(ApiResponse.ok(post));
    }

    /**
     * POST /help — Créer une publication d'aide.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<HelpPostDto>> createPost(
            Authentication authentication,
            @Valid @RequestBody HelpPostCreateRequest request
    ) {
        HelpPostDto post = helpService.createPost(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(post));
    }

    /**
     * PUT /help/{id} — Modifier une publication (auteur seulement).
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HelpPostDto>> updatePost(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody HelpPostCreateRequest request
    ) {
        HelpPostDto post = helpService.updatePost(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(post));
    }

    /**
     * DELETE /help/{id} — Supprimer une publication (auteur seulement).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable String id,
            Authentication authentication
    ) {
        helpService.deletePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * PATCH /help/{id}/status — Changer le statut.
     * Tâche 1.10 : OUVERTE / EN_COURS / RESOLUE.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<HelpPostDto>> updateStatus(
            @PathVariable String id,
            Authentication authentication,
            @RequestParam HelpPostStatus status
    ) {
        HelpPostDto post = helpService.updateStatus(authentication.getName(), id, status);
        return ResponseEntity.ok(ApiResponse.ok(post));
    }

    // =========================================================
    // COMMENTAIRES — HelpComment
    // Tâche 1.3
    // =========================================================

    /**
     * GET /help/{id}/comments — Liste des commentaires d'une publication.
     */
    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<HelpCommentDto>>> getComments(
            @PathVariable String id
    ) {
        List<HelpCommentDto> comments = helpService.getComments(id);
        return ResponseEntity.ok(ApiResponse.ok(comments));
    }

    /**
     * POST /help/{id}/comments — Ajouter un commentaire.
     * Tâche 1.11 : notifie l'auteur.
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<HelpCommentDto>> addComment(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody HelpCommentCreateRequest request
    ) {
        HelpCommentDto comment = helpService.addComment(authentication.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(comment));
    }

    /**
     * DELETE /help/{postId}/comments/{commentId} — Supprimer un commentaire.
     */
    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            Authentication authentication
    ) {
        helpService.deleteComment(authentication.getName(), commentId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * PATCH /help/{postId}/comments/{commentId}/accept — Marquer réponse acceptée.
     * Tâche 1.9 (résolution) + 1.10 (statut) + 1.11 (notification).
     */
    @PatchMapping("/{postId}/comments/{commentId}/accept")
    public ResponseEntity<ApiResponse<HelpCommentDto>> acceptComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            Authentication authentication
    ) {
        HelpCommentDto comment = helpService.acceptComment(authentication.getName(), postId, commentId);
        return ResponseEntity.ok(ApiResponse.ok(comment));
    }
}

