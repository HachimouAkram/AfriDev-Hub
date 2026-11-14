package africa.afridev.service;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.help.*;
import africa.afridev.model.entity.HelpCommentEntity;
import africa.afridev.model.entity.HelpPostEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.HelpPostStatus;
import africa.afridev.model.enums.HelpPostType;
import africa.afridev.model.enums.HelpPostVisibility;
import africa.afridev.model.enums.XpSourceType;
import africa.afridev.repository.HelpCommentRepository;
import africa.afridev.repository.HelpPostRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service principal pour le module d'aide et d'orientation.
 * Gère les publications (HelpPost) et les commentaires (HelpComment).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HelpService {

    private final HelpPostRepository helpPostRepository;
    private final HelpCommentRepository helpCommentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuthService authService;
    private final XpService xpService;

    // Constantes XP pour les actions d'aide
    public static final long XP_HELP_POST_PUBLISHED = 10L;
    public static final long XP_HELP_COMMENT_GIVEN = 5L;
    public static final long XP_HELP_ACCEPTED_ANSWER = 20L;

    // =========================================================
    // PUBLICATIONS (HELPPOST)
    // =========================================================

    /**
     * Crée une nouvelle publication d'aide.
     */
    @Transactional
    public HelpPostDto createPost(String userEmail, HelpPostCreateRequest request) {
        UserEntity author = getUserByEmail(userEmail);

        HelpPostEntity post = HelpPostEntity.builder()
                .author(author)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .type(request.getType() != null ? request.getType() : HelpPostType.ORIENTATION)
                .tags(request.getTags() != null ? request.getTags() : List.of())
                .screenshotUrls(request.getScreenshotUrls() != null ? request.getScreenshotUrls().stream().limit(5).toList() : List.of())
                .niveauDemandeur(request.getNiveauDemandeur())
                .status(HelpPostStatus.OUVERTE)
                .visibility(request.getVisibility() != null ? request.getVisibility() : HelpPostVisibility.PUBLIQUE)
                .commentsCount(0)
                .viewsCount(0)
                .build();

        HelpPostEntity saved = helpPostRepository.save(post);

        // Attribuer des XP à l'auteur pour avoir posté une demande
        xpService.awardXp(author, XP_HELP_POST_PUBLISHED, XpSourceType.PROJECT_PUBLISHED,
                "help_post_" + saved.getId(), "Publication d'une demande d'aide: " + saved.getTitle());

        log.info("[HELP] Nouvelle demande créée par {} : {}", userEmail, saved.getId());
        return mapToDto(saved, userEmail);
    }

    /**
     * Récupère toutes les publications publiques avec filtres optionnels.
     * Tâches 1.4 & 1.5 : tags, catégories, recherche, filtres.
     */
    @Transactional(readOnly = true)
    public Page<HelpPostDto> getPosts(
            String currentUserEmail,
            HelpPostType type,
            HelpPostStatus status,
            String query,
            String tag,
            Pageable pageable) {

        HelpPostVisibility visibility = HelpPostVisibility.PUBLIQUE;
        Page<HelpPostEntity> page;

        if (tag != null && !tag.isBlank()) {
            page = helpPostRepository.findByTag(visibility, tag.trim(), pageable);
        } else if (query != null || type != null || status != null) {
            page = helpPostRepository.findWithFilters(visibility, type, status,
                    (query != null && !query.isBlank()) ? query.trim() : null, pageable);
        } else {
            page = helpPostRepository.findByVisibilityOrderByCreatedAtDesc(visibility, pageable);
        }

        return page.map(p -> mapToDto(p, currentUserEmail));
    }

    /**
     * Publications de l'utilisateur connecté (mes demandes).
     */
    @Transactional(readOnly = true)
    public Page<HelpPostDto> getMyPosts(String userEmail, Pageable pageable) {
        UserEntity user = getUserByEmail(userEmail);
        return helpPostRepository
                .findByAuthorIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(p -> mapToDto(p, userEmail));
    }

    /**
     * Détail d'une publication par ID.
     */
    @Transactional
    public HelpPostDto getPostById(String postId, String currentUserEmail) {
        HelpPostEntity post = getPostOrThrow(postId);
        // Incrémente les vues
        post.setViewsCount((post.getViewsCount() == null ? 0 : post.getViewsCount()) + 1);
        helpPostRepository.save(post);
        return mapToDto(post, currentUserEmail);
    }

    /**
     * Met à jour une publication (auteur seulement).
     */
    @Transactional
    public HelpPostDto updatePost(String userEmail, String postId, HelpPostCreateRequest request) {
        HelpPostEntity post = getPostOrThrow(postId);
        checkOwnership(post, userEmail);

        post.setTitle(request.getTitle().trim());
        post.setDescription(request.getDescription().trim());
        if (request.getType() != null) post.setType(request.getType());
        if (request.getTags() != null) post.setTags(request.getTags());
        if (request.getScreenshotUrls() != null) post.setScreenshotUrls(request.getScreenshotUrls().stream().limit(5).toList());
        if (request.getNiveauDemandeur() != null) post.setNiveauDemandeur(request.getNiveauDemandeur());
        if (request.getVisibility() != null) post.setVisibility(request.getVisibility());

        return mapToDto(helpPostRepository.save(post), userEmail);
    }

    /**
     * Supprime une publication (auteur seulement).
     */
    @Transactional
    public void deletePost(String userEmail, String postId) {
        HelpPostEntity post = getPostOrThrow(postId);
        checkOwnership(post, userEmail);
        helpPostRepository.delete(post);
        log.info("[HELP] Publication {} supprimée par {}", postId, userEmail);
    }

    // =========================================================
    // STATUT — Tâche 1.10
    // =========================================================

    /**
     * Change le statut d'une publication (auteur seulement).
     * Tâche 1.10 : OUVERTE / EN_COURS / RESOLUE.
     */
    @Transactional
    public HelpPostDto updateStatus(String userEmail, String postId, HelpPostStatus newStatus) {
        HelpPostEntity post = getPostOrThrow(postId);
        checkOwnership(post, userEmail);

        post.setStatus(newStatus);
        if (newStatus == HelpPostStatus.RESOLUE) {
            post.setResolvedAt(LocalDateTime.now());
        } else {
            post.setResolvedAt(null);
        }

        return mapToDto(helpPostRepository.save(post), userEmail);
    }

    // =========================================================
    // COMMENTAIRES — Tâche 1.3
    // =========================================================

    /**
     * Ajoute un commentaire sur une publication.
     * Tâche 1.11 : notifie l'auteur de la publication.
     */
    @Transactional
    public HelpCommentDto addComment(String userEmail, String postId, HelpCommentCreateRequest request) {
        UserEntity commenter = getUserByEmail(userEmail);
        HelpPostEntity post = getPostOrThrow(postId);

        // Résoudre le commentaire parent si fourni
        HelpCommentEntity parentComment = null;
        if (request.getParentCommentId() != null && !request.getParentCommentId().isBlank()) {
            parentComment = helpCommentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("Commentaire parent introuvable."));
        }

        HelpCommentEntity comment = HelpCommentEntity.builder()
                .helpPost(post)
                .author(commenter)
                .content(request.getContent().trim())
                .parentComment(parentComment)
                .isAccepted(false)
                .build();

        HelpCommentEntity saved = helpCommentRepository.save(comment);

        // Mise à jour du compteur
        post.setCommentsCount((post.getCommentsCount() == null ? 0 : post.getCommentsCount()) + 1);
        // Si quelqu'un commente, passer en EN_COURS automatiquement si encore OUVERTE
        if (post.getStatus() == HelpPostStatus.OUVERTE
                && !post.getAuthor().getEmail().equals(userEmail)) {
            post.setStatus(HelpPostStatus.EN_COURS);
        }
        helpPostRepository.save(post);

        // XP pour le commentateur
        xpService.awardXp(commenter, XP_HELP_COMMENT_GIVEN, XpSourceType.PROJECT_VIEW,
                "help_comment_" + saved.getId(), "Commentaire d'aide sur: " + post.getTitle());

        // Notification 1.11 : notifier l'auteur de la publication (si différent)
        if (!post.getAuthor().getEmail().equals(userEmail)) {
            notificationService.createNotification(
                    post.getAuthor(),
                    "HELP_COMMENT",
                    "💬 Nouvelle réponse à votre demande",
                    commenter.getProfile() != null ? commenter.getProfile().getFullName() : commenter.getEmail()
                            + " a répondu à votre demande : « " + post.getTitle() + " »",
                    "/dashboard/aide/" + postId
            );
        }

        log.info("[HELP] Commentaire ajouté par {} sur {}", userEmail, postId);
        return mapCommentToDto(saved);
    }

    /**
     * Récupère tous les commentaires d'une publication (avec sous-réponses).
     */
    @Transactional(readOnly = true)
    public List<HelpCommentDto> getComments(String postId) {
        getPostOrThrow(postId); // vérification
        List<HelpCommentEntity> rootComments = helpCommentRepository
                .findByHelpPostIdAndParentCommentIsNullOrderByCreatedAtAsc(postId);

        return rootComments.stream()
                .map(c -> {
                    HelpCommentDto dto = mapCommentToDto(c);
                    // Charger les sous-réponses
                    List<HelpCommentDto> replies = helpCommentRepository
                            .findByParentCommentIdOrderByCreatedAtAsc(c.getId())
                            .stream()
                            .map(this::mapCommentToDto)
                            .collect(Collectors.toList());
                    dto.setReplies(replies);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Supprime un commentaire (auteur du commentaire ou auteur du post).
     */
    @Transactional
    public void deleteComment(String userEmail, String commentId) {
        HelpCommentEntity comment = helpCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Commentaire introuvable."));

        boolean isCommentAuthor = comment.getAuthor().getEmail().equals(userEmail);
        boolean isPostAuthor = comment.getHelpPost().getAuthor().getEmail().equals(userEmail);

        if (!isCommentAuthor && !isPostAuthor) {
            throw new IllegalStateException("Vous n'êtes pas autorisé à supprimer ce commentaire.");
        }

        // Décrémenter le compteur
        HelpPostEntity post = comment.getHelpPost();
        post.setCommentsCount(Math.max(0, (post.getCommentsCount() == null ? 0 : post.getCommentsCount()) - 1));
        helpPostRepository.save(post);

        helpCommentRepository.delete(comment);
    }

    /**
     * Marque un commentaire comme "réponse acceptée" (auteur de la publication seulement).
     */
    @Transactional
    public HelpCommentDto acceptComment(String userEmail, String postId, String commentId) {
        HelpPostEntity post = getPostOrThrow(postId);
        checkOwnership(post, userEmail);

        HelpCommentEntity comment = helpCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Commentaire introuvable."));

        if (!comment.getHelpPost().getId().equals(postId)) {
            throw new IllegalArgumentException("Ce commentaire n'appartient pas à cette publication.");
        }

        // Désaccepter l'ancien commentaire accepté s'il existe
        List<HelpCommentEntity> allComments = helpCommentRepository
                .findByHelpPostIdAndParentCommentIsNullOrderByCreatedAtAsc(postId);
        allComments.forEach(c -> {
            if (c.getIsAccepted()) {
                c.setIsAccepted(false);
                helpCommentRepository.save(c);
            }
        });

        comment.setIsAccepted(true);
        helpCommentRepository.save(comment);

        // Marquer la publication comme RESOLUE
        post.setStatus(HelpPostStatus.RESOLUE);
        post.setResolvedBy(comment.getAuthor());
        post.setResolvedAt(LocalDateTime.now());
        helpPostRepository.save(post);

        // XP pour l'auteur de la réponse acceptée
        xpService.awardXp(comment.getAuthor(), XP_HELP_ACCEPTED_ANSWER, XpSourceType.RECOGNITION_RECEIVED,
                "help_accepted_" + commentId, "Réponse acceptée sur: " + post.getTitle());

        // Notification à l'auteur du commentaire
        notificationService.createNotification(
                comment.getAuthor(),
                "HELP_ACCEPTED",
                "✅ Votre réponse a été acceptée !",
                "Votre réponse à « " + post.getTitle() + " » a été marquée comme solution.",
                "/dashboard/aide/" + postId
        );

        return mapCommentToDto(comment);
    }

    // =========================================================
    // MAPPEURS PRIVÉS
    // =========================================================

    private HelpPostDto mapToDto(HelpPostEntity post, String currentUserEmail) {
        boolean isAuthor = currentUserEmail != null
                && post.getAuthor().getEmail().equals(currentUserEmail);

        return HelpPostDto.builder()
                .id(post.getId())
                .author(authService.mapToUserDto(post.getAuthor()))
                .title(post.getTitle())
                .description(post.getDescription())
                .type(post.getType())
                .tags(post.getTags())
                .screenshotUrls(post.getScreenshotUrls() != null ? post.getScreenshotUrls() : List.of())
                .niveauDemandeur(post.getNiveauDemandeur())
                .status(post.getStatus())
                .visibility(post.getVisibility())
                .commentsCount(post.getCommentsCount() != null ? post.getCommentsCount() : 0)
                .viewsCount(post.getViewsCount() != null ? post.getViewsCount() : 0)
                .resolvedBy(post.getResolvedBy() != null ? authService.mapToUserDto(post.getResolvedBy()) : null)
                .resolvedAt(post.getResolvedAt())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .isAuthor(isAuthor)
                .build();
    }

    private HelpCommentDto mapCommentToDto(HelpCommentEntity comment) {
        return HelpCommentDto.builder()
                .id(comment.getId())
                .helpPostId(comment.getHelpPost().getId())
                .author(authService.mapToUserDto(comment.getAuthor()))
                .content(comment.getContent())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .isAccepted(comment.getIsAccepted())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .replies(List.of()) // Chargé séparément dans getComments()
                .build();
    }

    // =========================================================
    // HELPERS PRIVÉS
    // =========================================================

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));
    }

    private HelpPostEntity getPostOrThrow(String postId) {
        return helpPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Publication d'aide introuvable : " + postId));
    }

    private void checkOwnership(HelpPostEntity post, String userEmail) {
        if (!post.getAuthor().getEmail().equals(userEmail)) {
            throw new IllegalStateException("Vous n'êtes pas l'auteur de cette publication.");
        }
    }
}

