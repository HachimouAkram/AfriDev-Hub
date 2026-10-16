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
        UserEntity currentUser = currentEmail != null ? userRepository.findByEmail(currentEmail).orElse(null) : null;
        String currentUserId = currentUser != null ? currentUser.getId() : null;

        String cacheKey = "cache:network:r:" + (roleStr != null ? roleStr : "ALL")
                + ":q:" + (query != null ? query.trim().toLowerCase() : "")
                + ":s:" + (skill != null ? skill.trim().toLowerCase() : "")
                + ":c:" + (country != null ? country.trim().toLowerCase() : "")
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

        List<UserNetworkDto> allFiltered = getNetworkUsers(currentEmail, roleStr, query, skill, country);
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
        UserEntity currentUser = currentEmail != null ? userRepository.findByEmail(currentEmail).orElse(null) : null;
        String currentUserId = currentUser != null ? currentUser.getId() : null;

        List<UserEntity> allUsers = userRepository.findAllWithProfile();

        return allUsers.stream()
                .filter(user -> {
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
                .map(user -> mapToUserNetworkDto(user, currentUserId))
                .collect(Collectors.toList());
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

        boolean isFollowed = currentUserId != null && isUserFollowed(currentUserId, user.getId());

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
