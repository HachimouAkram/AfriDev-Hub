package africa.afridev.service;

import africa.afridev.dto.network.NetworkSuggestionDto;
import africa.afridev.dto.network.UserNetworkDto;
import africa.afridev.model.entity.EvaluationEntity;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.Role;
import africa.afridev.repository.EvaluationRepository;
import africa.afridev.repository.FollowRepository;
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
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NetworkService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final EvaluationRepository evaluationRepository;
    private final RedisCacheService redisCacheService;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String FASTAPI_SUGGESTIONS_URL = "http://localhost:8000/api/v1/suggestions/network";

    @Transactional(readOnly = true)
    public Page<UserNetworkDto> getNetworkUsers(
            String currentEmail,
            String roleStr,
            String query,
            String skill,
            String country,
            Pageable pageable
    ) {
        return getNetworkUsers(currentEmail, roleStr, query, skill, country, "SUGGESTED", pageable);
    }

    @Transactional(readOnly = true)
    public Page<UserNetworkDto> getNetworkUsers(
            String currentEmail,
            String roleStr,
            String query,
            String skill,
            String country,
            String sort,
            Pageable pageable
    ) {
        UserEntity currentUser = currentEmail != null ? userRepository.findByEmail(currentEmail).orElse(null) : null;
        String currentUserId = currentUser != null ? currentUser.getId() : null;
        String sortParam = (sort != null && !sort.isBlank()) ? sort.toUpperCase().trim() : "SUGGESTED";

        String cacheKey = "cache:network:r:" + (roleStr != null ? roleStr : "ALL")
                + ":q:" + (query != null ? query.trim().toLowerCase() : "")
                + ":s:" + (skill != null ? skill.trim().toLowerCase() : "")
                + ":c:" + (country != null ? country.trim().toLowerCase() : "")
                + ":sort:" + sortParam
                + ":u:" + (currentUserId != null ? currentUserId : "anon")
                + ":p:" + pageable.getPageNumber()
                + ":sz:" + pageable.getPageSize();

        try {
            JavaType type = redisCacheService.getObjectMapper().getTypeFactory()
                    .constructParametricType(PagedResult.class, UserNetworkDto.class);
            PagedResult<UserNetworkDto> cached = redisCacheService.get(cacheKey, type);
            if (cached != null) {
                return cached.toPage();
            }
        } catch (Exception ignored) {}

        List<UserNetworkDto> allFiltered = getNetworkUsers(currentEmail, roleStr, query, skill, country, sortParam);
        int total = allFiltered.size();
        int fromIndex = (int) pageable.getOffset();
        List<UserNetworkDto> pagedList;
        if (fromIndex >= total) {
            pagedList = Collections.emptyList();
        } else {
            int toIndex = Math.min(fromIndex + pageable.getPageSize(), total);
            pagedList = allFiltered.subList(fromIndex, toIndex);
        }

        Page<UserNetworkDto> pageResult = new PageImpl<>(pagedList, pageable, total);
        redisCacheService.set(cacheKey, PagedResult.from(pageResult), Duration.ofMinutes(10));
        return pageResult;
    }

    @Transactional(readOnly = true)
    public List<UserNetworkDto> getNetworkUsers(
            String currentEmail,
            String roleStr,
            String query,
            String skill,
            String country
    ) {
        return getNetworkUsers(currentEmail, roleStr, query, skill, country, "SUGGESTED");
    }

    @Transactional(readOnly = true)
    public List<UserNetworkDto> getNetworkUsers(
            String currentEmail,
            String roleStr,
            String query,
            String skill,
            String country,
            String sort
    ) {
        UserEntity currentUser = currentEmail != null ? userRepository.findByEmail(currentEmail).orElse(null) : null;
        ProfileEntity currentProfile = currentUser != null ? currentUser.getProfile() : null;

        List<UserEntity> allUsers = userRepository.findAllWithProfile();

        List<UserNetworkDto> dtoList = allUsers.stream()
                .filter(user -> {
                    // Exclure l'utilisateur connecté de ses propres suggestions et annuaire
                    if (currentUser != null && user.getId().equals(currentUser.getId())) {
                        return false;
                    }

                    // Filtre Rôle (Support Anglais et Français)
                    if (roleStr != null && !roleStr.isBlank() && !"ALL".equalsIgnoreCase(roleStr)) {
                        String r = roleStr.toUpperCase();
                        Role userRole = user.getRole() != null ? user.getRole() : Role.DEVELOPER;
                        if (r.contains("DEV") || r.contains("DÉVELOPPEUR") || r.contains("DEVELOPPEUR")) {
                            if (userRole != Role.DEVELOPER) return false;
                        } else if (r.contains("RECRUIT") || r.contains("RECRUT")) {
                            if (userRole != Role.RECRUITER) return false;
                        } else {
                            try {
                                Role targetRole = Role.valueOf(r);
                                if (userRole != targetRole) return false;
                            } catch (IllegalArgumentException ignored) {}
                        }
                    }

                    ProfileEntity profile = user.getProfile();

                    // Filtre Recherche (Nom, Titre, Email)
                    if (query != null && !query.isBlank()) {
                        String q = query.toLowerCase();
                        boolean matchName = profile != null && profile.getFullName() != null && profile.getFullName().toLowerCase().contains(q);
                        boolean matchTitle = profile != null && profile.getTitle() != null && profile.getTitle().toLowerCase().contains(q);
                        boolean matchEmail = user.getEmail() != null && user.getEmail().toLowerCase().contains(q);
                        if (!matchName && !matchTitle && !matchEmail) return false;
                    }

                    // Filtre Compétence
                    if (skill != null && !skill.isBlank()) {
                        String s = skill.toLowerCase();
                        boolean matchSkill = profile != null && profile.getSkills() != null && profile.getSkills().stream()
                                .anyMatch(sk -> sk.toLowerCase().contains(s));
                        if (!matchSkill) return false;
                    }

                    // Filtre Pays
                    if (country != null && !country.isBlank()) {
                        String c = country.toLowerCase();
                        boolean matchCountry = profile != null && profile.getCountry() != null && profile.getCountry().toLowerCase().contains(c);
                        if (!matchCountry) return false;
                    }

                    return true;
                })
                .map(user -> mapToUserNetworkDto(user, currentUser, currentProfile))
                .collect(Collectors.toList());

        // Tri intelligent selon le critère demandé
        String sortMode = (sort != null && !sort.isBlank()) ? sort.toUpperCase().trim() : "SUGGESTED";
        String myCountry = (currentProfile != null && currentProfile.getCountry() != null) ? currentProfile.getCountry().trim() : "";

        switch (sortMode) {
            case "POPULAR" -> dtoList.sort(
                    Comparator.comparing(UserNetworkDto::getFollowersCount, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(UserNetworkDto::getReputationScore, Comparator.nullsLast(Comparator.reverseOrder()))
            );
            case "SAME_COUNTRY" -> dtoList.sort((a, b) -> {
                boolean aSame = !myCountry.isEmpty() && a.getCountry() != null && myCountry.equalsIgnoreCase(a.getCountry().trim());
                boolean bSame = !myCountry.isEmpty() && b.getCountry() != null && myCountry.equalsIgnoreCase(b.getCountry().trim());
                if (aSame != bSame) return aSame ? -1 : 1;
                return Double.compare(
                        b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                        a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                );
            });
            case "RECENT" -> {
                // Ordre naturel de création de compte
            }
            case "SUGGESTED" -> dtoList.sort(
                    Comparator.comparing(UserNetworkDto::getMatchPercentage, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(UserNetworkDto::getReputationScore, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(UserNetworkDto::getFollowersCount, Comparator.nullsLast(Comparator.reverseOrder()))
            );
            default -> dtoList.sort(
                    Comparator.comparing(UserNetworkDto::getMatchPercentage, Comparator.nullsLast(Comparator.reverseOrder()))
            );
        }

        return dtoList;
    }

    @Transactional(readOnly = true)
    public List<NetworkSuggestionDto> getNetworkSuggestions(String currentEmail, int limit) {
        if (currentEmail == null) return Collections.emptyList();

        UserEntity currentUser = userRepository.findByEmail(currentEmail).orElse(null);
        if (currentUser == null) return Collections.emptyList();

        ProfileEntity currentProfile = currentUser.getProfile();

        List<UserEntity> candidates = userRepository.findAllWithProfile().stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .collect(Collectors.toList());

        if (candidates.isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Essai d'appel au Microservice FastAPI Intelligence
        try {
            Map<String, Object> targetMap = buildFastApiUserMap(currentUser, currentProfile, false);

            List<Map<String, Object>> candidateMaps = candidates.stream().map(u -> {
                boolean isFollowed = isUserFollowed(currentUser.getId(), u.getId());
                return buildFastApiUserMap(u, u.getProfile(), isFollowed);
            }).toList();

            Map<String, Object> payload = new HashMap<>();
            payload.put("target_user", targetMap);
            payload.put("candidates", candidateMaps);
            payload.put("limit", limit);

            Map<?, ?> response = restTemplate.postForObject(FASTAPI_SUGGESTIONS_URL, payload, Map.class);
            if (response != null && response.containsKey("suggestions")) {
                List<?> suggestionsList = (List<?>) response.get("suggestions");
                List<NetworkSuggestionDto> dtoList = new ArrayList<>();

                for (Object item : suggestionsList) {
                    if (item instanceof Map<?, ?> sug) {
                        String candidateId = (String) sug.get("user_id");
                        Double matchPct = sug.get("match_percentage") != null ? ((Number) sug.get("match_percentage")).doubleValue() : 75.0;
                        String reason = (String) sug.get("reason");
                        List<String> matchedSkills = (List<String>) sug.get("matched_skills");

                        UserEntity candidateUser = userRepository.findById(candidateId).orElse(null);
                        if (candidateUser != null) {
                            UserNetworkDto userDto = mapToUserNetworkDto(candidateUser, currentUser.getId());
                            dtoList.add(NetworkSuggestionDto.builder()
                                    .user(userDto)
                                    .matchPercentage(matchPct)
                                    .matchedSkills(matchedSkills != null ? matchedSkills : Collections.emptyList())
                                    .reason(reason)
                                    .build());
                        }
                    }
                }
                if (!dtoList.isEmpty()) {
                    return dtoList;
                }
            }
        } catch (Exception e) {
            log.warn("FastAPI suggestion microservice non joignable ({}), fallback direct Java.", e.getMessage());
        }

        // 2. Fallback direct en Java si FastAPI est hors-ligne
        return candidates.stream()
                .filter(c -> !isUserFollowed(currentUser.getId(), c.getId()))
                .limit(limit)
                .map(c -> {
                    UserNetworkDto userDto = mapToUserNetworkDto(c, currentUser.getId());
                    return NetworkSuggestionDto.builder()
                            .user(userDto)
                            .matchPercentage(80.0)
                            .matchedSkills(c.getProfile() != null ? c.getProfile().getSkills() : Collections.emptyList())
                            .reason("Membre recommandé dans la communauté AfriDev Hub")
                            .build();
                })
                .collect(Collectors.toList());
    }

    private boolean isUserFollowed(String followerId, String targetUserId) {
        if (followerId == null || targetUserId == null) return false;
        if (redisCacheService.isFollowing(followerId, targetUserId)) {
            return true;
        }
        return followRepository.existsByFollowerIdAndFollowingId(followerId, targetUserId);
    }

    private UserNetworkDto mapToUserNetworkDto(UserEntity user, String currentUserId) {
        UserEntity currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        ProfileEntity currentProfile = currentUser != null ? currentUser.getProfile() : null;
        return mapToUserNetworkDto(user, currentUser, currentProfile);
    }

    private UserNetworkDto mapToUserNetworkDto(UserEntity user, UserEntity currentUser, ProfileEntity currentProfile) {
        ProfileEntity profile = user.getProfile();

        // Calcul réel du score de réputation depuis PostgreSQL
        double repScore = calculateRealReputationScore(user.getId());

        long followersCount = redisCacheService.getFollowersCount(user.getId());
        if (followersCount == 0) {
            followersCount = followRepository.countByFollowingId(user.getId());
        }

        long followingCount = redisCacheService.getFollowingCount(user.getId());
        if (followingCount == 0) {
            followingCount = followRepository.countByFollowerId(user.getId());
        }

        boolean isFollowed = currentUser != null && isUserFollowed(currentUser.getId(), user.getId());

        // Calcul des compétences en commun
        List<String> matchedSkills = new ArrayList<>();
        if (currentProfile != null && currentProfile.getSkills() != null && profile != null && profile.getSkills() != null) {
            Set<String> mySkillsLower = currentProfile.getSkills().stream()
                    .filter(Objects::nonNull)
                    .map(s -> s.trim().toLowerCase())
                    .collect(Collectors.toSet());
            for (String sk : profile.getSkills()) {
                if (sk != null && mySkillsLower.contains(sk.trim().toLowerCase())) {
                    matchedSkills.add(sk.trim());
                }
            }
        }

        // Détection même pays / même ville
        String candCountry = (profile != null && profile.getCountry() != null) ? profile.getCountry().trim() : "";
        String myCountry = (currentProfile != null && currentProfile.getCountry() != null) ? currentProfile.getCountry().trim() : "";
        boolean sameCountry = !candCountry.isEmpty() && !myCountry.isEmpty() && candCountry.equalsIgnoreCase(myCountry);

        String candCity = (profile != null && profile.getCity() != null) ? profile.getCity().trim() : "";
        String myCity = (currentProfile != null && currentProfile.getCity() != null) ? currentProfile.getCity().trim() : "";
        boolean sameCity = sameCountry && !candCity.isEmpty() && !myCity.isEmpty() && candCity.equalsIgnoreCase(myCity);

        Role candRole = user.getRole() != null ? user.getRole() : Role.DEVELOPER;
        Role myRole = currentUser != null && currentUser.getRole() != null ? currentUser.getRole() : Role.DEVELOPER;

        double matchPercentage;
        String reason;

        if (currentUser != null) {
            double score = 25.0; // Base score

            // Priorité forte aux profils non suivis
            if (!isFollowed) {
                score += 30.0;
            } else {
                score -= 15.0; // Déjà suivi, placé plus bas dans les suggestions
            }

            // Proximité géographique
            if (sameCountry) {
                score += 25.0;
                if (sameCity) {
                    score += 10.0;
                }
            }

            // Compétences partagées
            score += Math.min(30.0, matchedSkills.size() * 10.0);

            // Synergie de rôles
            if (candRole != myRole) {
                score += 15.0; // Complémentarité Dev - Recruteur
            } else {
                score += 10.0; // Collaboration entre pairs
            }

            // Réputation & Popularité
            score += Math.min(20.0, repScore * 4.0);
            score += Math.min(15.0, followersCount * 1.5);

            // Profil complet
            if (profile != null) {
                if (profile.getAvatarUrl() != null && !profile.getAvatarUrl().isBlank()) score += 5.0;
                if (profile.getBio() != null && !profile.getBio().isBlank()) score += 5.0;
            }

            matchPercentage = Math.min(99.0, Math.max(35.0, (double) Math.round(score)));

            // Formulation de la raison explicite
            if (sameCountry && !matchedSkills.isEmpty()) {
                reason = "Même pays (" + candCountry + ") • " + matchedSkills.size() + " techno(s) partagée(s)";
            } else if (sameCountry) {
                reason = "Même pays (" + candCountry + ") • Synergie locale";
            } else if (!matchedSkills.isEmpty()) {
                reason = matchedSkills.size() + " techno(s) en commun (" + String.join(", ", matchedSkills.subList(0, Math.min(2, matchedSkills.size()))) + ")";
            } else if (candRole == Role.RECRUITER && myRole == Role.DEVELOPER) {
                reason = "Recruteur tech • Opportunités professionnelles";
            } else if (repScore >= 4.0) {
                reason = "Top Réputation (" + String.format(Locale.US, "%.1f", repScore) + "/5) certifiée par les pairs";
            } else if (followersCount >= 3) {
                reason = "Membre populaire • " + followersCount + " abonné(s)";
            } else {
                reason = "Membre recommandé de la communauté AfriDev";
            }
        } else {
            // Mode Visiteur non connecté
            double score = 40.0;
            score += Math.min(30.0, repScore * 6.0);
            score += Math.min(20.0, followersCount * 2.0);
            if (profile != null) {
                if (profile.getAvatarUrl() != null && !profile.getAvatarUrl().isBlank()) score += 5.0;
                if (profile.getSkills() != null && !profile.getSkills().isEmpty()) score += 5.0;
            }
            matchPercentage = Math.min(98.0, Math.max(50.0, (double) Math.round(score)));

            if (repScore >= 4.0) {
                reason = "Top Réputation AfriDev (" + String.format(Locale.US, "%.1f", repScore) + "/5)";
            } else if (followersCount >= 3) {
                reason = "Membre influent • " + followersCount + " abonné(s)";
            } else {
                reason = "Membre actif du réseau AfriDev Hub";
            }
        }

        return UserNetworkDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(profile != null ? profile.getFullName() : user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : "DEVELOPER")
                .title(profile != null ? profile.getTitle() : "Membre AfriDev")
                .country(profile != null ? profile.getCountry() : "")
                .city(profile != null ? profile.getCity() : "")
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .skills(profile != null && profile.getSkills() != null ? profile.getSkills() : Collections.emptyList())
                .reputationScore(repScore)
                .followersCount(followersCount)
                .followingCount(followingCount)
                .isFollowedByCurrentUser(isFollowed)
                .matchPercentage(matchPercentage)
                .suggestionReason(reason)
                .matchedSkills(matchedSkills)
                .build();
    }

    private double calculateRealReputationScore(String userId) {
        List<EvaluationEntity> evs = evaluationRepository.findByEvaluateeIdAndIsPublicTrueOrderByCreatedAtDesc(userId);
        if (evs.isEmpty()) {
            return 0.0;
        }
        double sum = evs.stream()
                .mapToDouble(e -> (e.getCodeQuality() + e.getTechnicalDepth() + e.getReliability() + e.getCollaborationRating()) / 4.0)
                .sum();
        return Math.round((sum / evs.size()) * 10.0) / 10.0;
    }

    private Map<String, Object> buildFastApiUserMap(UserEntity user, ProfileEntity profile, boolean isFollowed) {
        double repScore = calculateRealReputationScore(user.getId());
        long totalEvals = evaluationRepository.countByEvaluateeIdAndIsPublicTrue(user.getId());

        Map<String, Object> map = new HashMap<>();
        map.put("user_id", user.getId());
        map.put("full_name", profile != null ? profile.getFullName() : user.getEmail());
        map.put("role", user.getRole() != null ? user.getRole().name() : "DEVELOPER");
        map.put("skills", profile != null && profile.getSkills() != null ? profile.getSkills() : Collections.emptyList());
        map.put("country", profile != null ? profile.getCountry() : "");
        map.put("city", profile != null ? profile.getCity() : "");
        map.put("reputation_score", repScore);
        map.put("total_evaluations", (int) totalEvals);
        map.put("is_followed", isFollowed);
        return map;
    }
}
