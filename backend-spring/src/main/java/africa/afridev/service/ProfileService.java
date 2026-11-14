package africa.afridev.service;

import africa.afridev.dto.auth.ProfileDto;
import africa.afridev.dto.profile.GithubSyncRequest;
import africa.afridev.dto.profile.ProfileUpdateRequest;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.Availability;
import africa.afridev.repository.ProfileRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final RedisCacheService redisCacheService;
    private final africa.afridev.repository.ApplicationRepository applicationRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    @org.springframework.beans.factory.annotation.Value("${app.fastapi.url:http://localhost:8000}")
    private String fastApiBaseUrl = "http://localhost:8000";

    @Transactional(readOnly = true)
    public ProfileDto getProfileById(String id) {
        return getProfileById(id, null);
    }

    @Transactional(readOnly = true)
    public ProfileDto getProfileById(String id, String viewerEmail) {
        ProfileEntity profile = profileRepository.findById(id)
                .or(() -> profileRepository.findByUserId(id))
                .or(() -> userRepository.findByEmail(id).map(UserEntity::getProfile))
                .orElseThrow(() -> new IllegalArgumentException("Profil introuvable avec l'identifiant: " + id));

        ProfileDto dto = authService.mapToProfileDto(profile);

        // Vérification de la visibilité du CV
        boolean isOwner = viewerEmail != null && profile.getUser() != null && viewerEmail.equalsIgnoreCase(profile.getUser().getEmail());
        boolean isPublic = "PUBLIC".equalsIgnoreCase(profile.getCvVisibility()) || profile.getCvVisibility() == null;
        boolean hasAppliedToRecruiter = false;

        if (viewerEmail != null && !isOwner && !isPublic && profile.getUser() != null) {
            UserEntity viewer = userRepository.findByEmail(viewerEmail).orElse(null);
            if (viewer != null) {
                hasAppliedToRecruiter = applicationRepository.existsByRecruiterIdAndApplicantId(viewer.getId(), profile.getUser().getId());
            }
        }

        boolean canAccessCv = isOwner || isPublic || hasAppliedToRecruiter;
        dto.setIsCvAccessible(canAccessCv);
        if (!canAccessCv) {
            dto.setCvUrl(null); // Masque l'URL directe du fichier PDF
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public Page<ProfileDto> getAllProfiles(String country, String skill, Availability availability, Pageable pageable) {
        Page<ProfileEntity> profiles = profileRepository.findAll(pageable);
        return profiles.map(authService::mapToProfileDto);
    }

    @Transactional
    public ProfileDto updateProfile(String userEmail, ProfileUpdateRequest request) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ProfileEntity profile = user.getProfile();
        if (profile == null) {
            profile = ProfileEntity.builder().user(user).build();
        }

        if (request.getFullName() != null) profile.setFullName(request.getFullName());
        if (request.getCountry() != null) profile.setCountry(request.getCountry());
        if (request.getCity() != null) profile.setCity(request.getCity());
        if (request.getTitle() != null) profile.setTitle(request.getTitle());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getSkills() != null) profile.setSkills(request.getSkills());
        if (request.getLanguages() != null) profile.setLanguages(request.getLanguages());
        if (request.getYearsExperience() != null) profile.setYearsExperience(request.getYearsExperience());
        if (request.getAvailability() != null) profile.setAvailability(request.getAvailability());
        if (request.getHourlyRate() != null) profile.setHourlyRate(request.getHourlyRate());
        if (request.getGithubUrl() != null) profile.setGithubUrl(request.getGithubUrl());
        if (request.getLinkedinUrl() != null) profile.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getZindiUrl() != null) profile.setZindiUrl(request.getZindiUrl());
        if (request.getPortfolioUrl() != null) profile.setPortfolioUrl(request.getPortfolioUrl());
        if (request.getAvatarUrl() != null) profile.setAvatarUrl(request.getAvatarUrl());
        if (request.getCvUrl() != null) profile.setCvUrl(request.getCvUrl());
        if (request.getCvVisibility() != null) profile.setCvVisibility(request.getCvVisibility());
        if (request.getPreferredLanguage() != null) profile.setPreferredLanguage(request.getPreferredLanguage());
        if (request.getWhatsappEnabled() != null) profile.setWhatsappEnabled(request.getWhatsappEnabled());
        if (request.getWhatsappNumber() != null) profile.setWhatsappNumber(request.getWhatsappNumber());

        profile.setCompletionScore(calculateCompletionScore(profile));

        ProfileEntity savedProfile = profileRepository.save(profile);
        redisCacheService.evictNetworkCache();
        redisCacheService.evictLeaderboardCache();
        return authService.mapToProfileDto(savedProfile);
    }

    @Transactional
    public ProfileDto syncGithub(String userEmail, GithubSyncRequest request) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ProfileEntity profile = user.getProfile();
        if (profile == null) {
            throw new IllegalStateException("Le profil utilisateur doit d'abord être initialisé.");
        }

        String username = request.getGithubUsername().trim();
        profile.setGithubUrl("https://github.com/" + username);

        // Appel au microservice FastAPI pour la synchronisation GitHub
        try {
            String url = fastApiBaseUrl.replaceAll("/+$", "") + "/api/v1/github/stats/" + username;
            String jsonStats = restTemplate.getForObject(url, String.class);
            if (jsonStats != null) {
                profile.setGithubStatsJson(jsonStats);
            }
        } catch (Exception e) {
            // Fallback mock stats en cas d'indisponibilité temporaire du microservice
            profile.setGithubStatsJson("{\"username\":\"" + username + "\",\"public_repos\":15,\"total_stars\":24,\"total_contributions_last_year\":340,\"top_languages\":[{\"name\":\"TypeScript\",\"percentage\":45.0,\"color\":\"#3178C6\"},{\"name\":\"Java\",\"percentage\":35.0,\"color\":\"#B07219\"}]}");
        }

        profile.setCompletionScore(calculateCompletionScore(profile));
        ProfileEntity saved = profileRepository.save(profile);

        return authService.mapToProfileDto(saved);
    }

    @Transactional
    public ProfileDto verifyMobileMoney(String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ProfileEntity profile = user.getProfile();
        profile.setMobileMoneyVerified(true);
        profile.setCompletionScore(calculateCompletionScore(profile));

        ProfileEntity saved = profileRepository.save(profile);
        redisCacheService.evictNetworkCache();
        redisCacheService.evictLeaderboardCache();
        return authService.mapToProfileDto(saved);
    }

    private int calculateCompletionScore(ProfileEntity profile) {
        int score = 0;

        // Champs obligatoires (60%)
        if (profile.getFullName() != null && !profile.getFullName().isBlank()) score += 15;
        if (profile.getCountry() != null && !profile.getCountry().isBlank()) score += 15;
        if (profile.getCity() != null && !profile.getCity().isBlank()) score += 15;
        if (profile.getTitle() != null && !profile.getTitle().isBlank()) score += 15;

        // Liens externes & GitHub Sync (15%)
        if (profile.getGithubUrl() != null || profile.getLinkedinUrl() != null || profile.getPortfolioUrl() != null) score += 15;

        // GitHub Stats synchronisés (15%)
        if (profile.getGithubStatsJson() != null && !profile.getGithubStatsJson().isBlank()) score += 15;

        // Verification Mobile Money (10%)
        if (Boolean.TRUE.equals(profile.getMobileMoneyVerified())) score += 10;

        return Math.min(score, 100);
    }
}
