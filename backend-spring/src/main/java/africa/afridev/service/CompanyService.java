package africa.afridev.service;

import africa.afridev.dto.PagedResult;
import africa.afridev.dto.company.*;
import africa.afridev.model.entity.*;
import africa.afridev.model.enums.*;
import africa.afridev.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final CompanyActivityLogRepository companyActivityLogRepository;
    private final OpportunityRepository opportunityRepository;
    private final ApplicationRepository applicationRepository;
    private final TechEventRepository techEventRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final CompanyXpService companyXpService;
    private final EmailService emailService;

    @Transactional
    public CompanyDto createCompany(UserEntity user, CreateCompanyRequest request) {
        if (user.getRole() != Role.RECRUITER && user.getRole() != Role.ADMIN && user.getRole() != Role.SUPER_ADMIN) {
            throw new IllegalStateException("Seul un utilisateur avec le rôle RECRUTEUR peut créer une entreprise.");
        }

        if (companyRepository.existsByOwnerId(user.getId())) {
            throw new IllegalStateException("Vous possédez déjà une entreprise enregistrée.");
        }

        String slug = generateUniqueSlug(request.getName());

        CompanyEntity company = CompanyEntity.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .country(request.getCountry().trim())
                .city(request.getCity().trim())
                .sector(request.getSector())
                .companySize(request.getCompanySize())
                .websiteUrl(request.getWebsiteUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .twitterUrl(request.getTwitterUrl())
                .logoUrl(request.getLogoUrl())
                .bannerUrl(request.getBannerUrl())
                .owner(user)
                .companyXp(0L)
                .companyLevel(CompanyLevel.STARTUP.getTitle())
                .levelNumber(CompanyLevel.STARTUP.getLevel())
                .badge(CompanyLevel.STARTUP.getBadge())
                .verified(false)
                .status(ContentStatus.PUBLISHED)
                .build();

        CompanyEntity savedCompany = companyRepository.save(company);

        // Enregistrer l'owner comme membre actif de type OWNER
        CompanyMemberEntity ownerMember = CompanyMemberEntity.builder()
                .company(savedCompany)
                .user(user)
                .role(CompanyMemberRole.OWNER)
                .status(CompanyMemberStatus.ACTIVE)
                .jobTitle(user.getProfile() != null ? user.getProfile().getTitle() : "Fondateur")
                .joinedAt(LocalDateTime.now())
                .build();
        companyMemberRepository.save(ownerMember);

        // Journaliser la création
        logActivity(savedCompany, user, CompanyActivityType.COMPANY_CREATED, savedCompany.getId(), "company",
                "Entreprise " + savedCompany.getName() + " créée par " + user.getEmail());

        // Attribuer l'XP de profil complété (+50 XP)
        companyXpService.awardXp(savedCompany, CompanyXpService.XP_PROFILE_COMPLETED,
                CompanyXpSourceType.PROFILE_COMPLETED, savedCompany.getId(), "Création du profil entreprise");

        return mapToDto(savedCompany);
    }

    @Transactional
    public CompanyEntity autoCreateCompanyForRecruiter(UserEntity user, String companyName, String country, String city, String bio, String jobTitle) {
        if (companyRepository.existsByOwnerId(user.getId())) {
            return companyRepository.findByOwnerId(user.getId()).orElse(null);
        }

        String name = (companyName != null && !companyName.trim().isEmpty())
                ? companyName.trim()
                : (user.getProfile() != null && user.getProfile().getFullName() != null
                    ? user.getProfile().getFullName() + " Enterprise"
                    : "Entreprise " + user.getEmail().split("@")[0]);

        String slug = generateUniqueSlug(name);

        CompanyEntity company = CompanyEntity.builder()
                .name(name)
                .slug(slug)
                .description(bio)
                .country(country != null ? country.trim() : "Afrique")
                .city(city != null ? city.trim() : "Principal")
                .owner(user)
                .companyXp(0L)
                .companyLevel(CompanyLevel.STARTUP.getTitle())
                .levelNumber(CompanyLevel.STARTUP.getLevel())
                .badge(CompanyLevel.STARTUP.getBadge())
                .verified(false)
                .status(ContentStatus.PUBLISHED)
                .build();

        CompanyEntity savedCompany = companyRepository.save(company);

        CompanyMemberEntity ownerMember = CompanyMemberEntity.builder()
                .company(savedCompany)
                .user(user)
                .role(CompanyMemberRole.OWNER)
                .status(CompanyMemberStatus.ACTIVE)
                .jobTitle(jobTitle != null ? jobTitle : "Recruteur Principal")
                .joinedAt(LocalDateTime.now())
                .build();
        companyMemberRepository.save(ownerMember);

        logActivity(savedCompany, user, CompanyActivityType.COMPANY_CREATED, savedCompany.getId(), "company",
                "Entreprise créée automatiquement à l'inscription pour " + user.getEmail());

        companyXpService.awardXp(savedCompany, CompanyXpService.XP_PROFILE_COMPLETED,
                CompanyXpSourceType.PROFILE_COMPLETED, savedCompany.getId(), "Création du profil entreprise");

        return savedCompany;
    }

    @Transactional(readOnly = true)
    public CompanyDto getCompanyBySlug(String slug) {
        CompanyEntity company = companyRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable avec le slug : " + slug));
        return mapToDto(company);
    }

    @Transactional(readOnly = true)
    public CompanyDto getCompanyById(String id) {
        CompanyEntity company = companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable avec l'identifiant : " + id));
        return mapToDto(company);
    }

    @Transactional(readOnly = true)
    public CompanyDto getMyCompany(UserEntity user) {
        // 1. Chercher comme propriétaire
        Optional<CompanyEntity> ownedCompany = companyRepository.findByOwnerId(user.getId());
        if (ownedCompany.isPresent()) {
            return mapToDto(ownedCompany.get());
        }

        // 2. Sinon chercher comme membre actif
        Optional<CompanyMemberEntity> membership = companyMemberRepository.findFirstByUserIdAndStatusOrderByCreatedAtAsc(
                user.getId(), CompanyMemberStatus.ACTIVE);
        if (membership.isPresent()) {
            return mapToDto(membership.get().getCompany());
        }

        throw new IllegalArgumentException("Aucune entreprise associée à votre compte.");
    }

    @Transactional
    public CompanyDto updateCompany(String companyId, UserEntity user, UpdateCompanyRequest request) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable : " + companyId));

        validateMemberAccess(company, user);

        if (request.getName() != null && !request.getName().trim().isEmpty() && !request.getName().equalsIgnoreCase(company.getName())) {
            company.setName(request.getName().trim());
        }
        if (request.getDescription() != null) company.setDescription(request.getDescription().trim());
        if (request.getWebsiteUrl() != null) company.setWebsiteUrl(request.getWebsiteUrl().trim());
        if (request.getLinkedinUrl() != null) company.setLinkedinUrl(request.getLinkedinUrl().trim());
        if (request.getTwitterUrl() != null) company.setTwitterUrl(request.getTwitterUrl().trim());
        if (request.getLogoUrl() != null) company.setLogoUrl(request.getLogoUrl().trim());
        if (request.getBannerUrl() != null) company.setBannerUrl(request.getBannerUrl().trim());
        if (request.getCountry() != null) company.setCountry(request.getCountry().trim());
        if (request.getCity() != null) company.setCity(request.getCity().trim());
        if (request.getSector() != null) company.setSector(request.getSector().trim());
        if (request.getCompanySize() != null) company.setCompanySize(request.getCompanySize().trim());

        CompanyEntity updated = companyRepository.save(company);

        logActivity(company, user, CompanyActivityType.COMPANY_UPDATED, company.getId(), "company",
                "Mise à jour des informations de l'entreprise par " + user.getEmail());

        return mapToDto(updated);
    }

    @Transactional
    public CompanyMemberDto inviteMember(String companyId, UserEntity requester, InviteMemberRequest request) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable : " + companyId));

        validateOwnerAccess(company, requester);

        // Rate limiting : max 10 invitations par jour par entreprise
        LocalDateTime startOfDay = LocalDateTime.now().minusHours(24);
        long recentInvites = companyActivityLogRepository.countByCompanyIdAndActivityTypeAndCreatedAtAfter(
                companyId, CompanyActivityType.MEMBER_INVITED, startOfDay);
        if (recentInvites >= 10) {
            throw new IllegalStateException("Limite quotidienne atteinte : vous ne pouvez pas envoyer plus de 10 invitations par période de 24 heures.");
        }

        String targetEmail = request.getEmail().trim().toLowerCase();
        UserEntity targetUser = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new IllegalArgumentException("Aucun utilisateur trouvé avec l'email : " + targetEmail + ". Le membre doit d'abord créer un compte sur la plateforme."));

        if (companyMemberRepository.existsByCompanyIdAndUserIdAndStatus(companyId, targetUser.getId(), CompanyMemberStatus.ACTIVE)) {
            throw new IllegalStateException("Cet utilisateur est déjà membre actif de votre entreprise.");
        }

        CompanyMemberEntity member = companyMemberRepository.findByCompanyIdAndUserId(companyId, targetUser.getId())
                .orElse(CompanyMemberEntity.builder()
                        .company(company)
                        .user(targetUser)
                        .role(CompanyMemberRole.RECRUITER)
                        .status(CompanyMemberStatus.ACTIVE)
                        .build());

        String jobTitle = request.getJobTitle() != null ? request.getJobTitle().trim() : "Recruteur";
        member.setStatus(CompanyMemberStatus.ACTIVE);
        member.setJobTitle(jobTitle);
        member.setInvitedByUserId(requester.getId());
        member.setJoinedAt(LocalDateTime.now());

        CompanyMemberEntity saved = companyMemberRepository.save(member);

        logActivity(company, requester, CompanyActivityType.MEMBER_INVITED, targetUser.getId(), "member",
                requester.getEmail() + " a ajouté " + targetEmail + " à l'équipe recrutement");

        // Envoi de l'email de notification d'invitation équipe
        try {
            String recipientName = targetUser.getProfile() != null && targetUser.getProfile().getFullName() != null
                    ? targetUser.getProfile().getFullName() : targetUser.getEmail();
            String inviterName = requester.getProfile() != null && requester.getProfile().getFullName() != null
                    ? requester.getProfile().getFullName() : requester.getEmail();
            emailService.sendTeamInvitationEmail(targetEmail, recipientName, company.getName(), inviterName, jobTitle);
        } catch (Exception e) {
            log.warn("[COMPANY] Erreur lors de l'envoi de l'email d'invitation : {}", e.getMessage());
        }

        return mapMemberToDto(saved);
    }

    @Transactional
    public void removeMember(String companyId, String targetUserId, UserEntity requester) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable : " + companyId));

        validateOwnerAccess(company, requester);

        if (company.getOwner().getId().equals(targetUserId)) {
            throw new IllegalStateException("Impossible de retirer le propriétaire fondateur de l'entreprise.");
        }

        CompanyMemberEntity member = companyMemberRepository.findByCompanyIdAndUserId(companyId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Membre introuvable dans cette entreprise."));

        member.setStatus(CompanyMemberStatus.REMOVED);
        companyMemberRepository.save(member);

        logActivity(company, requester, CompanyActivityType.MEMBER_REMOVED, targetUserId, "member",
                requester.getEmail() + " a retiré un membre de l'équipe");
    }

    @Transactional(readOnly = true)
    public PagedResult<CompanyMemberDto> listMembers(String companyId, UserEntity requester, Pageable pageable) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable : " + companyId));

        validateMemberAccess(company, requester);

        Page<CompanyMemberEntity> page = companyMemberRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(
                companyId, CompanyMemberStatus.ACTIVE, pageable);

        List<CompanyMemberDto> dtos = page.getContent().stream().map(this::mapMemberToDto).toList();
        return PagedResult.of(page, dtos);
    }

    @Transactional(readOnly = true)
    public PagedResult<CompanyActivityLogDto> getActivityLogs(String companyId, UserEntity requester, Pageable pageable) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable : " + companyId));

        // Seul le propriétaire peut voir tout l'historique de l'équipe
        boolean isOwner = company.getOwner() != null && company.getOwner().getId().equals(requester.getId());

        Page<CompanyActivityLogEntity> page;
        if (isOwner || requester.getRole() == Role.ADMIN || requester.getRole() == Role.SUPER_ADMIN) {
            page = companyActivityLogRepository.findByCompanyIdOrderByCreatedAtDesc(companyId, pageable);
        } else {
            // Un membre simple ne voit que ses propres actions
            page = companyActivityLogRepository.findByCompanyIdAndActorIdOrderByCreatedAtDesc(
                    companyId, requester.getId(), pageable);
        }

        List<CompanyActivityLogDto> dtos = page.getContent().stream().map(this::mapActivityLogToDto).toList();
        return PagedResult.of(page, dtos);
    }

    @Transactional(readOnly = true)
    public CompanyStatsDto getCompanyStats(String companyId, UserEntity requester) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable : " + companyId));

        validateMemberAccess(company, requester);

        long totalOps = opportunityRepository.countByCompanyId(companyId);
        long activeOps = opportunityRepository.countByCompanyIdAndStatus(companyId, ContentStatus.PUBLISHED);
        long totalApplicants = applicationRepository.countByOpportunityCompanyId(companyId);
        long totalHired = applicationRepository.countByOpportunityCompanyIdAndStatus(companyId, ApplicationStatus.ACCEPTED);
        long totalEvents = techEventRepository.countByCompanyId(companyId);
        long totalResources = resourceRepository.countByCompanyId(companyId);
        long totalMembers = companyMemberRepository.countByCompanyIdAndStatus(companyId, CompanyMemberStatus.ACTIVE);

        return CompanyStatsDto.builder()
                .totalOpportunities(totalOps)
                .activeOpportunities(activeOps)
                .totalApplicants(totalApplicants)
                .totalHired(totalHired)
                .totalEvents(totalEvents)
                .totalResources(totalResources)
                .totalTeamMembers(totalMembers)
                .companyXp(company.getCompanyXp())
                .companyLevel(company.getCompanyLevel())
                .badge(company.getBadge())
                .leaderboardRank(1)
                .build();
    }

    @Transactional
    public CompanyDto updateCompanyStatus(String companyId, UserEntity admin, ContentStatus status, Boolean verified) {
        if (admin.getRole() != Role.ADMIN && admin.getRole() != Role.SUPER_ADMIN) {
            throw new SecurityException("Seul un administrateur peut modifier le statut d'une entreprise.");
        }

        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable : " + companyId));

        if (status != null) {
            company.setStatus(status);
        }
        if (verified != null) {
            company.setVerified(verified);
        }

        CompanyEntity saved = companyRepository.save(company);

        logActivity(company, admin, CompanyActivityType.COMPANY_UPDATED, company.getId(), "company",
                "Statut modifié par l'administrateur " + admin.getEmail() + " : " + (status != null ? status : "") + " (vérifié=" + verified + ")");

        return mapToDto(saved);
    }

    public void logActivity(CompanyEntity company, UserEntity actor, CompanyActivityType type, String targetId, String targetType, String description) {
        if (company == null || actor == null) return;
        CompanyActivityLogEntity logEntry = CompanyActivityLogEntity.builder()
                .company(company)
                .actor(actor)
                .activityType(type)
                .targetId(targetId)
                .targetType(targetType)
                .description(description)
                .build();
        companyActivityLogRepository.save(logEntry);
    }

    private void validateOwnerAccess(CompanyEntity company, UserEntity requester) {
        boolean isOwner = company.getOwner() != null && company.getOwner().getId().equals(requester.getId());
        if (!isOwner && requester.getRole() != Role.ADMIN && requester.getRole() != Role.SUPER_ADMIN) {
            throw new SecurityException("Seul le propriétaire de l'entreprise est autorisé à effectuer cette action.");
        }
    }

    private void validateMemberAccess(CompanyEntity company, UserEntity requester) {
        boolean isOwner = company.getOwner() != null && company.getOwner().getId().equals(requester.getId());
        if (isOwner || requester.getRole() == Role.ADMIN || requester.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        boolean isMember = companyMemberRepository.existsByCompanyIdAndUserIdAndStatus(
                company.getId(), requester.getId(), CompanyMemberStatus.ACTIVE);
        if (!isMember) {
            throw new SecurityException("Vous devez être membre de cette entreprise pour accéder à ses données.");
        }
    }

    public CompanyDto mapToDto(CompanyEntity company) {
        long activeOps = opportunityRepository.countByCompanyIdAndStatus(company.getId(), ContentStatus.PUBLISHED);
        long members = companyMemberRepository.countByCompanyIdAndStatus(company.getId(), CompanyMemberStatus.ACTIVE);

        return CompanyDto.builder()
                .id(company.getId())
                .name(company.getName())
                .slug(company.getSlug())
                .description(company.getDescription())
                .logoUrl(company.getLogoUrl())
                .bannerUrl(company.getBannerUrl())
                .websiteUrl(company.getWebsiteUrl())
                .linkedinUrl(company.getLinkedinUrl())
                .twitterUrl(company.getTwitterUrl())
                .country(company.getCountry())
                .city(company.getCity())
                .sector(company.getSector())
                .companySize(company.getCompanySize())
                .ownerId(company.getOwner() != null ? company.getOwner().getId() : null)
                .ownerName(company.getOwner() != null && company.getOwner().getProfile() != null ? company.getOwner().getProfile().getFullName() : null)
                .ownerEmail(company.getOwner() != null ? company.getOwner().getEmail() : null)
                .companyXp(company.getCompanyXp() != null ? company.getCompanyXp() : 0L)
                .companyLevel(company.getCompanyLevel())
                .levelNumber(company.getLevelNumber())
                .badge(company.getBadge())
                .verified(company.getVerified())
                .status(company.getStatus())
                .activeOpportunitiesCount(activeOps)
                .totalMembersCount(members)
                .createdAt(company.getCreatedAt())
                .build();
    }

    public CompanyMemberDto mapMemberToDto(CompanyMemberEntity member) {
        UserEntity u = member.getUser();
        ProfileEntity p = u != null ? u.getProfile() : null;

        return CompanyMemberDto.builder()
                .id(member.getId())
                .userId(u != null ? u.getId() : null)
                .fullName(p != null ? p.getFullName() : (u != null ? u.getEmail() : "Membre"))
                .email(u != null ? u.getEmail() : null)
                .avatarUrl(p != null ? p.getAvatarUrl() : null)
                .jobTitle(member.getJobTitle())
                .role(member.getRole())
                .status(member.getStatus())
                .invitedByUserId(member.getInvitedByUserId())
                .joinedAt(member.getJoinedAt())
                .createdAt(member.getCreatedAt())
                .build();
    }

    public CompanyActivityLogDto mapActivityLogToDto(CompanyActivityLogEntity log) {
        UserEntity a = log.getActor();
        ProfileEntity p = a != null ? a.getProfile() : null;

        return CompanyActivityLogDto.builder()
                .id(log.getId())
                .companyId(log.getCompany() != null ? log.getCompany().getId() : null)
                .actorId(a != null ? a.getId() : null)
                .actorName(p != null ? p.getFullName() : (a != null ? a.getEmail() : "Inconnu"))
                .actorEmail(a != null ? a.getEmail() : null)
                .actorAvatarUrl(p != null ? p.getAvatarUrl() : null)
                .activityType(log.getActivityType())
                .targetId(log.getTargetId())
                .targetType(log.getTargetType())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private String generateUniqueSlug(String name) {
        String base = Normalizer.normalize(name != null ? name : "company", Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        if (base.isEmpty()) base = "company";

        String candidate = base;
        int counter = 1;
        while (companyRepository.existsBySlug(candidate)) {
            candidate = base + "-" + counter;
            counter++;
            if (counter > 20) {
                candidate = base + "-" + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }
        return candidate;
    }
}

