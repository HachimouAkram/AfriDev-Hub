package africa.afridev.service;

import africa.afridev.dto.opportunity.ApplicationCreateRequest;
import africa.afridev.dto.opportunity.ApplicationDto;
import africa.afridev.dto.opportunity.OpportunityCreateRequest;
import africa.afridev.dto.opportunity.OpportunityDto;
import africa.afridev.model.entity.ApplicationEntity;
import africa.afridev.model.entity.OpportunityEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.ApplicationStatus;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.OpportunityType;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.repository.ApplicationRepository;
import africa.afridev.repository.FollowRepository;
import africa.afridev.repository.OpportunityRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import africa.afridev.dto.PagedResult;
import com.fasterxml.jackson.databind.JavaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final AuthService authService;
    private final EmailService emailService;
    private final RedisCacheService redisCacheService;

    @Transactional
    public OpportunityDto createOpportunity(String userEmail, OpportunityCreateRequest request) {
        UserEntity publisher = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        OpportunityEntity opportunity = OpportunityEntity.builder()
                .publisher(publisher)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .location(request.getLocation())
                .isRemote(request.getIsRemote() != null ? request.getIsRemote() : false)
                .stack(request.getStack() != null ? request.getStack() : new ArrayList<>())
                .budget(request.getBudget())
                .deadline(request.getDeadline())
                .maxApplicants(request.getMaxApplicants() != null && request.getMaxApplicants() > 0 ? request.getMaxApplicants() : 1)
                .acceptedCount(0)
                .isPaid(request.getIsPaid() != null ? request.getIsPaid() : true)
                .status(ContentStatus.PUBLISHED)
                .build();

        OpportunityEntity saved = opportunityRepository.save(opportunity);
        redisCacheService.evictOpportunitiesCache();
        return mapToOpportunityDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<OpportunityDto> getAllOpportunities(OpportunityType type, Pageable pageable) {
        return getAllOpportunities(null, type, "SUGGESTED", pageable);
    }

    @Transactional(readOnly = true)
    public Page<OpportunityDto> getAllOpportunities(String currentUserEmail, OpportunityType type, String sort, Pageable pageable) {
        String sortParam = (sort != null && !sort.isBlank()) ? sort.toUpperCase().trim() : "SUGGESTED";
        String cacheKey = "cache:opportunities:t:" + (type != null ? type.name() : "ALL")
                + ":sort:" + sortParam
                + ":u:" + (currentUserEmail != null ? currentUserEmail : "anon")
                + ":p:" + pageable.getPageNumber()
                + ":s:" + pageable.getPageSize();

        try {
            JavaType javaType = redisCacheService.getObjectMapper().getTypeFactory()
                    .constructParametricType(PagedResult.class, OpportunityDto.class);
            PagedResult<OpportunityDto> cached = redisCacheService.get(cacheKey, javaType);
            if (cached != null) {
                return cached.toPage();
            }
        } catch (Exception ignored) {}

        UserEntity currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        ProfileEntity currentProfile = currentUser != null ? currentUser.getProfile() : null;

        Set<String> followedPublisherIds = Collections.emptySet();
        Set<String> appliedOppIds = Collections.emptySet();
        if (currentUser != null) {
            followedPublisherIds = followRepository.findByFollowerId(currentUser.getId())
                    .stream()
                    .map(f -> f.getFollowing().getId())
                    .collect(Collectors.toSet());
            appliedOppIds = applicationRepository.findAppliedOpportunityIdsByApplicantId(currentUser.getId());
        }

        List<OpportunityEntity> allOpportunities = (type != null)
                ? opportunityRepository.findByTypeAndStatus(type, ContentStatus.PUBLISHED)
                : opportunityRepository.findByStatus(ContentStatus.PUBLISHED);

        final Set<String> finalFollowedIds = followedPublisherIds;
        final Set<String> finalAppliedIds = appliedOppIds;

        List<OpportunityDto> dtoList = allOpportunities.stream()
                .map(o -> mapToScoredOpportunityDto(o, currentUser, currentProfile, finalFollowedIds, finalAppliedIds))
                .collect(Collectors.toList());

        String myCountry = (currentProfile != null && currentProfile.getCountry() != null) ? currentProfile.getCountry().trim().toLowerCase() : "";

        switch (sortParam) {
            case "MATCHING_SKILLS" -> dtoList.sort((a, b) -> {
                int aCount = a.getMatchedStack() != null ? a.getMatchedStack().size() : 0;
                int bCount = b.getMatchedStack() != null ? b.getMatchedStack().size() : 0;
                if (aCount != bCount) return Integer.compare(bCount, aCount);
                return Double.compare(
                        b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                        a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                );
            });
            case "FOLLOWING" -> {
                if (currentUser != null) {
                    dtoList.sort((a, b) -> {
                        boolean aFollowed = Boolean.TRUE.equals(a.getIsPublisherFollowed());
                        boolean bFollowed = Boolean.TRUE.equals(b.getIsPublisherFollowed());
                        if (aFollowed != bFollowed) return aFollowed ? -1 : 1;
                        return Double.compare(
                                b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                                a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                        );
                    });
                } else {
                    dtoList.sort(Comparator.comparing(OpportunityDto::getMatchPercentage, Comparator.nullsLast(Comparator.reverseOrder())));
                }
            }
            case "REMOTE" -> dtoList.sort((a, b) -> {
                boolean aRemote = Boolean.TRUE.equals(a.getIsRemote());
                boolean bRemote = Boolean.TRUE.equals(b.getIsRemote());
                if (aRemote != bRemote) return aRemote ? -1 : 1;
                return Double.compare(
                        b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                        a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                );
            });
            case "SAME_COUNTRY" -> dtoList.sort((a, b) -> {
                String locA = a.getLocation() != null ? a.getLocation().trim().toLowerCase() : "";
                String locB = b.getLocation() != null ? b.getLocation().trim().toLowerCase() : "";
                boolean aSame = !myCountry.isEmpty() && locA.contains(myCountry);
                boolean bSame = !myCountry.isEmpty() && locB.contains(myCountry);
                if (aSame != bSame) return aSame ? -1 : 1;
                return Double.compare(
                        b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                        a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                );
            });
            case "RECENT" -> dtoList.sort(Comparator.comparing(OpportunityDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
            case "SUGGESTED" -> {
                // SUGGESTED : Placer les opportunités ouvertes en premier, puis tri par matchPercentage décroissant
                dtoList.sort((a, b) -> {
                    boolean aClosed = (a.getAcceptedCount() != null ? a.getAcceptedCount() : 0) >= (a.getMaxApplicants() != null ? a.getMaxApplicants() : 1);
                    boolean bClosed = (b.getAcceptedCount() != null ? b.getAcceptedCount() : 0) >= (b.getMaxApplicants() != null ? b.getMaxApplicants() : 1);
                    if (aClosed != bClosed) return aClosed ? 1 : -1;
                    int cmp = Double.compare(
                            b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                            a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                    );
                    if (cmp != 0) return cmp;
                    return b.getCreatedAt() != null && a.getCreatedAt() != null ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0;
                });
            }
            default -> dtoList.sort((a, b) -> Double.compare(
                    b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                    a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
            ));
        }

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtoList.size());
        List<OpportunityDto> pagedContent = (start <= end && start < dtoList.size())
                ? dtoList.subList(start, end)
                : Collections.emptyList();

        Page<OpportunityDto> resultPage = new PageImpl<>(pagedContent, pageable, dtoList.size());
        redisCacheService.set(cacheKey, PagedResult.from(resultPage), Duration.ofMinutes(10));
        return resultPage;
    }

    @Transactional(readOnly = true)
    public OpportunityDto getOpportunityById(String id) {
        OpportunityEntity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Opportunité introuvable: " + id));
        return mapToOpportunityDto(opportunity);
    }

    @Transactional
    public ApplicationDto applyToOpportunity(String userEmail, String opportunityId, ApplicationCreateRequest request) {
        UserEntity applicant = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        OpportunityEntity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new IllegalArgumentException("Opportunité introuvable."));

        if (opportunity.getPublisher().getId().equals(applicant.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas candidater à votre propre offre.");
        }

        // Vérifier si l'offre a déjà atteint le nombre de personnes cherchées
        int max = opportunity.getMaxApplicants() != null ? opportunity.getMaxApplicants() : 1;
        int accepted = opportunity.getAcceptedCount() != null ? opportunity.getAcceptedCount() : 0;
        if (accepted >= max) {
            throw new IllegalStateException("Cette offre a atteint sa limite de recrutement (" + accepted + "/" + max + "). Les candidatures sont fermées.");
        }

        if (applicationRepository.existsByOpportunityIdAndApplicantId(opportunityId, applicant.getId())) {
            throw new IllegalStateException("Vous avez déjà candidaté à cette opportunité.");
        }

        boolean hasText = request.getMessage() != null && !request.getMessage().isBlank();
        boolean hasPdf = request.getCoverLetterUrl() != null && !request.getCoverLetterUrl().isBlank();
        if (!hasText && !hasPdf) {
            throw new IllegalArgumentException("Veuillez écrire ou téléverser (PDF) une lettre de motivation.");
        }

        String effectiveCv = request.getCvUrl();
        if ((effectiveCv == null || effectiveCv.isBlank()) && applicant.getProfile() != null) {
            effectiveCv = applicant.getProfile().getCvUrl();
        }

        ApplicationEntity application = ApplicationEntity.builder()
                .opportunity(opportunity)
                .applicant(applicant)
                .message(hasText ? request.getMessage() : "Lettre de motivation jointe en PDF.")
                .cvUrl(effectiveCv)
                .coverLetterUrl(hasPdf ? request.getCoverLetterUrl() : null)
                .status(ApplicationStatus.PENDING)
                .build();

        ApplicationEntity saved = applicationRepository.save(application);
        redisCacheService.evictOpportunitiesCache();
        return mapToApplicationDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getApplicationsForOpportunity(String userEmail, String opportunityId) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        OpportunityEntity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new IllegalArgumentException("Opportunité introuvable."));

        if (!opportunity.getPublisher().getId().equals(user.getId())) {
            throw new IllegalStateException("Seul l'émetteur de l'offre peut consulter la liste des candidatures.");
        }

        return applicationRepository.findByOpportunityId(opportunityId)
                .stream()
                .map(this::mapToApplicationDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getMyApplications(String userEmail) {
        UserEntity applicant = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        return applicationRepository.findByApplicantIdOrderByCreatedAtDesc(applicant.getId())
                .stream()
                .map(this::mapToApplicationDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OpportunityDto> getMyPostedOpportunities(String userEmail) {
        UserEntity publisher = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        return opportunityRepository.findByPublisherIdOrderByCreatedAtDesc(publisher.getId())
                .stream()
                .map(this::mapToOpportunityDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getApplicationsReceivedForMyOpportunities(String userEmail) {
        UserEntity publisher = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        return applicationRepository.findByOpportunityPublisherIdOrderByCreatedAtDesc(publisher.getId())
                .stream()
                .map(this::mapToApplicationDto)
                .toList();
    }

    @Transactional
    public ApplicationDto updateApplicationStatus(String userEmail, String applicationId,
                                                   ApplicationStatus newStatus, String reason) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ApplicationEntity application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Candidature introuvable avec l'id: " + applicationId));

        OpportunityEntity opportunity = application.getOpportunity();
        if (!opportunity.getPublisher().getId().equals(user.getId())) {
            throw new IllegalStateException("Seul l'émetteur de cette opportunité peut changer le statut des candidatures.");
        }

        application.setStatus(newStatus);

        // Save rejection reason if provided
        if (newStatus == ApplicationStatus.REJECTED && reason != null && !reason.isBlank()) {
            application.setRejectionReason(reason);
        } else if (newStatus != ApplicationStatus.REJECTED) {
            application.setRejectionReason(null);
        }

        ApplicationEntity saved = applicationRepository.save(application);

        // Recalculate accepted count
        long countAccepted = applicationRepository.findByOpportunityId(opportunity.getId())
                .stream()
                .filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED)
                .count();
        opportunity.setAcceptedCount((int) countAccepted);
        opportunityRepository.save(opportunity);
        redisCacheService.evictOpportunitiesCache();

        // Send email notification to applicant
        UserEntity applicant = application.getApplicant();
        String applicantEmail = applicant.getEmail();
        String applicantName = applicant.getProfile() != null && applicant.getProfile().getFullName() != null
                ? applicant.getProfile().getFullName() : applicant.getEmail();
        String oppTitle = opportunity.getTitle();
        String pubName = opportunity.getPublisher().getProfile() != null
                ? opportunity.getPublisher().getProfile().getFullName() : opportunity.getPublisher().getEmail();

        if (newStatus == ApplicationStatus.REJECTED) {
            String motif = (reason != null && !reason.isBlank()) ? reason : "Critères de sélection non satisfaits.";
            emailService.sendApplicationRejectionEmail(applicantEmail, applicantName, oppTitle, motif);
        } else if (newStatus == ApplicationStatus.ACCEPTED) {
            emailService.sendApplicationAcceptanceEmail(applicantEmail, applicantName, oppTitle, pubName);
        }

        return mapToApplicationDto(saved);
    }

    @Transactional
    public OpportunityDto updateOpportunity(String userEmail, String id, OpportunityCreateRequest request) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        OpportunityEntity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Opportunité introuvable."));

        if (!opportunity.getPublisher().getId().equals(user.getId())) {
            throw new IllegalStateException("Vous n'êtes pas le propriétaire de cette opportunité.");
        }

        opportunity.setTitle(request.getTitle());
        opportunity.setDescription(request.getDescription());
        if (request.getType() != null) opportunity.setType(request.getType());
        opportunity.setLocation(request.getLocation());
        if (request.getIsRemote() != null) opportunity.setIsRemote(request.getIsRemote());
        if (request.getStack() != null) opportunity.setStack(request.getStack());
        opportunity.setBudget(request.getBudget());
        opportunity.setDeadline(request.getDeadline());
        if (request.getMaxApplicants() != null && request.getMaxApplicants() > 0) {
            opportunity.setMaxApplicants(request.getMaxApplicants());
        }
        if (request.getIsPaid() != null) {
            opportunity.setIsPaid(request.getIsPaid());
        }

        OpportunityEntity saved = opportunityRepository.save(opportunity);
        redisCacheService.evictOpportunitiesCache();
        return mapToOpportunityDto(saved);
    }

    @Transactional
    public OpportunityDto toggleOpportunityStatus(String userEmail, String id) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        OpportunityEntity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Opportunité introuvable."));

        if (!opportunity.getPublisher().getId().equals(user.getId())) {
            throw new IllegalStateException("Vous n'êtes pas le propriétaire de cette opportunité.");
        }

        if (opportunity.getStatus() == ContentStatus.PUBLISHED) {
            opportunity.setStatus(ContentStatus.HIDDEN);
        } else {
            opportunity.setStatus(ContentStatus.PUBLISHED);
        }

        OpportunityEntity saved = opportunityRepository.save(opportunity);
        redisCacheService.evictOpportunitiesCache();
        return mapToOpportunityDto(saved);
    }

    @Transactional
    public void deleteOpportunity(String userEmail, String id) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        OpportunityEntity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Opportunité introuvable."));

        if (!opportunity.getPublisher().getId().equals(user.getId())) {
            throw new IllegalStateException("Vous n'êtes pas le propriétaire de cette opportunité.");
        }

        opportunityRepository.delete(opportunity);
        redisCacheService.evictOpportunitiesCache();
    }

    private OpportunityDto mapToOpportunityDto(OpportunityEntity opportunity) {
        OpportunityDto dto = OpportunityDto.builder()
                .id(opportunity.getId())
                .publisher(authService.mapToUserDto(opportunity.getPublisher()))
                .title(opportunity.getTitle())
                .description(opportunity.getDescription())
                .type(opportunity.getType())
                .location(opportunity.getLocation())
                .isRemote(opportunity.getIsRemote())
                .stack(opportunity.getStack())
                .budget(opportunity.getBudget())
                .deadline(opportunity.getDeadline())
                .maxApplicants(opportunity.getMaxApplicants() != null ? opportunity.getMaxApplicants() : 1)
                .acceptedCount(opportunity.getAcceptedCount() != null ? opportunity.getAcceptedCount() : 0)
                .isPaid(opportunity.getIsPaid() != null ? opportunity.getIsPaid() : true)
                .status(opportunity.getStatus())
                .createdAt(opportunity.getCreatedAt())
                .build();
        return dto;
    }

    private OpportunityDto mapToScoredOpportunityDto(
            OpportunityEntity opportunity,
            UserEntity currentUser,
            ProfileEntity currentProfile,
            Set<String> followedPublisherIds,
            Set<String> appliedOppIds
    ) {
        boolean isFollowed = false;
        if (opportunity.getPublisher() != null && followedPublisherIds != null) {
            isFollowed = followedPublisherIds.contains(opportunity.getPublisher().getId());
        } else if (currentUser != null && opportunity.getPublisher() != null) {
            isFollowed = redisCacheService.isFollowing(currentUser.getId(), opportunity.getPublisher().getId());
        }

        boolean hasApplied = appliedOppIds != null && appliedOppIds.contains(opportunity.getId());

        double score = 0.0;
        List<String> matchedStack = new ArrayList<>();
        List<String> reasons = new ArrayList<>();

        // 1. Stack match (max 35 pts)
        List<String> oppStack = opportunity.getStack() != null ? opportunity.getStack() : Collections.emptyList();
        List<String> mySkills = (currentProfile != null && currentProfile.getSkills() != null)
                ? currentProfile.getSkills() : Collections.emptyList();

        if (!oppStack.isEmpty() && !mySkills.isEmpty()) {
            Set<String> mySkillsNorm = mySkills.stream()
                    .filter(Objects::nonNull)
                    .map(s -> s.trim().toLowerCase())
                    .collect(Collectors.toSet());

            for (String tech : oppStack) {
                if (tech != null && mySkillsNorm.contains(tech.trim().toLowerCase())) {
                    matchedStack.add(tech);
                }
            }

            if (!matchedStack.isEmpty()) {
                double ratio = (double) matchedStack.size() / (double) oppStack.size();
                score += Math.min(30.0, ratio * 30.0) + 5.0; // max 35 pts
                if (matchedStack.size() == oppStack.size()) {
                    reasons.add("💻 100% Match Stack (" + String.join(", ", matchedStack) + ")");
                } else {
                    reasons.add("💻 Match " + matchedStack.size() + "/" + oppStack.size() + " tech (" + String.join(", ", matchedStack) + ")");
                }
            }
        }

        // 2. Publisher followed (+25 pts)
        if (isFollowed) {
            score += 25.0;
            reasons.add("👤 Recruteur suivi");
        }

        // 3. Location & Remote (max 20 pts)
        boolean isRemote = Boolean.TRUE.equals(opportunity.getIsRemote());
        String oppLoc = opportunity.getLocation() != null ? opportunity.getLocation().toLowerCase() : "";
        String myCountry = (currentProfile != null && currentProfile.getCountry() != null) ? currentProfile.getCountry().toLowerCase().trim() : "";
        String myCity = (currentProfile != null && currentProfile.getCity() != null) ? currentProfile.getCity().toLowerCase().trim() : "";

        boolean sameCountry = !myCountry.isEmpty() && oppLoc.contains(myCountry);
        boolean sameCity = !myCity.isEmpty() && oppLoc.contains(myCity);

        if (sameCountry) {
            score += sameCity ? 20.0 : 18.0;
            reasons.add("📍 " + (sameCity ? currentProfile.getCity() + ", " : "") + currentProfile.getCountry());
        } else if (isRemote) {
            score += 15.0;
            reasons.add("🌍 Remote");
        }

        // 4. Open status & Availability (+10 pts)
        int max = opportunity.getMaxApplicants() != null ? opportunity.getMaxApplicants() : 1;
        int accepted = opportunity.getAcceptedCount() != null ? opportunity.getAcceptedCount() : 0;
        boolean isOpen = accepted < max;
        if (isOpen) {
            score += 10.0;
        } else {
            score -= 20.0; // Malus si clôturée
        }

        // 5. Type vs Seniority / Experience (+10 pts)
        int yearsExp = (currentProfile != null && currentProfile.getYearsExperience() != null) ? currentProfile.getYearsExperience() : 0;
        if (opportunity.getType() == OpportunityType.INTERNSHIP) {
            if (yearsExp <= 2) {
                score += 10.0;
                reasons.add("🎓 Stage adapté aux profils juniors");
            }
        } else if (opportunity.getType() == OpportunityType.JOB || opportunity.getType() == OpportunityType.FREELANCE) {
            if (yearsExp >= 2) {
                score += 10.0;
            } else {
                score += 5.0;
            }
        } else if (opportunity.getType() == OpportunityType.COLLABORATION) {
            score += 8.0;
            reasons.add("🤝 Collaboration ouverte");
        }

        // If visitor / non-connected: baseline score
        if (currentUser == null) {
            score = 50.0;
            if (isRemote) score += 20.0;
            if (isOpen) score += 20.0;
            if (!oppStack.isEmpty()) score += 10.0;
            reasons.add("⚡ Opportunité active de la communauté");
        }

        double finalPercentage = Math.min(100.0, Math.max(10.0, Math.round(score * 10.0) / 10.0));
        String suggestionReason = reasons.isEmpty() ? "Opportunité active" : String.join(" • ", reasons);

        OpportunityDto dto = mapToOpportunityDto(opportunity);
        dto.setMatchPercentage(finalPercentage);
        dto.setSuggestionReason(suggestionReason);
        dto.setMatchedStack(matchedStack);
        dto.setIsPublisherFollowed(isFollowed);
        dto.setHasApplied(hasApplied);
        return dto;
    }

    private ApplicationDto mapToApplicationDto(ApplicationEntity application) {
        OpportunityEntity opp = application.getOpportunity();
        UserEntity publisher = opp != null ? opp.getPublisher() : null;
        String pubName = publisher != null && publisher.getProfile() != null && publisher.getProfile().getFullName() != null
                ? publisher.getProfile().getFullName()
                : (publisher != null ? publisher.getEmail() : "Émetteur");

        String effectiveCv = application.getCvUrl();
        if ((effectiveCv == null || effectiveCv.isBlank())
                && application.getApplicant() != null
                && application.getApplicant().getProfile() != null) {
            effectiveCv = application.getApplicant().getProfile().getCvUrl();
        }

        return ApplicationDto.builder()
                .id(application.getId())
                .opportunityId(opp != null ? opp.getId() : null)
                .opportunityTitle(opp != null ? opp.getTitle() : null)
                .opportunityType(opp != null ? opp.getType() : null)
                .opportunityLocation(opp != null ? opp.getLocation() : null)
                .opportunityBudget(opp != null ? opp.getBudget() : null)
                .publisherId(publisher != null ? publisher.getId() : null)
                .publisherName(pubName)
                .applicant(authService.mapToUserDto(application.getApplicant()))
                .message(application.getMessage())
                .cvUrl(effectiveCv)
                .coverLetterUrl(application.getCoverLetterUrl())
                .status(application.getStatus())
                .rejectionReason(application.getRejectionReason())
                .createdAt(application.getCreatedAt())
                .build();
    }
}
