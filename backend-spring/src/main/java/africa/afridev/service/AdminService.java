package africa.afridev.service;

import africa.afridev.dto.admin.*;
import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.entity.*;
import africa.afridev.model.enums.ReportStatus;
import africa.afridev.model.enums.UserStatus;
import africa.afridev.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ProjectRepository projectRepository;
    private final OpportunityRepository opportunityRepository;
    private final EvaluationRepository evaluationRepository;
    private final AuditLogRepository auditLogRepository;
    private final ReportRepository reportRepository;
    private final AuthService authService;

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

    @Transactional
    public UserDto updateUserStatus(String adminEmail, String userId, UserStatusUpdateRequest request) {
        UserEntity admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalArgumentException("Admin non trouvé."));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'id: " + userId));

        user.setStatus(request.getStatus());
        UserEntity savedUser = userRepository.save(user);

        // Journal de sécurité d'audit
        AuditLogEntity auditLog = AuditLogEntity.builder()
                .user(admin)
                .action("UPDATE_USER_STATUS")
                .resource("USER")
                .resourceId(userId)
                .metadataJson("{\"new_status\":\"" + request.getStatus() + "\", \"reason\":\"" + request.getReason() + "\"}")
                .build();
        auditLogRepository.save(auditLog);

        return authService.mapToUserDto(savedUser);
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
