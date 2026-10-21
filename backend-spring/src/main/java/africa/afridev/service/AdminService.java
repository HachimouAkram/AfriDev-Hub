package africa.afridev.service;

import africa.afridev.dto.admin.*;
import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.project.ProjectDto;
import africa.afridev.model.entity.*;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.ReportStatus;
import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.UserStatus;
import africa.afridev.repository.*;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import africa.afridev.dto.PagedResult;
import com.fasterxml.jackson.databind.JavaType;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ProjectRepository projectRepository;
    private final OpportunityRepository opportunityRepository;
    private final EvaluationRepository evaluationRepository;
    private final AuditLogRepository auditLogRepository;
    private final ReportRepository reportRepository;
    private final AuthService authService;
    private final ProjectService projectService;
    private final RedisCacheService redisCacheService;
    private final EmailService emailService;

    private static final String ADOPTION_CACHE_KEY = "admin:analytics:countries";
    private static final String ADMIN_USERS_CACHE_PREFIX = "cache:admin:users:";


    @Transactional(readOnly = true)
    public AdminStatsDto getPlatformStats() {
        long totalUsers = userRepository.count();
        long totalProfiles = profileRepository.count();
        long totalProjects = projectRepository.count();
        long totalOpportunities = opportunityRepository.count();
        long totalEvaluations = evaluationRepository.count();

        Map<String, Long> usersByCountry = new HashMap<>();
        profileRepository.findAll().forEach(profile -> {
            String country = profile.getCountry() != null ? profile.getCountry() : "Non spécifié";
            usersByCountry.put(country, usersByCountry.getOrDefault(country, 0L) + 1);
        });

        return AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .totalProfiles(totalProfiles)
                .totalProjects(totalProjects)
                .totalOpportunities(totalOpportunities)
                .totalEvaluations(totalEvaluations)
                .usersByCountry(usersByCountry)
                .build();
    }

    @Transactional(readOnly = true)
    public PlatformAdoptionSummaryDto getCountryAdoptionStats() {
        PlatformAdoptionSummaryDto cached = redisCacheService.get(ADOPTION_CACHE_KEY, PlatformAdoptionSummaryDto.class);
        if (cached != null) {
            return cached;
        }

        List<ProfileEntity> allProfiles = profileRepository.findAll();
        long totalUsers = userRepository.count();
        long totalProjects = projectRepository.count();
        long totalOpportunities = opportunityRepository.count();

        Map<String, List<ProfileEntity>> byCountry = allProfiles.stream()
                .filter(p -> p.getCountry() != null && !p.getCountry().isBlank())
                .collect(Collectors.groupingBy(ProfileEntity::getCountry));

        List<CountryAdoptionStatsDto> countryStats = new ArrayList<>();

        for (Map.Entry<String, List<ProfileEntity>> entry : byCountry.entrySet()) {
            String country = entry.getKey();
            List<ProfileEntity> profiles = entry.getValue();

            long userCount = profiles.size();
            long devCount = profiles.stream()
                    .filter(p -> p.getUser() != null && p.getUser().getRole() == Role.DEVELOPER)
                    .count();
            long recruiterCount = profiles.stream()
                    .filter(p -> p.getUser() != null && p.getUser().getRole() == Role.RECRUITER)
                    .count();
            long verifiedCount = profiles.stream()
                    .filter(p -> Boolean.TRUE.equals(p.getMobileMoneyVerified()))
                    .count();

            long projectCount = profiles.stream()
                    .mapToLong(p -> p.getUser() != null ? projectRepository.countByAuthorId(p.getUser().getId()) : 0L)
                    .sum();

            long opportunityCount = profiles.stream()
                    .mapToLong(p -> p.getUser() != null ? opportunityRepository.countByPublisherId(p.getUser().getId()) : 0L)
                    .sum();

            double percentage = totalUsers > 0
                    ? Math.round((userCount * 100.0 / totalUsers) * 10.0) / 10.0
                    : 0.0;

            countryStats.add(CountryAdoptionStatsDto.builder()
                    .country(country)
                    .userCount(userCount)
                    .developerCount(devCount)
                    .recruiterCount(recruiterCount)
                    .verifiedUsersCount(verifiedCount)
                    .projectCount(projectCount)
                    .opportunityCount(opportunityCount)
                    .adoptionPercentage(percentage)
                    .build());
        }

        countryStats.sort(Comparator.comparingLong(CountryAdoptionStatsDto::getUserCount)
                .thenComparingLong(CountryAdoptionStatsDto::getProjectCount)
                .reversed());

        for (int i = 0; i < countryStats.size(); i++) {
            countryStats.get(i).setRank(i + 1);
        }

        PlatformAdoptionSummaryDto summary = PlatformAdoptionSummaryDto.builder()
                .totalContinentalUsers(totalUsers)
                .totalContinentalProjects(totalProjects)
                .totalContinentalOpportunities(totalOpportunities)
                .activeCountriesCount(countryStats.size())
                .countries(countryStats)
                .build();

        redisCacheService.set(ADOPTION_CACHE_KEY, summary, Duration.ofMinutes(15));
        return summary;
    }

    @Transactional(readOnly = true)
    public Page<UserAdminDto> getAdminUsers(String search, String country, Role role, UserStatus status, Pageable pageable) {
        String cacheKey = ADMIN_USERS_CACHE_PREFIX
                + "q:" + (search != null && !search.isBlank() ? search.trim().toLowerCase() : "all")
                + ":c:" + (country != null && !country.isBlank() ? country.trim().toLowerCase() : "all")
                + ":r:" + (role != null ? role.name() : "all")
                + ":s:" + (status != null ? status.name() : "all")
                + ":p:" + pageable.getPageNumber()
                + ":sz:" + pageable.getPageSize();

        try {
            JavaType type = redisCacheService.getObjectMapper().getTypeFactory()
                    .constructParametricType(PagedResult.class, UserAdminDto.class);
            PagedResult<UserAdminDto> cached = redisCacheService.get(cacheKey, type);
            if (cached != null) {
                return cached.toPage();
            }
        } catch (Exception e) {
            log.warn("[REDIS] Erreur de lecture du cache admin users : {}", e.getMessage());
        }

        Specification<UserEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<UserEntity, ProfileEntity> profileJoin = root.join("profile", JoinType.LEFT);

            if (search != null && !search.trim().isEmpty()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate emailLike = cb.like(cb.lower(root.get("email")), term);
                Predicate nameLike = cb.like(cb.lower(profileJoin.get("fullName")), term);
                Predicate titleLike = cb.like(cb.lower(profileJoin.get("title")), term);
                Predicate cityLike = cb.like(cb.lower(profileJoin.get("city")), term);
                predicates.add(cb.or(emailLike, nameLike, titleLike, cityLike));
            }

            if (country != null && !country.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(profileJoin.get("country")), country.trim().toLowerCase()));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<UserEntity> users = userRepository.findAll(spec, pageable);
        Page<UserAdminDto> dtoPage = users.map(this::mapToUserAdminDto);

        try {
            redisCacheService.set(cacheKey, PagedResult.from(dtoPage), Duration.ofMinutes(10));
        } catch (Exception e) {
            log.warn("[REDIS] Erreur d'enregistrement du cache admin users : {}", e.getMessage());
        }

        return dtoPage;
    }

    @Transactional
    public UserDto updateUserStatus(String adminEmail, String userId, UserStatusUpdateRequest request) {
        UserEntity admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalArgumentException("Admin non trouvé."));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'id: " + userId));

        // Empêcher un admin de s'auto-sanctionner
        if (admin.getId().equals(user.getId())) {
            throw new IllegalStateException("Vous ne pouvez pas modifier le statut de votre propre compte.");
        }

        user.setStatus(request.getStatus());
        UserEntity savedUser = userRepository.save(user);

        // Journal de sécurité d'audit
        AuditLogEntity auditLog = AuditLogEntity.builder()
                .user(admin)
                .action("UPDATE_USER_STATUS")
                .resource("USER")
                .resourceId(userId)
                .metadataJson("{\"new_status\":\"" + request.getStatus() + "\", \"reason\":\"" + (request.getReason() != null ? request.getReason().replace("\"", "\\\"") : "") + "\"}")
                .build();
        auditLogRepository.save(auditLog);

        // Envoi de la notification par email de sanction ou réactivation
        try {
            String fullName = savedUser.getProfile() != null ? savedUser.getProfile().getFullName() : null;
            emailService.sendAccountSanctionEmail(savedUser.getEmail(), fullName, request.getStatus().name(), request.getReason());
        } catch (Exception e) {
            log.warn("[ADMIN] Échec de l'envoi d'email de sanction à {} : {}", savedUser.getEmail(), e.getMessage());
        }

        // Invalidation des caches liés aux utilisateurs
        redisCacheService.evictAdminUsersCache();
        redisCacheService.evictNetworkCache();
        redisCacheService.evictByPrefix(ADOPTION_CACHE_KEY);

        return authService.mapToUserDto(savedUser);
    }

    @Transactional
    public ProjectDto moderateProject(String adminEmail, String projectId, ProjectModerateRequest request) {
        UserEntity admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalArgumentException("Admin non trouvé."));

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable avec l'id: " + projectId));

        ContentStatus previousStatus = project.getStatus();
        project.setStatus(request.getStatus());
        ProjectEntity saved = projectRepository.save(project);

        // Journal d'audit
        AuditLogEntity auditLog = AuditLogEntity.builder()
                .user(admin)
                .action("MODERATE_PROJECT")
                .resource("PROJECT")
                .resourceId(projectId)
                .metadataJson("{\"previous_status\":\"" + previousStatus + "\", \"new_status\":\"" + request.getStatus() + "\", \"reason\":\"" + (request.getReason() != null ? request.getReason().replace("\"", "\\\"") : "") + "\"}")
                .build();
        auditLogRepository.save(auditLog);

        // Purge du cache des projets
        redisCacheService.evictProjectsCache();

        // Notification par email à l'auteur si demandé
        if (Boolean.TRUE.equals(request.getNotifyAuthor()) && project.getAuthor() != null) {
            try {
                String authorName = project.getAuthor().getProfile() != null ? project.getAuthor().getProfile().getFullName() : null;
                emailService.sendProjectModerationEmail(
                        project.getAuthor().getEmail(),
                        authorName,
                        project.getTitle(),
                        request.getStatus().name(),
                        request.getReason()
                );
            } catch (Exception e) {
                log.warn("[ADMIN] Échec de l'envoi d'email de modération de projet à {} : {}", project.getAuthor().getEmail(), e.getMessage());
            }
        }

        return projectService.mapToProjectDto(saved, adminEmail);
    }

    @Transactional(readOnly = true)
    public Page<ReportDto> getReports(ReportStatus status, Pageable pageable) {
        Page<ReportEntity> reports;
        if (status != null) {
            reports = reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            reports = reportRepository.findAll(pageable);
        }
        return reports.map(this::mapToReportDto);
    }

    @Transactional
    public ReportDto createReport(String userEmail, ReportCreateRequest request) {
        UserEntity reporter = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ReportEntity report = ReportEntity.builder()
                .reporter(reporter)
                .resource(request.getResource())
                .resourceId(request.getResourceId())
                .reason(request.getReason())
                .status(ReportStatus.PENDING)
                .build();

        ReportEntity saved = reportRepository.save(report);
        return mapToReportDto(saved);
    }

    @Transactional
    public ReportDto handleReport(String adminEmail, String reportId, ReportStatus newStatus) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Signalement introuvable."));

        report.setStatus(newStatus);
        report.setHandledBy(adminEmail);
        report.setHandledAt(LocalDateTime.now());

        ReportEntity saved = reportRepository.save(report);
        return mapToReportDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToAuditLogDto);
    }

    private UserAdminDto mapToUserAdminDto(UserEntity user) {
        ProfileEntity p = user.getProfile();
        long projectsCount = projectRepository.countByAuthorId(user.getId());
        long opportunitiesCount = opportunityRepository.countByPublisherId(user.getId());
        long reportsCount = reportRepository.countByResourceId(user.getId());

        return UserAdminDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .emailVerified(user.getEmailVerified())
                .twoFactorEnabled(Boolean.TRUE.equals(user.getTwoFactorEnabled()))
                .role(user.getRole())
                .status(user.getStatus())
                .fullName(p != null ? p.getFullName() : null)
                .country(p != null ? p.getCountry() : null)
                .city(p != null ? p.getCity() : null)
                .title(p != null ? p.getTitle() : null)
                .avatarUrl(p != null ? p.getAvatarUrl() : null)
                .mobileMoneyVerified(p != null && Boolean.TRUE.equals(p.getMobileMoneyVerified()))
                .xpPoints(p != null ? p.getXpPoints() : 0L)
                .levelTitle(p != null ? p.getLevelTitle() : "Junior")
                .completionScore(p != null ? p.getCompletionScore() : 0)
                .projectsCount(projectsCount)
                .opportunitiesCount(opportunitiesCount)
                .reportsCount(reportsCount)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private ReportDto mapToReportDto(ReportEntity r) {
        return ReportDto.builder()
                .id(r.getId())
                .reporter(authService.mapToUserDto(r.getReporter()))
                .resource(r.getResource())
                .resourceId(r.getResourceId())
                .reason(r.getReason())
                .status(r.getStatus())
                .handledBy(r.getHandledBy())
                .handledAt(r.getHandledAt())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private AuditLogDto mapToAuditLogDto(AuditLogEntity a) {
        return AuditLogDto.builder()
                .id(a.getId())
                .user(a.getUser() != null ? authService.mapToUserDto(a.getUser()) : null)
                .action(a.getAction())
                .resource(a.getResource())
                .resourceId(a.getResourceId())
                .metadataJson(a.getMetadataJson())
                .ipAddress(a.getIpAddress())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
