package africa.afridev.service;

import africa.afridev.model.entity.*;
import africa.afridev.model.enums.ApplicationStatus;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.DeveloperLevel;
import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.XpSourceType;
import africa.afridev.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class XpService {

    private final XpTransactionRepository xpTransactionRepository;
    private final ProfileRepository profileRepository;
    private final ProjectRepository projectRepository;
    private final RecognitionRepository recognitionRepository;
    private final EvaluationRepository evaluationRepository;
    private final ApplicationRepository applicationRepository;
    private final RedisCacheService redisCacheService;

    public static final long XP_PROJECT_PUBLISHED = 50L;
    public static final long XP_RECOGNITION_RECEIVED = 15L;
    public static final long XP_PROJECT_VIEW = 1L;
    public static final long XP_EVALUATION_HIGH = 50L;
    public static final long XP_EVALUATION_MEDIUM = 30L;
    public static final long XP_EVALUATOR_REWARD = 15L;
    public static final long XP_APPLICATION_ACCEPTED = 40L;
    public static final long XP_PROFILE_COMPLETED = 30L;

    /**
     * Attribue des points XP avec enregistrement dans l'historique de transactions
     */
    @Transactional
    public void awardXp(UserEntity user, long points, XpSourceType sourceType, String sourceId, String description) {
        if (user == null || points <= 0) return;
        if (user.getRole() == Role.RECRUITER) {
            log.debug("L'utilisateur {} est un RECRUTEUR, l'XP développeur individuel n'est pas attribué", user.getEmail());
            return;
        }

        // Anti-doublon pour les actions uniques (comme la publication d'un projet spécifique ou complétion de profil)
        if (sourceId != null && (sourceType == XpSourceType.PROJECT_PUBLISHED || sourceType == XpSourceType.PROFILE_COMPLETED || sourceType == XpSourceType.APPLICATION_ACCEPTED)) {
            if (xpTransactionRepository.existsByUserIdAndSourceTypeAndSourceId(user.getId(), sourceType, sourceId)) {
                log.debug("XP déjà attribué pour {} et sourceId {}", sourceType, sourceId);
                return;
            }
        }

        // Plafond anti-spam pour les vues (max 50 points par jour via les vues)
        if (sourceType == XpSourceType.PROJECT_VIEW) {
            LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
            long viewsToday = xpTransactionRepository.countByUserIdAndSourceTypeAndCreatedAtAfter(user.getId(), sourceType, startOfDay);
            if (viewsToday >= 50) {
                return;
            }
        }

        XpTransactionEntity transaction = XpTransactionEntity.builder()
                .user(user)
                .points(points)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .description(description)
                .build();
        xpTransactionRepository.save(transaction);

        profileRepository.findByUserId(user.getId()).ifPresent(profile -> {
            long currentXp = profile.getXpPoints() != null ? profile.getXpPoints() : 0L;
            long newXp = currentXp + points;
            profile.setXpPoints(newXp);

            DeveloperLevel level = DeveloperLevel.fromXp(newXp);
            profile.setLevelNumber(level.getLevel());
            profile.setLevelTitle(level.getTitle());

            profileRepository.save(profile);
            redisCacheService.evictLeaderboardCache();
            log.info("Attribué {} XP à l'utilisateur {} (Total: {}, Niveau: {})", points, user.getEmail(), newXp, level.getTitle());
        });
    }

    /**
     * Recalcule et initialise l'XP d'un profil à partir de ses activités passées dans la base
     */
    @Transactional
    public void recalculateUserXp(UserEntity user) {
        if (user == null || user.getRole() == Role.RECRUITER) return;

        profileRepository.findByUserId(user.getId()).ifPresent(profile -> {
            long totalXp = 0L;

            // 1. Projets publiés (+50 XP par projet)
            List<ProjectEntity> projects = projectRepository.findAll().stream()
                    .filter(p -> p.getAuthor() != null && p.getAuthor().getId().equals(user.getId()) && p.getStatus() == ContentStatus.PUBLISHED)
                    .toList();
            totalXp += (projects.size() * XP_PROJECT_PUBLISHED);

            // 2. Vues et likes (recognitions) reçus sur ses projets
            for (ProjectEntity p : projects) {
                int recognitions = p.getRecognitionsCount() != null ? p.getRecognitionsCount() : 0;
                totalXp += (recognitions * XP_RECOGNITION_RECEIVED);

                int views = p.getViewsCount() != null ? p.getViewsCount() : 0;
                totalXp += Math.min(views, 200) * XP_PROJECT_VIEW;
            }

            // 3. Évaluations reçues
            List<EvaluationEntity> evaluations = evaluationRepository.findByEvaluateeId(user.getId());
            for (EvaluationEntity eval : evaluations) {
                double avg = (eval.getCodeQuality() + eval.getCollaborationRating() + eval.getTechnicalDepth() + eval.getReliability()) / 4.0;
                if (avg >= 4.0) {
                    totalXp += XP_EVALUATION_HIGH;
                } else {
                    totalXp += XP_EVALUATION_MEDIUM;
                }
            }

            // 4. Candidatures acceptées
            List<ApplicationEntity> acceptedApps = applicationRepository.findByApplicantIdOrderByCreatedAtDesc(user.getId()).stream()
                    .filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED)
                    .toList();
            totalXp += (acceptedApps.size() * XP_APPLICATION_ACCEPTED);

            // 5. Complétion du profil
            if (profile.getCompletionScore() != null && profile.getCompletionScore() >= 80) {
                totalXp += XP_PROFILE_COMPLETED;
            }

            profile.setXpPoints(totalXp);
            DeveloperLevel level = DeveloperLevel.fromXp(totalXp);
            profile.setLevelNumber(level.getLevel());
            profile.setLevelTitle(level.getTitle());

            if (profile.getSkills() != null) {
                profile.setSkills(new ArrayList<>(profile.getSkills()));
            }
            if (profile.getLanguages() != null) {
                profile.setLanguages(new ArrayList<>(profile.getLanguages()));
            }

            profileRepository.save(profile);
            redisCacheService.evictLeaderboardCache();
            log.info("Recalcul XP terminé pour {} : {} XP (Niveau {})", user.getEmail(), totalXp, level.getTitle());
        });
    }

    /**
     * Initialise l'XP de tous les utilisateurs existants au démarrage si nécessaire
     */
    @Transactional
    public void initializeAllProfilesXp() {
        List<ProfileEntity> allProfiles = profileRepository.findAll();
        for (ProfileEntity profile : allProfiles) {
            if (profile.getUser() != null && (profile.getXpPoints() == null || profile.getXpPoints() == 0L)) {
                recalculateUserXp(profile.getUser());
            }
        }
    }
}
