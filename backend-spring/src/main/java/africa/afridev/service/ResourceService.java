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
                .isPaid(Boolean.TRUE.equals(request.getIsPaid()))
                .price(request.getPrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "XOF")
                .durationMinutes(request.getDurationMinutes())
                .xpReward(request.getXpReward() != null ? request.getXpReward() : 50)
                .author(author)
                .build();

        ResourceEntity saved = resourceRepository.save(resource);
        return mapToDto(saved, author);
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
                .authorName(r.getAuthor() != null ? r.getAuthor().getEmail() : "AfriDev Academy")
                .isCompletedByCurrentUser(completed)
                .isUnlockedByCurrentUser(unlocked)
                .createdAt(r.getCreatedAt())
                .build();
    }
}

