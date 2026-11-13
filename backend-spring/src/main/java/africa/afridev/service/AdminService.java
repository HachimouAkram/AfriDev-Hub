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
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
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
    private final CompanyRepository companyRepository;
    private final GroupRepository groupRepository;
    private final ResourceRepository resourceRepository;
    private final TechEventRepository techEventRepository;
    private final ApplicationRepository applicationRepository;
    private final AuthService authService;
    private final ProjectService projectService;
    private final RedisCacheService redisCacheService;
    private final EmailService emailService;
    private final UserAccountDeletionService userAccountDeletionService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private static final String PLATFORM_STATS_CACHE_KEY = "admin:analytics:platform-stats";
    private static final String ADOPTION_CACHE_KEY = "admin:analytics:countries";
    private static final String ADMIN_USERS_CACHE_PREFIX = "cache:admin:users:";


    @Transactional(readOnly = true)
    public AdminStatsDto getPlatformStats() {
        AdminStatsDto cached = redisCacheService.get(PLATFORM_STATS_CACHE_KEY, AdminStatsDto.class);
        if (cached != null) {
            return cached;
        }

        long totalUsers = userRepository.count();
        long totalProfiles = profileRepository.count();
        long totalProjects = projectRepository.count();
        long totalOpportunities = opportunityRepository.count();
        long totalEvaluations = evaluationRepository.count();
        long totalCompanies = companyRepository.count();
        long totalResources = resourceRepository.count();
        long totalGroups = groupRepository.count();
        long totalEvents = techEventRepository.count();
        long totalApplications = applicationRepository.count();

        List<ProfileEntity> allProfiles = profileRepository.findAll();
        List<CompanyEntity> allCompanies = companyRepository.findAll();
        List<OpportunityEntity> allOpportunities = opportunityRepository.findAll();
        List<ResourceEntity> allResources = resourceRepository.findAll();
        List<GroupEntity> allGroups = groupRepository.findAll();

        long totalDevelopers = allProfiles.stream()
                .filter(p -> p.getUser() != null && p.getUser().getRole() == Role.DEVELOPER)
                .count();

        long totalRecruiters = allProfiles.stream()
                .filter(p -> p.getUser() != null && p.getUser().getRole() == Role.RECRUITER)
                .count();

        long totalVerifiedUsers = allProfiles.stream()
                .filter(p -> Boolean.TRUE.equals(p.getMobileMoneyVerified()))
                .count();

        long totalVerifiedCompanies = allCompanies.stream()
                .filter(c -> Boolean.TRUE.equals(c.getVerified()))
                .count();

        long activeCompanies = allCompanies.stream()
                .filter(c -> c.getStatus() == ContentStatus.PUBLISHED)
                .count();

        long activeOpportunities = allOpportunities.stream()
                .filter(o -> o.getStatus() == ContentStatus.PUBLISHED)
                .count();

        long totalTrainingsCompleted = allResources.stream()
                .mapToLong(r -> r.getCompletionsCount() != null ? r.getCompletionsCount() : 0)
                .sum();

        long totalGroupMembers = allGroups.stream()
                .mapToLong(g -> g.getMemberCount() != null ? g.getMemberCount() : 1)
                .sum();

        Map<String, Long> opportunitiesByType = allOpportunities.stream()
                .filter(o -> o.getType() != null)
                .collect(Collectors.groupingBy(o -> o.getType().name(), Collectors.counting()));

        Map<String, Long> usersByCountry = new HashMap<>();
        allProfiles.forEach(profile -> {
            String country = profile.getCountry() != null && !profile.getCountry().isBlank() ? profile.getCountry() : "Non spécifié";
            usersByCountry.put(country, usersByCountry.getOrDefault(country, 0L) + 1);
        });

        Map<String, Long> companiesByCountry = new HashMap<>();
        allCompanies.forEach(comp -> {
            String country = comp.getCountry() != null && !comp.getCountry().isBlank() ? comp.getCountry() : "Non spécifié";
            companiesByCountry.put(country, companiesByCountry.getOrDefault(country, 0L) + 1);
        });

        Map<String, Long> ecosystemDistribution = new LinkedHashMap<>();
        ecosystemDistribution.put("Développeurs", totalDevelopers);
        ecosystemDistribution.put("Entreprises", totalCompanies);
        ecosystemDistribution.put("Offres", totalOpportunities);
        ecosystemDistribution.put("Formations", totalResources);
        ecosystemDistribution.put("Groupes", totalGroups);
        ecosystemDistribution.put("Projets", totalProjects);

        // Top pays classés par volume de talents & entreprises
        List<Map<String, Object>> topCountriesPerformance = usersByCountry.entrySet().stream()
                .filter(e -> !"Non spécifié".equals(e.getKey()))
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("country", e.getKey());
                    item.put("users", e.getValue());
                    item.put("companies", companiesByCountry.getOrDefault(e.getKey(), 0L));
                    return item;
                })
                .collect(Collectors.toList());

        // 6 Derniers mois d'historique glissant calculés dynamiquement depuis la base de données
        YearMonth currentYm = YearMonth.now();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM", Locale.FRENCH);
        List<UserEntity> allUsersList = userRepository.findAll();
        List<ProjectEntity> allProjectsList = projectRepository.findAll();

        List<Map<String, Object>> monthlyTrends = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth targetYm = currentYm.minusMonths(i);
            String rawMonth = targetYm.format(monthFmt);
            String monthName = rawMonth.substring(0, 1).toUpperCase(Locale.FRENCH) + rawMonth.substring(1).replace(".", "");

            long talentsMonth = allUsersList.stream()
                    .filter(u -> u.getCreatedAt() != null && YearMonth.from(u.getCreatedAt()).equals(targetYm))
                    .count();

            long companiesMonth = allCompanies.stream()
                    .filter(c -> c.getCreatedAt() != null && YearMonth.from(c.getCreatedAt()).equals(targetYm))
                    .count();

            long projectsMonth = allProjectsList.stream()
                    .filter(p -> p.getCreatedAt() != null && YearMonth.from(p.getCreatedAt()).equals(targetYm))
                    .count();

            long opportunitiesMonth = allOpportunities.stream()
                    .filter(o -> o.getCreatedAt() != null && YearMonth.from(o.getCreatedAt()).equals(targetYm))
                    .count();

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", monthName);
            point.put("talents", talentsMonth);
            point.put("companies", companiesMonth);
            point.put("projects", projectsMonth);
            point.put("opportunities", opportunitiesMonth);
            monthlyTrends.add(point);
        }

        AdminStatsDto stats = AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .totalProfiles(totalProfiles)
                .totalDevelopers(totalDevelopers)
                .totalRecruiters(totalRecruiters)
                .totalVerifiedUsers(totalVerifiedUsers)
                .totalCompanies(totalCompanies)
                .totalVerifiedCompanies(totalVerifiedCompanies)
                .activeCompanies(activeCompanies)
                .totalOpportunities(totalOpportunities)
                .activeOpportunities(activeOpportunities)
                .totalApplications(totalApplications)
                .opportunitiesByType(opportunitiesByType)
                .totalResources(totalResources)
                .totalTrainingsCompleted(totalTrainingsCompleted)
                .totalGroups(totalGroups)
                .totalGroupMembers(totalGroupMembers)
                .totalProjects(totalProjects)
                .totalEvaluations(totalEvaluations)
                .totalEvents(totalEvents)
                .usersByCountry(usersByCountry)
                .companiesByCountry(companiesByCountry)
                .ecosystemDistribution(ecosystemDistribution)
                .topCountriesPerformance(topCountriesPerformance)
                .monthlyTrends(monthlyTrends)
                .build();

        redisCacheService.set(PLATFORM_STATS_CACHE_KEY, stats, Duration.ofMinutes(10));
        return stats;
    }

    @Transactional(readOnly = true)
    public PlatformAdoptionSummaryDto getCountryAdoptionStats() {
        PlatformAdoptionSummaryDto cached = redisCacheService.get(ADOPTION_CACHE_KEY, PlatformAdoptionSummaryDto.class);
        if (cached != null) {
            return cached;
        }

        List<ProfileEntity> allProfiles = profileRepository.findAll();
        List<CompanyEntity> allCompanies = companyRepository.findAll();
        List<GroupEntity> allGroups = groupRepository.findAll();
        List<OpportunityEntity> allOpportunities = opportunityRepository.findAll();
        List<ResourceEntity> allResources = resourceRepository.findAll();

        long totalUsers = userRepository.count();
        long totalProjects = projectRepository.count();
        long totalOpportunities = opportunityRepository.count();
        long totalCompanies = allCompanies.size();
        long totalGroups = allGroups.size();
        long totalTrainings = allResources.size();

        long totalContinentalDevelopers = allProfiles.stream()
                .filter(p -> p.getUser() != null && p.getUser().getRole() == Role.DEVELOPER)
                .count();

        long totalContinentalRecruiters = allProfiles.stream()
                .filter(p -> p.getUser() != null && p.getUser().getRole() == Role.RECRUITER)
                .count();

        long totalContinentalVerifiedUsers = allProfiles.stream()
                .filter(p -> Boolean.TRUE.equals(p.getMobileMoneyVerified()))
                .count();

        // Réunir tous les pays uniques représentés sur la plateforme
        Set<String> uniqueCountries = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        allProfiles.stream()
                .map(ProfileEntity::getCountry)
                .filter(c -> c != null && !c.isBlank())
                .forEach(uniqueCountries::add);

        allCompanies.stream()
                .map(CompanyEntity::getCountry)
                .filter(c -> c != null && !c.isBlank())
                .forEach(uniqueCountries::add);

        allGroups.stream()
                .map(GroupEntity::getCountry)
                .filter(c -> c != null && !c.isBlank())
                .forEach(uniqueCountries::add);

        // Profils indexés par pays
        Map<String, List<ProfileEntity>> profilesByCountry = allProfiles.stream()
                .filter(p -> p.getCountry() != null && !p.getCountry().isBlank())
                .collect(Collectors.groupingBy(p -> p.getCountry().trim()));

        // Entreprises indexées par pays
        Map<String, List<CompanyEntity>> companiesByCountry = allCompanies.stream()
                .filter(c -> c.getCountry() != null && !c.getCountry().isBlank())
                .collect(Collectors.groupingBy(c -> c.getCountry().trim()));

        // Groupes indexés par pays
        Map<String, List<GroupEntity>> groupsByCountry = allGroups.stream()
                .filter(g -> g.getCountry() != null && !g.getCountry().isBlank())
                .collect(Collectors.groupingBy(g -> g.getCountry().trim()));

        List<CountryAdoptionStatsDto> countryStats = new ArrayList<>();

        for (String country : uniqueCountries) {
            List<ProfileEntity> profiles = profilesByCountry.getOrDefault(country, Collections.emptyList());
            List<CompanyEntity> companies = companiesByCountry.getOrDefault(country, Collections.emptyList());
            List<GroupEntity> groups = groupsByCountry.getOrDefault(country, Collections.emptyList());

            long userCount = profiles.size();
            long devCount = profiles.stream()
                    .filter(p -> p.getUser() != null && p.getUser().getRole() == Role.DEVELOPER)
                    .count();
            long recruiterCount = profiles.stream()
                    .filter(p -> p.getUser() != null && p.getUser().getRole() == Role.RECRUITER)
                    .count();
            long verifiedUsersCount = profiles.stream()
                    .filter(p -> Boolean.TRUE.equals(p.getMobileMoneyVerified()))
                    .count();

            long companyCount = companies.size();
            long verifiedCompanyCount = companies.stream()
                    .filter(c -> Boolean.TRUE.equals(c.getVerified()))
                    .count();

            long groupCount = groups.size();

            long projectCount = profiles.stream()
                    .mapToLong(p -> p.getUser() != null ? projectRepository.countByAuthorId(p.getUser().getId()) : 0L)
                    .sum();

            long opportunityCount = allOpportunities.stream()
                    .filter(o -> (o.getLocation() != null && o.getLocation().toLowerCase().contains(country.toLowerCase()))
                            || (o.getCompany() != null && country.equalsIgnoreCase(o.getCompany().getCountry())))
                    .count();

            long trainingCount = allResources.stream()
                    .filter(r -> (r.getCompany() != null && country.equalsIgnoreCase(r.getCompany().getCountry()))
                            || (r.getAuthor() != null && r.getAuthor().getProfile() != null && country.equalsIgnoreCase(r.getAuthor().getProfile().getCountry())))
                    .count();

            double percentage = totalUsers > 0
                    ? Math.round((userCount * 100.0 / totalUsers) * 10.0) / 10.0
                    : 0.0;

            // Score composite de vitalité technologique & économique (max 100)
            double rawScore = (devCount * 2.5)
                    + (companyCount * 5.0)
                    + (opportunityCount * 3.5)
                    + (projectCount * 2.5)
                    + (trainingCount * 2.0)
                    + (groupCount * 3.0)
                    + (verifiedUsersCount * 2.0);

            countryStats.add(CountryAdoptionStatsDto.builder()
                    .country(country)
                    .userCount(userCount)
                    .developerCount(devCount)
                    .recruiterCount(recruiterCount)
                    .verifiedUsersCount(verifiedUsersCount)
                    .companyCount(companyCount)
                    .verifiedCompanyCount(verifiedCompanyCount)
                    .projectCount(projectCount)
                    .opportunityCount(opportunityCount)
                    .groupCount(groupCount)
                    .trainingCount(trainingCount)
                    .adoptionPercentage(percentage)
                    .performanceScore(rawScore)
                    .build());
        }

        // Normalisation du performanceScore sur 0 - 100 par rapport au score maximum
        double maxRawScore = countryStats.stream()
                .mapToDouble(CountryAdoptionStatsDto::getPerformanceScore)
                .max()
                .orElse(1.0);

        for (CountryAdoptionStatsDto cs : countryStats) {
            double normalizedScore = maxRawScore > 0
                    ? Math.round((cs.getPerformanceScore() / maxRawScore * 100.0) * 10.0) / 10.0
                    : 0.0;
            cs.setPerformanceScore(normalizedScore);

            if (normalizedScore >= 75.0) {
                cs.setVitalityLevel("Élite Panafricaine");
            } else if (normalizedScore >= 45.0) {
                cs.setVitalityLevel("Moteur Régional");
            } else if (normalizedScore >= 20.0) {
                cs.setVitalityLevel("En Forte Croissance");
            } else {
                cs.setVitalityLevel("Hub Émergent");
            }
        }

        // Tri par score de performance décroissant puis utilisateurs
        countryStats.sort(Comparator.comparingDouble(CountryAdoptionStatsDto::getPerformanceScore)
                .thenComparingLong(CountryAdoptionStatsDto::getUserCount)
                .reversed());

        for (int i = 0; i < countryStats.size(); i++) {
            countryStats.get(i).setRank(i + 1);
        }

        double avgPerformance = countryStats.isEmpty() ? 0.0 :
                Math.round((countryStats.stream().mapToDouble(CountryAdoptionStatsDto::getPerformanceScore).average().orElse(0.0)) * 10.0) / 10.0;

        PlatformAdoptionSummaryDto summary = PlatformAdoptionSummaryDto.builder()
                .totalContinentalUsers(totalUsers)
                .totalContinentalDevelopers(totalContinentalDevelopers)
                .totalContinentalRecruiters(totalContinentalRecruiters)
                .totalContinentalCompanies(totalCompanies)
                .totalContinentalGroups(totalGroups)
                .totalContinentalTrainings(totalTrainings)
                .totalContinentalOpportunities(totalOpportunities)
                .totalContinentalProjects(totalProjects)
                .totalContinentalVerifiedUsers(totalContinentalVerifiedUsers)
                .activeCountriesCount(countryStats.size())
                .averageContinentalPerformanceScore(avgPerformance)
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

        // Invalidation des caches liés aux utilisateurs et aux analytics admin
        redisCacheService.evictAdminUsersCache();
        redisCacheService.evictNetworkCache();
        evictAdminAnalyticsCaches();

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

        // Purge du cache des projets et analytics
        redisCacheService.evictProjectsCache();
        evictAdminAnalyticsCaches();

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

    @Transactional
    public UserDto createAdminAccount(String superAdminEmail, CreateAdminRequest request) {
        UserEntity actor = userRepository.findByEmail(superAdminEmail)
                .orElseThrow(() -> new IllegalArgumentException("Super Admin non trouvé"));

        if (actor.getRole() != Role.SUPER_ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Seul un Super Administrateur peut créer des comptes administrateurs.");
        }

        if (request.getRole() != Role.ADMIN && request.getRole() != Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Le rôle doit être ADMIN ou SUPER_ADMIN.");
        }

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Un compte avec cet email existe déjà : " + request.getEmail());
        }

        // Génération d'un mot de passe aléatoire fort (ex: Aa3#kL9$mQ2!)
        String tempPassword = generateSecureRandomPassword();

        UserEntity newAdmin = UserEntity.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(tempPassword))
                .role(request.getRole())
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .mustChangePassword(true) // Forcer le changement de mot de passe à la première connexion
                .twoFactorEnabled(false)
                .build();

        UserEntity savedUser = userRepository.save(newAdmin);

        ProfileEntity profile = ProfileEntity.builder()
                .user(savedUser)
                .fullName(request.getFullName().trim())
                .title(request.getTitle() != null && !request.getTitle().isBlank() 
                        ? request.getTitle().trim() 
                        : (request.getRole() == Role.SUPER_ADMIN ? "Super Administrateur AfriDev" : "Administrateur AfriDev"))
                .country(request.getCountry() != null ? request.getCountry() : "Sénégal")
                .city(request.getCity() != null ? request.getCity() : "Dakar")
                .completionScore(100)
                .availability(africa.afridev.model.enums.Availability.FULL_TIME)
                .mobileMoneyVerified(true)
                .build();

        ProfileEntity savedProfile = profileRepository.save(profile);
        savedUser.setProfile(savedProfile);

        // Envoi automatique de l'email officiel avec les identifiants et le mot de passe temporaire
        try {
            emailService.sendAdminWelcomeEmail(
                    savedUser.getEmail(),
                    profile.getFullName(),
                    request.getRole() == Role.SUPER_ADMIN ? "Super Administrateur" : "Administrateur",
                    tempPassword
            );
        } catch (Exception e) {
            log.error("[ADMIN] Erreur lors de l'envoi de l'email de bienvenue admin à {} : {}", savedUser.getEmail(), e.getMessage());
        }

        AuditLogEntity auditLog = AuditLogEntity.builder()
                .user(actor)
                .action("CREATE_ADMIN_ACCOUNT")
                .resource("USER")
                .resourceId(savedUser.getId())
                .metadataJson("{\"created_role\":\"" + request.getRole().name() + "\", \"created_email\":\"" + savedUser.getEmail() + "\"}")
                .build();
        auditLogRepository.save(auditLog);

        redisCacheService.evictAdminUsersCache();
        evictAdminAnalyticsCaches();
        return authService.mapToUserDto(savedUser);
    }

    private String generateSecureRandomPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghijkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "@#$%&*!";
        String all = upper + lower + digits + special;
        java.security.SecureRandom random = new java.security.SecureRandom();

        StringBuilder sb = new StringBuilder(12);
        sb.append(upper.charAt(random.nextInt(upper.length())));
        sb.append(lower.charAt(random.nextInt(lower.length())));
        sb.append(digits.charAt(random.nextInt(digits.length())));
        sb.append(special.charAt(random.nextInt(special.length())));

        for (int i = 4; i < 12; i++) {
            sb.append(all.charAt(random.nextInt(all.length())));
        }

        // Mélanger les caractères
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }

    @Transactional
    public void deleteUserPermanently(String superAdminEmail, String targetUserId) {
        UserEntity actor = userRepository.findByEmail(superAdminEmail)
                .orElseThrow(() -> new IllegalArgumentException("Super Admin non trouvé"));

        if (actor.getRole() != Role.SUPER_ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Seul un Super Administrateur peut supprimer définitivement un compte.");
        }

        if (actor.getId().equals(targetUserId)) {
            throw new IllegalStateException("Vous ne pouvez pas supprimer votre propre compte Super Administrateur.");
        }

        UserEntity targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'id: " + targetUserId));

        String targetEmail = targetUser.getEmail();
        Role targetRole = targetUser.getRole();

        // Trace dans l'audit avant suppression
        AuditLogEntity auditLog = AuditLogEntity.builder()
                .user(actor)
                .action("PERMANENT_USER_DELETION")
                .resource("USER")
                .resourceId(targetUserId)
                .metadataJson("{\"deleted_email\":\"" + targetEmail + "\", \"deleted_role\":\"" + targetRole.name() + "\"}")
                .build();
        auditLogRepository.save(auditLog);

        // Suppression en cascade complète (projets, commentaires, tâches, offres, candidatures, formations, etc.)
        userAccountDeletionService.deleteUserPermanentlyBySuperAdmin(targetUserId);

        redisCacheService.evictAdminUsersCache();
        redisCacheService.evictLeaderboardCache();
        redisCacheService.evictNetworkCache();
        evictAdminAnalyticsCaches();
    }

    private void evictAdminAnalyticsCaches() {
        redisCacheService.evictByPrefix(PLATFORM_STATS_CACHE_KEY);
        redisCacheService.evictByPrefix(ADOPTION_CACHE_KEY);
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
