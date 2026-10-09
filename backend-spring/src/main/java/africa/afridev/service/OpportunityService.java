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
import africa.afridev.repository.ApplicationRepository;
import africa.afridev.repository.OpportunityRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

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
                .status(ContentStatus.PUBLISHED)
                .build();

        OpportunityEntity saved = opportunityRepository.save(opportunity);
        return mapToOpportunityDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<OpportunityDto> getAllOpportunities(OpportunityType type, Pageable pageable) {
        Page<OpportunityEntity> page;
        if (type != null) {
            page = opportunityRepository.findByTypeAndStatusOrderByCreatedAtDesc(type, ContentStatus.PUBLISHED, pageable);
        } else {
            page = opportunityRepository.findByStatusOrderByCreatedAtDesc(ContentStatus.PUBLISHED, pageable);
        }
        return page.map(this::mapToOpportunityDto);
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

        if (applicationRepository.existsByOpportunityIdAndApplicantId(opportunityId, applicant.getId())) {
            throw new IllegalStateException("Vous avez déjà candidaté à cette opportunité.");
        }

        ApplicationEntity application = ApplicationEntity.builder()
                .opportunity(opportunity)
                .applicant(applicant)
                .message(request.getMessage())
                .cvUrl(request.getCvUrl())
                .status(ApplicationStatus.PENDING)
                .build();

        ApplicationEntity saved = applicationRepository.save(application);
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
    public ApplicationDto updateApplicationStatus(String userEmail, String applicationId, ApplicationStatus newStatus) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ApplicationEntity application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Candidature introuvable avec l'id: " + applicationId));

        if (!application.getOpportunity().getPublisher().getId().equals(user.getId())) {
            throw new IllegalStateException("Seul l'émetteur de cette opportunité peut changer le statut des candidatures.");
        }

        application.setStatus(newStatus);
        ApplicationEntity saved = applicationRepository.save(application);
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

        OpportunityEntity saved = opportunityRepository.save(opportunity);
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
    }

    private OpportunityDto mapToOpportunityDto(OpportunityEntity opportunity) {
        return OpportunityDto.builder()
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
                .status(opportunity.getStatus())
                .createdAt(opportunity.getCreatedAt())
                .build();
    }

    private ApplicationDto mapToApplicationDto(ApplicationEntity application) {
        OpportunityEntity opp = application.getOpportunity();
        UserEntity publisher = opp != null ? opp.getPublisher() : null;
        String pubName = publisher != null && publisher.getProfile() != null && publisher.getProfile().getFullName() != null
                ? publisher.getProfile().getFullName()
                : (publisher != null ? publisher.getEmail() : "Émetteur");

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
                .cvUrl(application.getCvUrl())
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                .build();
    }
}
