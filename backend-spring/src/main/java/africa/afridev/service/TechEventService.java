package africa.afridev.service;

import africa.afridev.dto.event.*;
import africa.afridev.model.entity.EventVoteEntity;
import africa.afridev.model.entity.TechEventEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.TechEventType;
import africa.afridev.model.enums.VoteType;
import africa.afridev.repository.EventVoteRepository;
import africa.afridev.repository.TechEventRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TechEventService {

    private final TechEventRepository eventRepository;
    private final EventVoteRepository voteRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<TechEventDto> getEvents(TechEventType type, Pageable pageable, String userEmail) {
        Page<TechEventEntity> page = (type != null)
                ? eventRepository.findByTypeOrderByStartDateAsc(type, pageable)
                : eventRepository.findAllByOrderByStartDateAsc(pageable);

        UserEntity currentUser = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;

        return page.map(e -> mapToDto(e, currentUser));
    }

    @Transactional(readOnly = true)
    public TechEventDto getEventById(String id, String userEmail) {
        TechEventEntity event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Événement introuvable"));

        UserEntity currentUser = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
        return mapToDto(event, currentUser);
    }

    @Transactional(readOnly = true)
    public List<TechEventDto> getMyEvents(String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        return eventRepository.findByOrganizerIdOrderByStartDateDesc(user.getId()).stream()
                .map(e -> mapToDto(e, user))
                .collect(Collectors.toList());
    }

    @Transactional
    public TechEventDto updateEvent(String eventId, String userEmail, TechEventCreateRequest request) {
        TechEventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Événement introuvable"));

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        if (event.getOrganizer() != null && !event.getOrganizer().getId().equals(user.getId())
                && user.getRole() != africa.afridev.model.enums.Role.ADMIN) {
            throw new IllegalArgumentException("Seul l'organisateur ou un administrateur peut modifier cet événement.");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            event.setTitle(request.getTitle());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            event.setDescription(request.getDescription());
        }
        if (request.getType() != null) {
            event.setType(request.getType());
        }
        if (request.getStartDate() != null) {
            event.setStartDate(request.getStartDate());
        }
        event.setEndDate(request.getEndDate());
        if (request.getLocation() != null) {
            event.setLocation(request.getLocation());
        }
        if (request.getIsOnline() != null) {
            event.setIsOnline(request.getIsOnline());
        }
        event.setEventUrl(request.getEventUrl());
        if (request.getBannerUrl() != null) {
            event.setBannerUrl(request.getBannerUrl());
        }
        if (request.getTags() != null) {
            event.setTags(request.getTags());
        }

        TechEventEntity saved = eventRepository.save(event);
        log.info("[EVENT] Événement {} mis à jour par {}", eventId, userEmail);
        return mapToDto(saved, user);
    }

    @Transactional
    public TechEventDto createEvent(String userEmail, TechEventCreateRequest request) {
        UserEntity organizer = null;
        String organizerName = "Communauté AfriDev";
        if (userEmail != null) {
            organizer = userRepository.findByEmail(userEmail).orElse(null);
            if (organizer != null && organizer.getProfile() != null) {
                organizerName = organizer.getProfile().getFullName();
            }
        }

        TechEventEntity event = TechEventEntity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .location(request.getLocation() != null ? request.getLocation() : "En ligne")
                .isOnline(request.getIsOnline() != null ? request.getIsOnline() : false)
                .eventUrl(request.getEventUrl())
                .bannerUrl(request.getBannerUrl())
                .organizer(organizer)
                .organizerName(organizerName)
                .tags(request.getTags() != null ? request.getTags() : new java.util.ArrayList<>())
                .agreeCount(0)
                .disagreeCount(0)
                .build();

        TechEventEntity saved = eventRepository.save(event);
        log.info("[EVENT] Nouvel événement créé: '{}' par {}", saved.getTitle(), organizerName);
        return mapToDto(saved, organizer);
    }

    @Transactional
    public TechEventDto voteEvent(String eventId, String userEmail, EventVoteRequest request) {
        TechEventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Événement introuvable"));

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Vous devez être connecté pour voter."));

        Optional<EventVoteEntity> existingVoteOpt = voteRepository.findByEventIdAndUserId(eventId, user.getId());

        if (existingVoteOpt.isPresent()) {
            EventVoteEntity existing = existingVoteOpt.get();
            if (existing.getVoteType() == request.getVoteType()) {
                // Toggle off / Retirer le vote
                voteRepository.delete(existing);
            } else {
                // Changer d'avis (ex: passé de disagree à agree)
                existing.setVoteType(request.getVoteType());
                voteRepository.save(existing);
            }
        } else {
            EventVoteEntity newVote = EventVoteEntity.builder()
                    .event(event)
                    .user(user)
                    .voteType(request.getVoteType())
                    .build();
            voteRepository.save(newVote);
        }

        // Recalculer les compteurs
        long agrees = voteRepository.countByEventIdAndVoteType(eventId, VoteType.AGREE);
        long disagrees = voteRepository.countByEventIdAndVoteType(eventId, VoteType.DISAGREE);

        event.setAgreeCount((int) agrees);
        event.setDisagreeCount((int) disagrees);
        TechEventEntity saved = eventRepository.save(event);

        return mapToDto(saved, user);
    }

    @Transactional
    public void deleteEvent(String eventId, String userEmail) {
        TechEventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Événement introuvable"));

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        if (event.getOrganizer() != null && !event.getOrganizer().getId().equals(user.getId())
                && user.getRole() != africa.afridev.model.enums.Role.ADMIN) {
            throw new IllegalArgumentException("Seul l'organisateur ou un administrateur peut supprimer cet événement.");
        }

        eventRepository.delete(event);
        log.info("[EVENT] Événement {} supprimé", eventId);
    }

    private TechEventDto mapToDto(TechEventEntity entity, UserEntity currentUser) {
        String organizerAvatar = null;
        if (entity.getOrganizer() != null && entity.getOrganizer().getProfile() != null) {
            organizerAvatar = entity.getOrganizer().getProfile().getAvatarUrl();
        }

        VoteType userVote = null;
        if (currentUser != null) {
            userVote = voteRepository.findByEventIdAndUserId(entity.getId(), currentUser.getId())
                    .map(EventVoteEntity::getVoteType)
                    .orElse(null);
        }

        return TechEventDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .type(entity.getType())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .location(entity.getLocation())
                .isOnline(entity.getIsOnline())
                .eventUrl(entity.getEventUrl())
                .bannerUrl(entity.getBannerUrl())
                .organizerId(entity.getOrganizer() != null ? entity.getOrganizer().getId() : null)
                .organizerName(entity.getOrganizerName())
                .organizerAvatar(organizerAvatar)
                .tags(entity.getTags())
                .agreeCount(entity.getAgreeCount())
                .disagreeCount(entity.getDisagreeCount())
                .userVote(userVote)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
