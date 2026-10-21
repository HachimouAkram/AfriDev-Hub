package africa.afridev.service;

import africa.afridev.dto.event.*;
import africa.afridev.model.entity.EventVoteEntity;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.TechEventEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.TechEventType;
import africa.afridev.model.enums.VoteType;
import africa.afridev.repository.EventVoteRepository;
import africa.afridev.repository.FollowRepository;
import africa.afridev.repository.TechEventRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import africa.afridev.dto.PagedResult;
import com.fasterxml.jackson.databind.JavaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TechEventService {

    private final TechEventRepository eventRepository;
    private final EventVoteRepository voteRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final RedisCacheService redisCacheService;

    @Transactional(readOnly = true)
    public Page<TechEventDto> getEvents(TechEventType type, Pageable pageable, String userEmail) {
        return getEvents(type, "SUGGESTED", pageable, userEmail);
    }

    @Transactional(readOnly = true)
    public Page<TechEventDto> getEvents(TechEventType type, String sort, Pageable pageable, String userEmail) {
        String sortParam = (sort != null && !sort.isBlank()) ? sort.toUpperCase().trim() : "SUGGESTED";
        String cacheKey = "cache:events:t:" + (type != null ? type.name() : "ALL")
                + ":sort:" + sortParam
                + ":u:" + (userEmail != null ? userEmail : "anon")
                + ":p:" + pageable.getPageNumber()
                + ":s:" + pageable.getPageSize();

        try {
            JavaType javaType = redisCacheService.getObjectMapper().getTypeFactory()
                    .constructParametricType(PagedResult.class, TechEventDto.class);
            PagedResult<TechEventDto> cached = redisCacheService.get(cacheKey, javaType);
            if (cached != null) {
                return cached.toPage();
            }
        } catch (Exception ignored) {}

        UserEntity currentUser = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
        ProfileEntity currentProfile = currentUser != null ? currentUser.getProfile() : null;

        Set<String> followedOrganizerIds = Collections.emptySet();
        if (currentUser != null) {
            followedOrganizerIds = followRepository.findByFollowerId(currentUser.getId())
                    .stream()
                    .map(f -> f.getFollowing().getId())
                    .collect(Collectors.toSet());
        }

        List<TechEventEntity> allEvents = (type != null)
                ? eventRepository.findByType(type)
                : eventRepository.findAll();

        final Set<String> finalFollowedIds = followedOrganizerIds;
        List<TechEventDto> dtoList = allEvents.stream()
                .map(e -> mapToScoredEventDto(e, currentUser, currentProfile, finalFollowedIds))
                .collect(Collectors.toList());

        String myCountry = (currentProfile != null && currentProfile.getCountry() != null) ? currentProfile.getCountry().trim().toLowerCase() : "";
        LocalDateTime now = LocalDateTime.now();

        switch (sortParam) {
            case "FOLLOWING" -> {
                if (currentUser != null) {
                    dtoList.sort((a, b) -> {
                        boolean aFollowed = Boolean.TRUE.equals(a.getIsOrganizerFollowed());
                        boolean bFollowed = Boolean.TRUE.equals(b.getIsOrganizerFollowed());
                        if (aFollowed != bFollowed) return aFollowed ? -1 : 1;
                        return Double.compare(
                                b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                                a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                        );
                    });
                } else {
                    dtoList.sort(Comparator.comparing(TechEventDto::getMatchPercentage, Comparator.nullsLast(Comparator.reverseOrder())));
                }
            }
            case "MATCHING_TAGS" -> dtoList.sort((a, b) -> {
                int aCount = a.getMatchedTags() != null ? a.getMatchedTags().size() : 0;
                int bCount = b.getMatchedTags() != null ? b.getMatchedTags().size() : 0;
                if (aCount != bCount) return Integer.compare(bCount, aCount);
                return Double.compare(
                        b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                        a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                );
            });
            case "SAME_COUNTRY" -> dtoList.sort((a, b) -> {
                String locA = a.getLocation() != null ? a.getLocation().trim().toLowerCase() : "";
                String locB = b.getLocation() != null ? b.getLocation().trim().toLowerCase() : "";
                boolean aSame = !myCountry.isEmpty() && locA.contains(myCountry);
                boolean bSame = !myCountry.isEmpty() && locB.contains(myCountry);
                if (aSame != bSame) return aSame ? -1 : 1;
                return Double.compare(
                        b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                        a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                );
            });
            case "ONLINE" -> dtoList.sort((a, b) -> {
                boolean aOnline = Boolean.TRUE.equals(a.getIsOnline());
                boolean bOnline = Boolean.TRUE.equals(b.getIsOnline());
                if (aOnline != bOnline) return aOnline ? -1 : 1;
                return Double.compare(
                        b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                        a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                );
            });
            case "POPULAR" -> dtoList.sort(
                    Comparator.comparing(TechEventDto::getAgreeCount, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(TechEventDto::getStartDate, Comparator.nullsLast(Comparator.naturalOrder()))
            );
            case "UPCOMING" -> dtoList.sort((a, b) -> {
                boolean aPassed = a.getStartDate() != null && a.getStartDate().isBefore(now);
                boolean bPassed = b.getStartDate() != null && b.getStartDate().isBefore(now);
                if (aPassed != bPassed) return aPassed ? 1 : -1;
                if (a.getStartDate() == null) return 1;
                if (b.getStartDate() == null) return -1;
                return a.getStartDate().compareTo(b.getStartDate());
            });
            case "SUGGESTED" -> {
                // SUGGESTED : Favoriser les événements à venir, puis par matchPercentage décroissant
                dtoList.sort((a, b) -> {
                    boolean aPassed = a.getStartDate() != null && a.getStartDate().isBefore(now);
                    boolean bPassed = b.getStartDate() != null && b.getStartDate().isBefore(now);
                    if (aPassed != bPassed) return aPassed ? 1 : -1;
                    int cmp = Double.compare(
                            b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                            a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                    );
                    if (cmp != 0) return cmp;
                    if (a.getStartDate() == null) return 1;
                    if (b.getStartDate() == null) return -1;
                    return a.getStartDate().compareTo(b.getStartDate());
                });
            }
            default -> dtoList.sort((a, b) -> Double.compare(
                    b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                    a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
            ));
        }

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtoList.size());
        List<TechEventDto> pagedContent = (start <= end && start < dtoList.size())
                ? dtoList.subList(start, end)
                : Collections.emptyList();

        Page<TechEventDto> resultPage = new PageImpl<>(pagedContent, pageable, dtoList.size());
        redisCacheService.set(cacheKey, PagedResult.from(resultPage), Duration.ofMinutes(10));
        return resultPage;
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
                && user.getRole() != africa.afridev.model.enums.Role.ADMIN
                && user.getRole() != africa.afridev.model.enums.Role.SUPER_ADMIN) {
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
        redisCacheService.evictEventsCache();
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
        redisCacheService.evictEventsCache();
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
        redisCacheService.evictEventsCache();

        return mapToDto(saved, user);
    }

    @Transactional
    public void deleteEvent(String eventId, String userEmail) {
        TechEventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Événement introuvable"));

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        if (event.getOrganizer() != null && !event.getOrganizer().getId().equals(user.getId())
                && user.getRole() != africa.afridev.model.enums.Role.ADMIN
                && user.getRole() != africa.afridev.model.enums.Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Seul l'organisateur ou un administrateur peut supprimer cet événement.");
        }

        eventRepository.delete(event);
        redisCacheService.evictEventsCache();
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

    private TechEventDto mapToScoredEventDto(
            TechEventEntity entity,
            UserEntity currentUser,
            ProfileEntity currentProfile,
            Set<String> followedOrganizerIds
    ) {
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

        boolean isOrganizerFollowed = false;
        if (entity.getOrganizer() != null && followedOrganizerIds != null) {
            isOrganizerFollowed = followedOrganizerIds.contains(entity.getOrganizer().getId());
        } else if (currentUser != null && entity.getOrganizer() != null) {
            isOrganizerFollowed = redisCacheService.isFollowing(currentUser.getId(), entity.getOrganizer().getId());
        }

        double score = 0.0;
        List<String> matchedTags = new ArrayList<>();
        List<String> reasons = new ArrayList<>();

        // 1. Tags match with profile skills (max 30 pts)
        List<String> eventTags = entity.getTags() != null ? entity.getTags() : Collections.emptyList();
        List<String> mySkills = (currentProfile != null && currentProfile.getSkills() != null)
                ? currentProfile.getSkills() : Collections.emptyList();

        if (!eventTags.isEmpty() && !mySkills.isEmpty()) {
            Set<String> mySkillsNorm = mySkills.stream()
                    .filter(Objects::nonNull)
                    .map(s -> s.trim().toLowerCase())
                    .collect(Collectors.toSet());

            for (String tag : eventTags) {
                if (tag != null && mySkillsNorm.contains(tag.trim().toLowerCase())) {
                    matchedTags.add(tag);
                }
            }

            if (!matchedTags.isEmpty()) {
                double ratio = (double) matchedTags.size() / (double) eventTags.size();
                score += Math.min(25.0, ratio * 25.0) + 5.0; // max 30 pts
                if (matchedTags.size() == eventTags.size()) {
                    reasons.add("💻 100% Match Tech (" + String.join(", ", matchedTags) + ")");
                } else {
                    reasons.add("💻 Match " + matchedTags.size() + "/" + eventTags.size() + " tech (" + String.join(", ", matchedTags) + ")");
                }
            }
        }

        // 2. Organizer followed (+25 pts)
        if (isOrganizerFollowed) {
            score += 25.0;
            reasons.add("👥 Organisateur suivi");
        }

        // 3. Location & Online (max 30 pts)
        boolean isOnline = Boolean.TRUE.equals(entity.getIsOnline());
        String eventLoc = entity.getLocation() != null ? entity.getLocation().toLowerCase() : "";
        String myCountry = (currentProfile != null && currentProfile.getCountry() != null) ? currentProfile.getCountry().toLowerCase().trim() : "";
        String myCity = (currentProfile != null && currentProfile.getCity() != null) ? currentProfile.getCity().toLowerCase().trim() : "";

        boolean sameCountry = !myCountry.isEmpty() && eventLoc.contains(myCountry);
        boolean sameCity = !myCity.isEmpty() && eventLoc.contains(myCity);

        if (sameCountry) {
            score += sameCity ? 30.0 : 25.0;
            reasons.add("📍 " + (sameCity ? currentProfile.getCity() + ", " : "") + currentProfile.getCountry());
        } else if (isOnline) {
            score += 20.0;
            reasons.add("🌐 En ligne (Online)");
        }

        // 4. Community agreement / votes (+15 pts max)
        int agree = entity.getAgreeCount() != null ? entity.getAgreeCount() : 0;
        if (agree > 0) {
            score += Math.min(15.0, agree * 2.0);
            if (agree >= 5) {
                reasons.add("🔥 " + agree + " votes favorables");
            }
        }

        // 5. Temporality (upcoming vs passed)
        LocalDateTime now = LocalDateTime.now();
        if (entity.getStartDate() != null) {
            if (entity.getStartDate().isBefore(now)) {
                score -= 25.0; // Événement déjà passé
            } else if (entity.getStartDate().isBefore(now.plusDays(45))) {
                score += 10.0;
            }
        }

        // Baseline score for non-connected / anonymous visitors
        if (currentUser == null) {
            score = 45.0;
            if (isOnline) score += 20.0;
            if (agree > 0) score += Math.min(15.0, agree * 2.0);
            if (!eventTags.isEmpty()) score += 10.0;
            if (entity.getStartDate() != null && entity.getStartDate().isAfter(now)) score += 10.0;
            reasons.add("⚡ Événement de la communauté tech");
        }

        double finalPercentage = Math.min(100.0, Math.max(10.0, Math.round(score * 10.0) / 10.0));
        String suggestionReason = reasons.isEmpty() ? "Événement tech de la communauté" : String.join(" • ", reasons);

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
                .matchPercentage(finalPercentage)
                .suggestionReason(suggestionReason)
                .matchedTags(matchedTags)
                .isOrganizerFollowed(isOrganizerFollowed)
                .build();
    }
}
