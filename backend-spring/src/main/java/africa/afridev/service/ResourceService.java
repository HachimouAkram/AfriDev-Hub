package africa.afridev.service;

import africa.afridev.dto.resource.ResourceCreateRequest;
import africa.afridev.dto.resource.ResourceDto;
import africa.afridev.model.entity.ResourceEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.entity.UserResourceProgressEntity;
import africa.afridev.model.enums.ResourceType;
import africa.afridev.model.enums.SkillLevel;
import africa.afridev.model.enums.XpSourceType;
import africa.afridev.repository.PaymentRepository;
import africa.afridev.repository.ResourceRepository;
import africa.afridev.repository.UserResourceProgressRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserResourceProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final XpService xpService;

    @Transactional(readOnly = true)
    public Page<ResourceDto> search(
            ResourceType type,
            SkillLevel level,
            String tech,
            String lang,
            Boolean isPaid,
            String currentUserEmail,
            Pageable pageable
    ) {
        UserEntity user = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        return resourceRepository.searchResources(type, level, tech, lang, isPaid, pageable)
                .map(r -> mapToDto(r, user));
    }

    @Transactional
    public ResourceDto getById(String id, String currentUserEmail) {
        ResourceEntity resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ressource introuvable: " + id));

        resource.setViewsCount(resource.getViewsCount() + 1);
        resourceRepository.save(resource);

        // Attribution automatique de 1 XP à l'auteur lors d'une vue par un autre utilisateur
        if (resource.getAuthor() != null) {
            boolean isAuthorSelf = currentUserEmail != null && currentUserEmail.equalsIgnoreCase(resource.getAuthor().getEmail());
            if (!isAuthorSelf) {
                try {
                    xpService.awardXp(
                            resource.getAuthor(),
                            1,
                            XpSourceType.PROJECT_VIEW,
                            resource.getId(),
                            "Vue sur votre ressource : " + resource.getTitle()
                    );
                } catch (Exception e) {
                    log.warn("Erreur lors de l'attribution de l'XP de vue : {}", e.getMessage());
                }
            }
        }

        UserEntity user = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        return mapToDto(resource, user);
    }

    @Transactional
    public ResourceDto completeResource(String id, String currentUserEmail) {
        UserEntity user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        ResourceEntity resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ressource introuvable: " + id));

        UserResourceProgressEntity progress = progressRepository.findByUserIdAndResourceId(user.getId(), resource.getId())
                .orElseGet(() -> UserResourceProgressEntity.builder()
                        .user(user)
                        .resource(resource)
                        .build());

        if (!Boolean.TRUE.equals(progress.getIsCompleted())) {
            progress.setIsCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
            progressRepository.save(progress);

            resource.setCompletionsCount(resource.getCompletionsCount() + 1);
            resourceRepository.save(resource);

            // Récompenser en XP
            int xp = resource.getXpReward() != null ? resource.getXpReward() : 50;
            xpService.awardXp(user, xp, XpSourceType.PROJECT_PUBLISHED, resource.getId(), "Formation terminée: " + resource.getTitle());
        }

        return mapToDto(resource, user);
    }

    @Transactional
    public ResourceDto createResource(String authorEmail, ResourceCreateRequest request) {
        UserEntity author = authorEmail != null ? userRepository.findByEmail(authorEmail).orElse(null) : null;
        boolean paid = Boolean.TRUE.equals(request.getIsPaid());
        if (paid && (request.getPrice() == null || request.getPrice().signum() <= 0)) {
            throw new IllegalArgumentException("Veuillez indiquer un tarif valide en XOF pour une formation payante.");
        }

        ResourceEntity resource = ResourceEntity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .level(request.getLevel())
                .technology(request.getTechnology())
                .language(request.getLanguage() != null ? request.getLanguage() : "fr")
                .youtubeUrl(request.getYoutubeUrl())
                .thumbnailUrl(request.getThumbnailUrl())
                .contentMarkdown(request.getContentMarkdown())
                .pdfUrl(request.getPdfUrl())
                .isPaid(paid)
                .price(paid ? request.getPrice() : java.math.BigDecimal.ZERO)
                .currency(request.getCurrency() != null && !request.getCurrency().isBlank() ? request.getCurrency() : "XOF")
                .durationMinutes(request.getDurationMinutes() != null && request.getDurationMinutes() > 0 ? request.getDurationMinutes() : 30)
                .xpReward(20)
                .author(author)
                .build();

        ResourceEntity saved = resourceRepository.save(resource);

        // Attribution automatique de 20 XP à l'auteur pour la publication de la formation
        if (author != null) {
            try {
                xpService.awardXp(
                        author,
                        20,
                        XpSourceType.PROJECT_PUBLISHED,
                        saved.getId(),
                        "Publication de formation / ressource (20 XP) : " + saved.getTitle()
                );
            } catch (Exception e) {
                log.warn("Erreur lors de l'attribution des 20 XP de création de ressource : {}", e.getMessage());
            }
        }

        return mapToDto(saved, author);
    }

    @Transactional(readOnly = true)
    public Page<ResourceDto> getMyResources(String currentUserEmail, Pageable pageable) {
        UserEntity user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé: " + currentUserEmail));
        return resourceRepository.findByAuthorIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(r -> mapToDto(r, user));
    }

    @Transactional
    public ResourceDto updateResource(String id, String currentUserEmail, ResourceCreateRequest request) {
        UserEntity user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        ResourceEntity resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ressource introuvable: " + id));

        boolean isAuthor = resource.getAuthor() != null && resource.getAuthor().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == africa.afridev.model.enums.Role.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas autorisé à modifier cette ressource.");
        }

        boolean paid = Boolean.TRUE.equals(request.getIsPaid());
        if (paid && (request.getPrice() == null || request.getPrice().signum() <= 0)) {
            throw new IllegalArgumentException("Veuillez indiquer un tarif valide en XOF pour une formation payante.");
        }

        resource.setTitle(request.getTitle());
        resource.setDescription(request.getDescription());
        resource.setType(request.getType());
        resource.setLevel(request.getLevel());
        resource.setTechnology(request.getTechnology());
        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            resource.setLanguage(request.getLanguage());
        }
        resource.setYoutubeUrl(request.getYoutubeUrl());
        resource.setThumbnailUrl(request.getThumbnailUrl());
        resource.setContentMarkdown(request.getContentMarkdown());
        resource.setPdfUrl(request.getPdfUrl());
        resource.setIsPaid(paid);
        resource.setPrice(paid ? request.getPrice() : java.math.BigDecimal.ZERO);
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            resource.setCurrency(request.getCurrency());
        }
        if (request.getDurationMinutes() != null && request.getDurationMinutes() > 0) {
            resource.setDurationMinutes(request.getDurationMinutes());
        }

        ResourceEntity saved = resourceRepository.save(resource);
        return mapToDto(saved, user);
    }

    @Transactional
    public void deleteResource(String id, String currentUserEmail) {
        UserEntity user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        ResourceEntity resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ressource introuvable: " + id));

        boolean isAuthor = resource.getAuthor() != null && resource.getAuthor().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == africa.afridev.model.enums.Role.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas autorisé à supprimer cette ressource.");
        }

        resourceRepository.delete(resource);
        log.info("Ressource supprimée id={} par user={}", id, currentUserEmail);
    }

    private ResourceDto mapToDto(ResourceEntity r, UserEntity currentUser) {
        boolean completed = false;
        boolean unlocked = !Boolean.TRUE.equals(r.getIsPaid());

        if (currentUser != null) {
            completed = progressRepository.existsByUserIdAndResourceIdAndIsCompletedTrue(currentUser.getId(), r.getId());
            if (!unlocked) {
                // Vérifier si l'utilisateur a acheté la formation ou en est l'auteur
                if (r.getAuthor() != null && r.getAuthor().getId().equals(currentUser.getId())) {
                    unlocked = true;
                } else {
                    unlocked = paymentRepository.existsByBuyerIdAndTargetIdAndStatus(
                            currentUser.getId(),
                            r.getId(),
                            africa.afridev.model.enums.PaymentStatus.COMPLETED
                    );
                }
            }
        }

        String authorDisplay = "AfriDev Academy";
        if (r.getAuthor() != null) {
            if (r.getAuthor().getProfile() != null
                    && r.getAuthor().getProfile().getFullName() != null
                    && !r.getAuthor().getProfile().getFullName().isBlank()) {
                authorDisplay = r.getAuthor().getProfile().getFullName();
            } else {
                authorDisplay = r.getAuthor().getEmail();
            }
        }

        return ResourceDto.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .type(r.getType())
                .level(r.getLevel())
                .technology(r.getTechnology())
                .language(r.getLanguage())
                .youtubeUrl(unlocked ? r.getYoutubeUrl() : null)
                .thumbnailUrl(r.getThumbnailUrl())
                .contentMarkdown(unlocked ? r.getContentMarkdown() : null)
                .pdfUrl(unlocked ? r.getPdfUrl() : null)
                .isPaid(r.getIsPaid())
                .price(r.getPrice())
                .currency(r.getCurrency())
                .durationMinutes(r.getDurationMinutes())
                .xpReward(r.getXpReward())
                .viewsCount(r.getViewsCount())
                .completionsCount(r.getCompletionsCount())
                .authorName(authorDisplay)
                .isCompletedByCurrentUser(completed)
                .isUnlockedByCurrentUser(unlocked)
                .createdAt(r.getCreatedAt())
                .build();
    }
}

