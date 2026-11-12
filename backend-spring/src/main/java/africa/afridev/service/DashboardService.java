package africa.afridev.service;

import africa.afridev.dto.dashboard.DashboardKpiResponse;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.DeveloperLevel;
import africa.afridev.repository.ApplicationRepository;
import africa.afridev.repository.FollowRepository;
import africa.afridev.repository.OpportunityRepository;
import africa.afridev.repository.ProfileRepository;
import africa.afridev.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final OpportunityRepository opportunityRepository;
    private final ApplicationRepository applicationRepository;
    private final ProfileRepository profileRepository;
    private final FollowRepository followRepository;
    private final RedisCacheService redisCacheService;

    private static final String KPI_CACHE_KEY_PREFIX = "dashboard:kpi:user:";
    private static final Duration KPI_CACHE_TTL = Duration.ofMinutes(5);

    @Transactional
    public DashboardKpiResponse getDashboardKpis(UserEntity user) {
        if (user == null) {
            return new DashboardKpiResponse();
        }

        String cacheKey = KPI_CACHE_KEY_PREFIX + user.getId();

        // 1. Tenter la lecture depuis le cache Redis
        try {
            DashboardKpiResponse cached = redisCacheService.get(cacheKey, DashboardKpiResponse.class);
            if (cached != null) {
                cached.setCached(true);
                log.debug("[REDIS KPI] KPI servis depuis le cache Redis pour {}", user.getEmail());
                return cached;
            }
        } catch (Exception e) {
            log.warn("[REDIS KPI] Échec lecture cache KPI pour {}: {}", user.getEmail(), e.getMessage());
        }

        // 2. Calcul des KPI en base de données
        long projectsCount = projectRepository.countByAuthorId(user.getId());
        long oppsCount = opportunityRepository.countByPublisherId(user.getId());
        long appsCount = applicationRepository.countByApplicantId(user.getId());
        long relationsCount = followRepository.countByFollowerId(user.getId());

        long xp = 0L;
        String levelTitle = "Junior";
        int levelNumber = 1;

        var profileOpt = profileRepository.findByUserId(user.getId());
        if (profileOpt.isPresent()) {
            var profile = profileOpt.get();
            xp = profile.getXpPoints() != null ? profile.getXpPoints() : 0L;
            DeveloperLevel devLevel = DeveloperLevel.fromXp(xp);
            levelTitle = devLevel.getTitle();
            levelNumber = devLevel.getLevel();

            // Mettre à jour si nécessaire le profil pour assurer la cohérence
            if (!devLevel.getTitle().equals(profile.getLevelTitle()) || profile.getLevelNumber() == null || profile.getLevelNumber() != devLevel.getLevel()) {
                profile.setLevelTitle(devLevel.getTitle());
                profile.setLevelNumber(devLevel.getLevel());
                profileRepository.save(profile);
            }
        }

        DashboardKpiResponse kpi = DashboardKpiResponse.builder()
                .totalProjects(projectsCount)
                .totalOpportunities(oppsCount)
                .totalRelations(relationsCount)
                .totalApplications(appsCount)
                .xpPoints(xp)
                .levelTitle(levelTitle)
                .levelNumber(levelNumber)
                .cached(false)
                .build();

        // 3. Écriture en cache Redis (TTL 5 minutes)
        try {
            redisCacheService.set(cacheKey, kpi, KPI_CACHE_TTL);
            log.info("[REDIS KPI] KPI calculés et mis en cache pour {} (TTL: 5 min)", user.getEmail());
        } catch (Exception e) {
            log.warn("[REDIS KPI] Échec écriture cache KPI: {}", e.getMessage());
        }

        return kpi;
    }

    public void evictKpiCache(String userId) {
        if (userId != null) {
            redisCacheService.delete(KPI_CACHE_KEY_PREFIX + userId);
            log.debug("[REDIS KPI] Cache KPI invalidé pour userId: {}", userId);
        }
    }
}
