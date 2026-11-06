package africa.afridev.service;

import africa.afridev.dto.mentor.MentorCardDto;
import africa.afridev.dto.mentor.MentorUpdateRequest;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.XpSourceType;
import africa.afridev.repository.ProfileRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MentorService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final XpService xpService;

    public static final long XP_BECOME_MENTOR = 40L;

    /**
     * Tâche 2.2 : Active, désactive ou met à jour les informations du profil mentor
     */
    @Transactional
    public MentorCardDto updateMentorProfile(String userEmail, MentorUpdateRequest request) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ProfileEntity profile = user.getProfile();
        if (profile == null) {
            throw new IllegalStateException("Le profil utilisateur doit d'abord être créé.");
        }

        boolean wasMentorBefore = Boolean.TRUE.equals(profile.getIsMentor());

        if (request.getIsMentor() != null) {
            profile.setIsMentor(request.getIsMentor());
        }
        if (request.getMentorBio() != null) {
            profile.setMentorBio(request.getMentorBio().trim());
        }
        if (request.getMentorHoursPerWeek() != null) {
            profile.setMentorHoursPerWeek(request.getMentorHoursPerWeek());
        }
        if (request.getMentorTopics() != null) {
            profile.setMentorTopics(new ArrayList<>(request.getMentorTopics()));
        }

        ProfileEntity saved = profileRepository.save(profile);

        // Attribution XP lors de l'activation pour la première fois (Tâche 2.8)
        if (!wasMentorBefore && Boolean.TRUE.equals(saved.getIsMentor())) {
            xpService.awardXp(user, XP_BECOME_MENTOR, XpSourceType.PROFILE_COMPLETED,
                    "mentor_activate_" + user.getId(), "Engagement en tant que Mentor Communautaire");
            log.info("[MENTOR] Utilisateur {} est devenu Mentor", userEmail);
        }

        return mapToMentorCard(saved);
    }

    /**
     * Tâche 2.3 : Recherche paginée et filtrée des mentors disponibles
     */
    @Transactional(readOnly = true)
    public Page<MentorCardDto> getMentors(String country, String topic, String query, Pageable pageable) {
        String cleanCountry = (country != null && !country.isBlank() && !"ALL".equalsIgnoreCase(country)) ? country.trim() : null;
        String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;

        Page<ProfileEntity> page = profileRepository.searchMentors(cleanCountry, cleanQuery, pageable);

        // Filtrage en mémoire si un topic technique spécifique est demandé
        List<MentorCardDto> list = page.getContent().stream()
                .filter(p -> {
                    if (topic == null || topic.isBlank() || "ALL".equalsIgnoreCase(topic)) return true;
                    String targetTopic = topic.trim().toLowerCase();
                    boolean hasInTopics = p.getMentorTopics() != null && p.getMentorTopics().stream()
                            .anyMatch(t -> t.toLowerCase().contains(targetTopic));
                    boolean hasInSkills = p.getSkills() != null && p.getSkills().stream()
                            .anyMatch(s -> s.toLowerCase().contains(targetTopic));
                    return hasInTopics || hasInSkills;
                })
                .map(this::mapToMentorCard)
                .collect(Collectors.toList());

        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    /**
     * Tâche 2.3 : Top mentors pour mise en avant / leaderboard
     */
    @Transactional(readOnly = true)
    public List<MentorCardDto> getTopMentors(int limit) {
        return profileRepository.findByIsMentorTrueOrderByXpPointsDesc().stream()
                .limit(limit)
                .map(this::mapToMentorCard)
                .collect(Collectors.toList());
    }

    /**
     * Récupère le profil mentor d'un utilisateur par son ID
     */
    @Transactional(readOnly = true)
    public MentorCardDto getMentorByUserId(String userId) {
        ProfileEntity profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profil mentor introuvable."));
        return mapToMentorCard(profile);
    }

    public MentorCardDto mapToMentorCard(ProfileEntity profile) {
        return MentorCardDto.builder()
                .id(profile.getId())
                .user(profile.getUser() != null ? authService.mapToUserDto(profile.getUser()) : null)
                .fullName(profile.getFullName())
                .title(profile.getTitle())
                .country(profile.getCountry())
                .city(profile.getCity())
                .avatarUrl(profile.getAvatarUrl())
                .mentorBio(profile.getMentorBio())
                .mentorHoursPerWeek(profile.getMentorHoursPerWeek() != null ? profile.getMentorHoursPerWeek() : 2)
                .mentorTopics(profile.getMentorTopics() != null ? profile.getMentorTopics() : List.of())
                .skills(profile.getSkills() != null ? profile.getSkills() : List.of())
                .menteesHelpedCount(profile.getMenteesHelpedCount() != null ? profile.getMenteesHelpedCount() : 0)
                .xpPoints(profile.getXpPoints() != null ? profile.getXpPoints() : 0L)
                .levelTitle(profile.getLevelTitle())
                .levelNumber(profile.getLevelNumber())
                .build();
    }
}

