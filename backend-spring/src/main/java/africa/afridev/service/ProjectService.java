package africa.afridev.service;

import africa.afridev.dto.project.ProjectCreateRequest;
import africa.afridev.dto.project.ProjectDto;
import africa.afridev.model.entity.ProjectEntity;
import africa.afridev.model.entity.RecognitionEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.repository.ProjectRepository;
import africa.afridev.repository.RecognitionRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final RecognitionRepository recognitionRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional
    public ProjectDto createProject(String userEmail, ProjectCreateRequest request) {
        UserEntity author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        validateProjectRequest(request);

        africa.afridev.model.enums.ProjectType pType = request.getProjectType() != null ? request.getProjectType() : africa.afridev.model.enums.ProjectType.OPEN_SOURCE;

        ProjectEntity project = ProjectEntity.builder()
                .author(author)
                .title(request.getTitle())
                .description(request.getDescription())
                .stack(request.getStack() != null ? request.getStack() : new ArrayList<>())
                .repoUrl(pType == africa.afridev.model.enums.ProjectType.ENTERPRISE ? null : request.getRepoUrl())
                .demoUrl(request.getDemoUrl())
                .screenshots(request.getScreenshots() != null ? request.getScreenshots() : new ArrayList<>())
                .isOpenSource(pType == africa.afridev.model.enums.ProjectType.OPEN_SOURCE || Boolean.TRUE.equals(request.getIsOpenSource()))
                .projectType(pType)
                .price(request.getPrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "XOF")
                .saleType(request.getSaleType())
                .saasPricingType(request.getSaasPricingType())
                .licenseType(request.getLicenseType())
                .demoAccountInfo(request.getDemoAccountInfo())
                .companyName(request.getCompanyName())
                .companyRole(request.getCompanyRole())
                .youtubeUrl(request.getYoutubeUrl())
                .documentationPdfUrl(request.getDocumentationPdfUrl())
                .maxMembers(request.getMaxMembers())
                .recognitionsCount(0)
                .status(ContentStatus.PUBLISHED)
                .build();

        ProjectEntity saved = projectRepository.save(project);
        return mapToProjectDto(saved, userEmail);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto> getAllProjects(String currentUserEmail, Pageable pageable) {
        Page<ProjectEntity> projects = projectRepository.findByStatusOrderByCreatedAtDesc(ContentStatus.PUBLISHED, pageable);
        return projects.map(p -> mapToProjectDto(p, currentUserEmail));
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto> getProjectsByAuthorId(String authorId, String currentUserEmail, Pageable pageable) {
        Page<ProjectEntity> projects = projectRepository.findByAuthorIdAndStatus(authorId, ContentStatus.PUBLISHED, pageable);
        return projects.map(p -> mapToProjectDto(p, currentUserEmail));
    }

    @Transactional(readOnly = true)
    public ProjectDto getProjectById(String id, String currentUserEmail) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable avec l'identifiant: " + id));
        return mapToProjectDto(project, currentUserEmail);
    }

    @Transactional
    public ProjectDto recognizeProject(String userEmail, String projectId) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable."));

        if (project.getAuthor().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas reconnaître votre propre projet.");
        }

        if (recognitionRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            throw new IllegalStateException("Vous avez déjà reconnu ce projet.");
        }

        RecognitionEntity recognition = RecognitionEntity.builder()
                .project(project)
                .user(user)
                .build();

        recognitionRepository.save(recognition);
        project.setRecognitionsCount(project.getRecognitionsCount() + 1);
        ProjectEntity saved = projectRepository.save(project);

        return mapToProjectDto(saved, userEmail);
    }

    @Transactional
    public ProjectDto unrecognizeProject(String userEmail, String projectId) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable."));

        if (recognitionRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            recognitionRepository.deleteByProjectIdAndUserId(projectId, user.getId());
            project.setRecognitionsCount(Math.max(0, project.getRecognitionsCount() - 1));
            projectRepository.save(project);
        }

        return mapToProjectDto(project, userEmail);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto> getMyProjects(String userEmail, Pageable pageable) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));
        Page<ProjectEntity> projects = projectRepository.findMyProjects(user.getId(), pageable);
        return projects.map(p -> mapToProjectDto(p, userEmail));
    }

    @Transactional
    public ProjectDto updateProject(String userEmail, String id, ProjectCreateRequest request) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable."));

        if (!project.getAuthor().getId().equals(user.getId())) {
            throw new IllegalStateException("Vous n'êtes pas le propriétaire de ce projet.");
        }

        validateProjectRequest(request);

        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        if (request.getStack() != null) project.setStack(request.getStack());
        project.setRepoUrl(request.getProjectType() == africa.afridev.model.enums.ProjectType.ENTERPRISE ? null : request.getRepoUrl());
        project.setDemoUrl(request.getDemoUrl());
        if (request.getScreenshots() != null) project.setScreenshots(request.getScreenshots());
        if (request.getIsOpenSource() != null) project.setIsOpenSource(request.getIsOpenSource());

        if (request.getProjectType() != null) {
            project.setProjectType(request.getProjectType());
            if (request.getProjectType() == africa.afridev.model.enums.ProjectType.OPEN_SOURCE) {
                project.setIsOpenSource(true);
            }
        }
        project.setPrice(request.getPrice());
        if (request.getCurrency() != null) project.setCurrency(request.getCurrency());
        project.setSaleType(request.getSaleType());
        project.setSaasPricingType(request.getSaasPricingType());
        project.setLicenseType(request.getLicenseType());
        project.setDemoAccountInfo(request.getDemoAccountInfo());
        project.setCompanyName(request.getCompanyName());
        project.setCompanyRole(request.getCompanyRole());
        project.setYoutubeUrl(request.getYoutubeUrl());
        project.setDocumentationPdfUrl(request.getDocumentationPdfUrl());
        project.setMaxMembers(request.getMaxMembers());

        ProjectEntity saved = projectRepository.save(project);
        return mapToProjectDto(saved, userEmail);
    }

    private void validateProjectRequest(ProjectCreateRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().length() < 3) {
            throw new IllegalArgumentException("Le titre du projet doit contenir au moins 3 caractères.");
        }
        if (request.getDescription() == null || request.getDescription().trim().length() < 10) {
            throw new IllegalArgumentException("La description du projet doit contenir au moins 10 caractères.");
        }

        africa.afridev.model.enums.ProjectType type = request.getProjectType() != null ? request.getProjectType() : africa.afridev.model.enums.ProjectType.OPEN_SOURCE;

        switch (type) {
            case COLLABORATIVE -> {
                if (request.getStack() == null || request.getStack().isEmpty()) {
                    throw new IllegalArgumentException("Les technologies / stack technique sont obligatoires pour un projet collaboratif.");
                }
                if (request.getMaxMembers() != null && request.getMaxMembers() < 1) {
                    throw new IllegalArgumentException("Le nombre maximum de collaborateurs doit être au moins de 1 s'il est spécifié.");
                }
            }
            case OPEN_SOURCE -> {
                if (request.getRepoUrl() == null || request.getRepoUrl().trim().isEmpty()) {
                    throw new IllegalArgumentException("Le lien du dépôt GitHub est obligatoire pour un projet Open Source.");
                }
            }
            case FOR_SALE -> {
                if (request.getPrice() == null || request.getPrice().compareTo(java.math.BigDecimal.ZERO) < 0) {
                    throw new IllegalArgumentException("Le prix de vente est obligatoire et doit être positif ou nul.");
                }
            }
            case SAAS -> {
                if (request.getDemoUrl() == null || request.getDemoUrl().trim().isEmpty()) {
                    throw new IllegalArgumentException("Le lien de démonstration/application en ligne est obligatoire pour un SaaS.");
                }
            }
            case PORTFOLIO -> {
                if (request.getDemoUrl() == null || request.getDemoUrl().trim().isEmpty()) {
                    throw new IllegalArgumentException("Le lien du site est obligatoire pour un projet Portfolio.");
                }
            }
            case ENTERPRISE -> {
                if (request.getCompanyName() == null || request.getCompanyName().trim().isEmpty()) {
                    throw new IllegalArgumentException("Le nom de l'entreprise est obligatoire pour un projet d'entreprise.");
                }
                if (request.getCompanyRole() == null || request.getCompanyRole().trim().isEmpty()) {
                    throw new IllegalArgumentException("Le rôle tenu est obligatoire pour un projet d'entreprise.");
                }
            }
        }

        if (request.getYoutubeUrl() != null && !request.getYoutubeUrl().trim().isEmpty()) {
            String regex = "^(https?://)?(www\\.)?(youtube\\.com/watch\\?v=|youtu\\.be/)([a-zA-Z0-9_-]{11})(\\S*)?$";
            if (!request.getYoutubeUrl().trim().matches(regex)) {
                throw new IllegalArgumentException("Le lien vidéo YouTube est invalide. Exemple accepté: https://www.youtube.com/watch?v=VIDEO_ID");
            }
        }
    }

    @Transactional
    public ProjectDto toggleProjectStatus(String userEmail, String id) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable."));

        if (!project.getAuthor().getId().equals(user.getId())) {
            throw new IllegalStateException("Vous n'êtes pas le propriétaire de ce projet.");
        }

        if (project.getStatus() == ContentStatus.PUBLISHED) {
            project.setStatus(ContentStatus.HIDDEN);
        } else {
            project.setStatus(ContentStatus.PUBLISHED);
        }

        ProjectEntity saved = projectRepository.save(project);
        return mapToProjectDto(saved, userEmail);
    }

    @Transactional
    public void deleteProject(String userEmail, String id) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable."));

        if (!project.getAuthor().getId().equals(user.getId())) {
            throw new IllegalStateException("Vous n'êtes pas le propriétaire de ce projet.");
        }

        projectRepository.delete(project);
    }

    private ProjectDto mapToProjectDto(ProjectEntity project, String currentUserEmail) {
        boolean recognized = false;
        boolean isAuthor = false;
        if (currentUserEmail != null) {
            var userOpt = userRepository.findByEmail(currentUserEmail);
            if (userOpt.isPresent()) {
                String currentUserId = userOpt.get().getId();
                recognized = recognitionRepository.existsByProjectIdAndUserId(project.getId(), currentUserId);
                isAuthor = project.getAuthor().getId().equals(currentUserId);
            }
        }

        // Confidentiality check for Enterprise or For Sale repository URL
        String sanitizedRepoUrl = project.getRepoUrl();
        if (project.getProjectType() == africa.afridev.model.enums.ProjectType.ENTERPRISE) {
            sanitizedRepoUrl = null; // Enterprise code repository is strictly NDA/confidential
        }

        return ProjectDto.builder()
                .id(project.getId())
                .author(authService.mapToUserDto(project.getAuthor()))
                .title(project.getTitle())
                .description(project.getDescription())
                .stack(project.getStack())
                .repoUrl(sanitizedRepoUrl)
                .demoUrl(project.getDemoUrl())
                .screenshots(project.getScreenshots())
                .isOpenSource(project.getIsOpenSource() != null ? project.getIsOpenSource() : (project.getProjectType() == africa.afridev.model.enums.ProjectType.OPEN_SOURCE))
                .projectType(project.getProjectType() != null ? project.getProjectType() : africa.afridev.model.enums.ProjectType.OPEN_SOURCE)
                .price(project.getPrice())
                .currency(project.getCurrency() != null ? project.getCurrency() : "XOF")
                .saleType(project.getSaleType())
                .saasPricingType(project.getSaasPricingType())
                .licenseType(project.getLicenseType())
                .demoAccountInfo(isAuthor ? project.getDemoAccountInfo() : null)
                .companyName(project.getCompanyName())
                .companyRole(project.getCompanyRole())
                .youtubeUrl(project.getYoutubeUrl())
                .documentationPdfUrl(project.getDocumentationPdfUrl())
                .maxMembers(project.getMaxMembers())
                .recognitionsCount(project.getRecognitionsCount())
                .recognizedByCurrentUser(recognized)
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
