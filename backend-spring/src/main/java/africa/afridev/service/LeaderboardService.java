package africa.afridev.service;

import africa.afridev.dto.leaderboard.LeaderboardEntryDto;
import africa.afridev.dto.leaderboard.LeaderboardResponse;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.DeveloperLevel;
import africa.afridev.model.enums.Role;
import africa.afridev.repository.ProfileRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final RedisCacheService redisCacheService;

    private static final String CACHE_PREFIX = "cache:leaderboard:v2:";
    private static final Duration CACHE_TTL_PUBLIC = Duration.ofMinutes(10);
    private static final Duration CACHE_TTL_USER = Duration.ofMinutes(5);

    /**
     * Retourne uniquement les profils dont le compte utilisateur a le rôle officiel DEVELOPER.
     * Les RECRUITER, ADMIN et SUPER_ADMIN sont exclus du classement des développeurs.
     */
    private List<ProfileEntity> getDeveloperProfilesOrdered() {
        List<ProfileEntity> devs = profileRepository.findAllByUser_RoleOrderByXpPointsDescCreatedAtAsc(Role.DEVELOPER);
        if (devs == null || devs.isEmpty()) {
            List<ProfileEntity> all = profileRepository.findAllByOrderByXpPointsDescCreatedAtAsc();
            if (all != null && !all.isEmpty()) {
                return all.stream()
                        .filter(p -> p.getUser() == null || p.getUser().getRole() == null || p.getUser().getRole() == Role.DEVELOPER)
                        .toList();
            }
        }
        return devs != null ? devs : new ArrayList<>();
    }

    /**
     * Vérifie si l'identifiant correspond explicitement à un compte non-développeur (RECRUITER, ADMIN, SUPER_ADMIN).
     */
    private boolean isExplicitNonDeveloper(String userIdentifier) {
        if (userIdentifier == null || userIdentifier.isBlank()) return true;
        Optional<UserEntity> userOpt = userRepository.findByEmail(userIdentifier)
                .or(() -> userRepository.findById(userIdentifier));
        return userOpt.map(u -> u.getRole() != null && u.getRole() != Role.DEVELOPER).orElse(false);
    }

    /**
     * Vérifie si l'utilisateur courant fait partie des développeurs classés.
     */
    private boolean isDeveloperViewer(String userIdentifier, List<ProfileEntity> devProfiles) {
        if (userIdentifier == null || userIdentifier.isBlank()) return false;
        if (isExplicitNonDeveloper(userIdentifier)) return false;
        if (devProfiles != null && devProfiles.stream().anyMatch(p -> matchesIdentifier(p, userIdentifier))) {
            return true;
        }
        Optional<UserEntity> userOpt = userRepository.findByEmail(userIdentifier)
                .or(() -> userRepository.findById(userIdentifier));
        return userOpt.map(u -> u.getRole() == Role.DEVELOPER).orElse(false);
    }

    /**
     * Classement public pour les visiteurs non connectés (ou les recruteurs / admins) (Top 10)
     */
    @Transactional(readOnly = true)
    public LeaderboardResponse getPublicLeaderboard() {
        String cacheKey = CACHE_PREFIX + "public";
        try {
            LeaderboardResponse cached = redisCacheService.get(cacheKey, LeaderboardResponse.class);
            if (cached != null) {
                cached.setFromCache(true);
                log.debug("Classement public servi depuis le cache Redis");
                return cached;
            }
        } catch (Exception e) {
            log.warn("Erreur lecture cache Redis leaderboard public: {}", e.getMessage());
        }

        List<ProfileEntity> allProfiles = getDeveloperProfilesOrdered();
        long totalDevelopers = allProfiles.size();

        int topCount = Math.min(10, allProfiles.size());
        List<LeaderboardEntryDto> publicTop10 = new ArrayList<>();

        for (int i = 0; i < topCount; i++) {
            publicTop10.add(toEntryDto(allProfiles.get(i), (long) (i + 1), false, allProfiles, i));
        }

        LeaderboardResponse response = LeaderboardResponse.builder()
                .userRank(null)
                .totalDevelopers(totalDevelopers)
                .isAuthenticated(false)
                .top5(publicTop10.subList(0, Math.min(5, publicTop10.size())))
                .surroundingNeighborhood(new ArrayList<>())
                .publicTop10(publicTop10)
                .fromCache(false)
                .cachedAt(System.currentTimeMillis())
                .build();

        try {
            redisCacheService.set(cacheKey, response, CACHE_TTL_PUBLIC);
        } catch (Exception e) {
            log.warn("Erreur écriture cache Redis leaderboard public: {}", e.getMessage());
        }

        return response;
    }

    /**
     * Classement contextuel pour l'utilisateur connecté :
     * - Si l'utilisateur est RECRUITER, ADMIN ou SUPER_ADMIN (ou non connecté), il voit la liste publique
     *   exactement comme un visiteur non connecté (sans position personnelle).
     * - Si c'est un DEVELOPER : Top 5 général + Voisinage direct de 11 profils.
     */
    @Transactional(readOnly = true)
    public LeaderboardResponse getLeaderboardForUser(String userIdentifier) {
        if (userIdentifier == null || userIdentifier.isBlank() || isExplicitNonDeveloper(userIdentifier)) {
            return getPublicLeaderboard();
        }

        String cacheKey = CACHE_PREFIX + "user:" + userIdentifier;
        try {
            LeaderboardResponse cached = redisCacheService.get(cacheKey, LeaderboardResponse.class);
            if (cached != null) {
                cached.setFromCache(true);
                log.debug("Classement utilisateur {} servi depuis le cache Redis", userIdentifier);
                return cached;
            }
        } catch (Exception e) {
            log.warn("Erreur lecture cache Redis leaderboard user {}: {}", userIdentifier, e.getMessage());
        }

        List<ProfileEntity> allProfiles = getDeveloperProfilesOrdered();
        long totalDevelopers = allProfiles.size();

        if (allProfiles.isEmpty()) {
            LeaderboardResponse emptyRes = LeaderboardResponse.builder()
                    .userRank(null)
                    .totalDevelopers(0L)
                    .isAuthenticated(true)
                    .top5(new ArrayList<>())
                    .surroundingNeighborhood(new ArrayList<>())
                    .publicTop10(new ArrayList<>())
                    .fromCache(false)
                    .cachedAt(System.currentTimeMillis())
                    .build();
            try {
                redisCacheService.set(cacheKey, emptyRes, CACHE_TTL_USER);
            } catch (Exception ignored) {}
            return emptyRes;
        }

        // Trouver l'index du développeur connecté (par id ou par email)
        int targetIndex = -1;
        for (int i = 0; i < allProfiles.size(); i++) {
            ProfileEntity p = allProfiles.get(i);
            if (p.getUser() != null) {
                boolean idMatch = p.getUser().getId() != null && p.getUser().getId().equals(userIdentifier);
                boolean emailMatch = p.getUser().getEmail() != null && p.getUser().getEmail().equalsIgnoreCase(userIdentifier);
                if (idMatch || emailMatch) {
                    targetIndex = i;
                    break;
                }
            }
        }

        // Si l'utilisateur n'est pas dans la liste des développeurs classés
        if (targetIndex == -1) {
            return getPublicLeaderboard();
        }

        long userRank = targetIndex + 1L;

        // 1. Calcul du Top 5
        int top5Count = Math.min(5, allProfiles.size());
        List<LeaderboardEntryDto> top5 = new ArrayList<>();
        for (int i = 0; i < top5Count; i++) {
            boolean isCur = (i == targetIndex);
            top5.add(toEntryDto(allProfiles.get(i), (long) (i + 1), isCur, allProfiles, i));
        }

        // 2. Calcul du Voisinage Direct (5 au-dessus, lui au milieu, 5 en-dessous -> jusqu'à 11 profils)
        int startIndex = Math.max(0, targetIndex - 5);
        int endIndex = Math.min(allProfiles.size(), targetIndex + 6); // exclusif

        List<LeaderboardEntryDto> surrounding = new ArrayList<>();
        for (int i = startIndex; i < endIndex; i++) {
            boolean isCur = (i == targetIndex);
            surrounding.add(toEntryDto(allProfiles.get(i), (long) (i + 1), isCur, allProfiles, i));
        }

        LeaderboardEntryDto currentUserEntry = toEntryDto(allProfiles.get(targetIndex), userRank, true, allProfiles, targetIndex);

        LeaderboardResponse response = LeaderboardResponse.builder()
                .userRank(userRank)
                .totalDevelopers(totalDevelopers)
                .isAuthenticated(true)
                .targetDeveloper(currentUserEntry)
                .top5(top5)
                .surroundingNeighborhood(surrounding)
                .publicTop10(new ArrayList<>())
                .fromCache(false)
                .cachedAt(System.currentTimeMillis())
                .build();

        try {
            redisCacheService.set(cacheKey, response, CACHE_TTL_USER);
        } catch (Exception e) {
            log.warn("Erreur écriture cache Redis leaderboard user {}: {}", userIdentifier, e.getMessage());
        }

        return response;
    }

    /**
     * Recherche d'un développeur avec affichage contextuel centré sur lui (5 au-dessus, la cible, 5 en-dessous = 11 profils)
     */
    @Transactional(readOnly = true)
    public LeaderboardResponse searchLeaderboard(String query, String currentIdentifier) {
        if (query == null || query.trim().isBlank()) {
            return getLeaderboardForUser(currentIdentifier);
        }

        List<ProfileEntity> allProfiles = getDeveloperProfilesOrdered();
        long totalDevelopers = allProfiles.size();

        boolean isDevViewer = isDeveloperViewer(currentIdentifier, allProfiles);
        String effectiveIdentifier = isDevViewer ? currentIdentifier : null;

        String cacheKey = CACHE_PREFIX + "search:" + query.trim().toLowerCase() + ":" + (effectiveIdentifier != null ? effectiveIdentifier : "anon");
        try {
            LeaderboardResponse cached = redisCacheService.get(cacheKey, LeaderboardResponse.class);
            if (cached != null) {
                cached.setFromCache(true);
                return cached;
            }
        } catch (Exception e) {
            log.warn("Erreur lecture cache Redis leaderboard search: {}", e.getMessage());
        }

        String q = query.trim().toLowerCase();
        int targetIndex = -1;

        // Recherche par nom complet, titre ou email
        for (int i = 0; i < allProfiles.size(); i++) {
            ProfileEntity p = allProfiles.get(i);
            boolean nameMatch = p.getFullName() != null && p.getFullName().toLowerCase().contains(q);
            boolean titleMatch = p.getTitle() != null && p.getTitle().toLowerCase().contains(q);
            boolean emailMatch = p.getUser() != null && p.getUser().getEmail() != null && p.getUser().getEmail().toLowerCase().contains(q);

            if (nameMatch || titleMatch || emailMatch) {
                targetIndex = i;
                break;
            }
        }

        // Si aucun développeur ne correspond
        if (targetIndex == -1) {
            int top5Count = Math.min(5, allProfiles.size());
            List<LeaderboardEntryDto> top5 = new ArrayList<>();
            for (int i = 0; i < top5Count; i++) {
                boolean isCur = matchesIdentifier(allProfiles.get(i), effectiveIdentifier);
                top5.add(toEntryDto(allProfiles.get(i), (long) (i + 1), isCur, allProfiles, i));
            }

            LeaderboardResponse noMatchRes = LeaderboardResponse.builder()
                    .userRank(null)
                    .totalDevelopers(totalDevelopers)
                    .isAuthenticated(isDevViewer)
                    .top5(top5)
                    .surroundingNeighborhood(new ArrayList<>())
                    .publicTop10(new ArrayList<>())
                    .fromCache(false)
                    .cachedAt(System.currentTimeMillis())
                    .build();

            try {
                redisCacheService.set(cacheKey, noMatchRes, CACHE_TTL_USER);
            } catch (Exception ignored) {}

            return noMatchRes;
        }

        long targetRank = targetIndex + 1L;

        // Top 5
        int top5Count = Math.min(5, allProfiles.size());
        List<LeaderboardEntryDto> top5 = new ArrayList<>();
        for (int i = 0; i < top5Count; i++) {
            boolean isCur = matchesIdentifier(allProfiles.get(i), effectiveIdentifier);
            top5.add(toEntryDto(allProfiles.get(i), (long) (i + 1), isCur, allProfiles, i));
        }

        // Fenêtre contextuelle de 11 (5 avant + Cible + 5 après)
        int startIndex = Math.max(0, targetIndex - 5);
        int endIndex = Math.min(allProfiles.size(), targetIndex + 6);

        List<LeaderboardEntryDto> surrounding = new ArrayList<>();
        for (int i = startIndex; i < endIndex; i++) {
            boolean isCur = matchesIdentifier(allProfiles.get(i), effectiveIdentifier);
            surrounding.add(toEntryDto(allProfiles.get(i), (long) (i + 1), isCur, allProfiles, i));
        }

        boolean isCurrentTarget = matchesIdentifier(allProfiles.get(targetIndex), effectiveIdentifier);
        LeaderboardEntryDto targetEntry = toEntryDto(allProfiles.get(targetIndex), targetRank, isCurrentTarget, allProfiles, targetIndex);

        LeaderboardResponse response = LeaderboardResponse.builder()
                .userRank(targetRank)
                .totalDevelopers(totalDevelopers)
                .isAuthenticated(isDevViewer)
                .targetDeveloper(targetEntry)
                .top5(top5)
                .surroundingNeighborhood(surrounding)
                .publicTop10(new ArrayList<>())
                .fromCache(false)
                .cachedAt(System.currentTimeMillis())
                .build();

        try {
            redisCacheService.set(cacheKey, response, CACHE_TTL_USER);
        } catch (Exception e) {
            log.warn("Erreur écriture cache Redis search: {}", e.getMessage());
        }

        return response;
    }

    public void evictCache() {
        redisCacheService.evictLeaderboardCache();
    }

    private boolean matchesIdentifier(ProfileEntity profile, String identifier) {
        if (identifier == null || profile == null || profile.getUser() == null) return false;
        boolean idMatch = profile.getUser().getId() != null && profile.getUser().getId().equals(identifier);
        boolean emailMatch = profile.getUser().getEmail() != null && profile.getUser().getEmail().equalsIgnoreCase(identifier);
        return idMatch || emailMatch;
    }

    private LeaderboardEntryDto toEntryDto(ProfileEntity profile, Long rank, boolean isCurrentUser, List<ProfileEntity> allProfiles, int index) {
        long xp = profile.getXpPoints() != null ? profile.getXpPoints() : 0L;
        DeveloperLevel level = DeveloperLevel.fromXp(xp);

        // Calcul des points nécessaires pour dépasser le développeur juste au-dessus
        Long pointsToNextRank = 0L;
        if (index > 0 && index < allProfiles.size()) {
            ProfileEntity above = allProfiles.get(index - 1);
            long aboveXp = above.getXpPoints() != null ? above.getXpPoints() : 0L;
            pointsToNextRank = Math.max(1L, (aboveXp - xp) + 1L);
        }

        return LeaderboardEntryDto.builder()
                .rank(rank)
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .profileId(profile.getId())
                .fullName(profile.getFullName())
                .avatarUrl(profile.getAvatarUrl())
                .title(profile.getTitle())
                .country(profile.getCountry())
                .city(profile.getCity())
                .xpPoints(xp)
                .levelTitle(level.getTitle())
                .levelNumber(level.getLevel())
                .levelBadge(level.getBadge())
                .isCurrentUser(isCurrentUser)
                .pointsToNextRank(pointsToNextRank)
                .build();
    }
}
