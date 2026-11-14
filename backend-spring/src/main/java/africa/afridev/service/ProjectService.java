package africa.afridev.service;

import africa.afridev.dto.project.ProjectCreateRequest;
import africa.afridev.dto.project.ProjectDto;
import africa.afridev.model.entity.ProjectEntity;
import africa.afridev.model.entity.RecognitionEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.repository.ProjectRepository;
import africa.afridev.repository.RecognitionRepository;
import africa.afridev.repository.UserRepository;
import africa.afridev.repository.FollowRepository;
import africa.afridev.dto.PagedResult;
import com.fasterxml.jackson.databind.JavaType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final RecognitionRepository recognitionRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final AuthService authService;
    private final RedisCacheService redisCacheService;
    private final XpService xpService;
    private final africa.afridev.repository.PaymentRepository paymentRepository;

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
                .isMonetized(Boolean.TRUE.equals(request.getIsMonetized()) || (request.getPrice() != null && request.getPrice().compareTo(BigDecimal.ZERO) > 0))
                .payoutPhoneNumber(request.getPayoutPhoneNumber())
                .payoutOperator(request.getPayoutOperator())
                .acceptedPaymentMethods(request.getAcceptedPaymentMethods() != null ? request.getAcceptedPaymentMethods() : new ArrayList<>())
                .saleType(request.getSaleType())
                .saasPricingType(request.getSaasPricingType())
                .licenseType(request.getLicenseType())
                .demoAccountInfo(request.getDemoAccountInfo())
                .companyName(request.getCompanyName())
                .companyRole(request.getCompanyRole())
                .youtubeUrl(request.getYoutubeUrl())
                .documentationPdfUrl(request.getDocumentationPdfUrl())
                .sourceCodeArchiveUrl(request.getSourceCodeArchiveUrl())
                .maxMembers(request.getMaxMembers())
                .recognitionsCount(0)
                .status(ContentStatus.PUBLISHED)
                .build();

        ProjectEntity saved = projectRepository.save(project);
        redisCacheService.evictProjectsCache();
        xpService.awardXp(author, XpService.XP_PROJECT_PUBLISHED, africa.afridev.model.enums.XpSourceType.PROJECT_PUBLISHED, saved.getId(), "Publication du projet: " + saved.getTitle());
        return mapToProjectDto(saved, userEmail);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto> getAllProjects(String currentUserEmail, Pageable pageable) {
        return getAllProjects(currentUserEmail, null, "SUGGESTED", pageable);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto> getAllProjects(String currentUserEmail, africa.afridev.model.enums.ProjectType projectType, Pageable pageable) {
        return getAllProjects(currentUserEmail, projectType, "SUGGESTED", pageable);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto> getAllProjects(
            String currentUserEmail,
            africa.afridev.model.enums.ProjectType projectType,
            String sort,
            Pageable pageable
    ) {
        String sortParam = (sort != null && !sort.isBlank()) ? sort.toUpperCase().trim() : "SUGGESTED";
        String cacheKey = "cache:projects:" + (projectType != null ? projectType.name() : "ALL")
                + ":sort:" + sortParam
                + ":u:" + (currentUserEmail != null ? currentUserEmail : "anon")
                + ":p:" + pageable.getPageNumber()
                + ":s:" + pageable.getPageSize();

        try {
            JavaType type = redisCacheService.getObjectMapper().getTypeFactory()
                    .constructParametricType(PagedResult.class, ProjectDto.class);
            PagedResult<ProjectDto> cached = redisCacheService.get(cacheKey, type);
            if (cached != null) {
                return cached.toPage();
            }
        } catch (Exception ignored) {}

        UserEntity currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        ProfileEntity currentProfile = currentUser != null ? currentUser.getProfile() : null;

        List<ProjectEntity> allProjects = (projectType != null)
                ? projectRepository.findByStatusAndProjectType(ContentStatus.PUBLISHED, projectType)
                : projectRepository.findByStatus(ContentStatus.PUBLISHED);

        List<ProjectDto> dtoList = allProjects.stream()
                .map(p -> mapToScoredProjectDto(p, currentUser, currentProfile))
                .collect(Collectors.toList());

        String myCountry = (currentProfile != null && currentProfile.getCountry() != null) ? currentProfile.getCountry().trim() : "";

        switch (sortParam) {
            case "FOLLOWING" -> {
                if (currentUser != null) {
                    dtoList.sort((a, b) -> {
                        boolean aFollowed = Boolean.TRUE.equals(a.getIsAuthorFollowed());
                        boolean bFollowed = Boolean.TRUE.equals(b.getIsAuthorFollowed());
                        if (aFollowed != bFollowed) return aFollowed ? -1 : 1;
                        return Double.compare(
                                b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                                a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                        );
                    });
                } else {
                    dtoList.sort(Comparator.comparing(ProjectDto::getMatchPercentage, Comparator.nullsLast(Comparator.reverseOrder())));
                }
            }
            case "MOST_VIEWED" -> dtoList.sort(
                    Comparator.comparing(ProjectDto::getViewsCount, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(ProjectDto::getRecognitionsCount, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(ProjectDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            );
            case "POPULAR" -> dtoList.sort(
                    Comparator.comparing(ProjectDto::getRecognitionsCount, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(ProjectDto::getViewsCount, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(ProjectDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            );
            case "SAME_COUNTRY" -> dtoList.sort((a, b) -> {
                String cA = a.getAuthor() != null && a.getAuthor().getProfile() != null && a.getAuthor().getProfile().getCountry() != null
                        ? a.getAuthor().getProfile().getCountry().trim() : "";
                String cB = b.getAuthor() != null && b.getAuthor().getProfile() != null && b.getAuthor().getProfile().getCountry() != null
                        ? b.getAuthor().getProfile().getCountry().trim() : "";
                boolean aSame = !myCountry.isEmpty() && myCountry.equalsIgnoreCase(cA);
                boolean bSame = !myCountry.isEmpty() && myCountry.equalsIgnoreCase(cB);
                if (aSame != bSame) return aSame ? -1 : 1;
                return Double.compare(
                        b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                        a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                );
            });
            case "COLLABORATION" -> dtoList.sort((a, b) -> {
                boolean aCollab = (a.getMaxMembers() != null && a.getMaxMembers() > 1) || Boolean.TRUE.equals(a.getIsOpenSource());
                boolean bCollab = (b.getMaxMembers() != null && b.getMaxMembers() > 1) || Boolean.TRUE.equals(b.getIsOpenSource());
                if (aCollab != bCollab) return aCollab ? -1 : 1;
                return Double.compare(
                        b.getMatchPercentage() != null ? b.getMatchPercentage() : 0.0,
                        a.getMatchPercentage() != null ? a.getMatchPercentage() : 0.0
                );
            });
            case "RECENT" -> dtoList.sort((a, b) -> {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
            case "SUGGESTED" -> dtoList.sort(
                    Comparator.comparing(ProjectDto::getMatchPercentage, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(ProjectDto::getRecognitionsCount, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(ProjectDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            );
            default -> dtoList.sort(
                    Comparator.comparing(ProjectDto::getMatchPercentage, Comparator.nullsLast(Comparator.reverseOrder()))
            );
        }

        int total = dtoList.size();
        int fromIndex = (int) pageable.getOffset();
        List<ProjectDto> pagedList;
        if (fromIndex >= total) {
            pagedList = Collections.emptyList();
        } else {
            int toIndex = Math.min(fromIndex + pageable.getPageSize(), total);
            pagedList = dtoList.subList(fromIndex, toIndex);
        }

        Page<ProjectDto> pageResult = new PageImpl<>(pagedList, pageable, total);
        redisCacheService.set(cacheKey, PagedResult.from(pageResult), Duration.ofMinutes(10));
        return pageResult;
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
        redisCacheService.evictProjectsCache();

        if (project.getAuthor() != null) {
            xpService.awardXp(project.getAuthor(), XpService.XP_RECOGNITION_RECEIVED, africa.afridev.model.enums.XpSourceType.RECOGNITION_RECEIVED, project.getId(), "Soutien reçu sur le projet: " + project.getTitle());
        }

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
            redisCacheService.evictProjectsCache();
        }

        return mapToProjectDto(project, userEmail);
    }

    @Transactional
    public ProjectDto recordView(String projectId, String currentUserEmail) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable."));
        project.setViewsCount((project.getViewsCount() == null ? 0 : project.getViewsCount()) + 1);
        ProjectEntity saved = projectRepository.save(project);
        redisCacheService.evictProjectsCache();

        if (project.getAuthor() != null) {
            xpService.awardXp(project.getAuthor(), XpService.XP_PROJECT_VIEW, africa.afridev.model.enums.XpSourceType.PROJECT_VIEW, project.getId(), "Vue sur le projet: " + project.getTitle());
        }
        return mapToProjectDto(saved, currentUserEmail);
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
        if (request.getSourceCodeArchiveUrl() != null) {
            project.setSourceCodeArchiveUrl(request.getSourceCodeArchiveUrl());
        }
        project.setMaxMembers(request.getMaxMembers());

        ProjectEntity saved = projectRepository.save(project);
        redisCacheService.evictProjectsCache();
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
        redisCacheService.evictProjectsCache();
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
        redisCacheService.evictProjectsCache();
    }

    public ProjectDto mapToProjectDto(ProjectEntity project, String currentUserEmail) {
        UserEntity currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        ProfileEntity currentProfile = currentUser != null ? currentUser.getProfile() : null;
        return mapToScoredProjectDto(project, currentUser, currentProfile);
    }

    private ProjectDto mapToScoredProjectDto(ProjectEntity project, UserEntity currentUser, ProfileEntity currentProfile) {
        String currentUserId = currentUser != null ? currentUser.getId() : null;
        boolean recognized = false;
        boolean isAuthor = false;
        boolean isAuthorFollowed = false;

        if (currentUser != null) {
            recognized = recognitionRepository.existsByProjectIdAndUserId(project.getId(), currentUserId);
            isAuthor = project.getAuthor().getId().equals(currentUserId);
            if (!isAuthor) {
                if (redisCacheService.isFollowing(currentUserId, project.getAuthor().getId())) {
                    isAuthorFollowed = true;
                } else {
                    isAuthorFollowed = followRepository.existsByFollowerIdAndFollowingId(currentUserId, project.getAuthor().getId());
                }
            }
        }

        // Detection des technologies partagees
        List<String> matchedStack = new ArrayList<>();
        if (currentProfile != null && currentProfile.getSkills() != null && project.getStack() != null) {
            Set<String> mySkillsLower = currentProfile.getSkills().stream()
                    .filter(Objects::nonNull)
                    .map(s -> s.trim().toLowerCase())
                    .collect(Collectors.toSet());
            for (String tech : project.getStack()) {
                if (tech != null && mySkillsLower.contains(tech.trim().toLowerCase())) {
                    matchedStack.add(tech.trim());
                }
            }
        }

        // Detection geographique (pays / ville)
        ProfileEntity authorProfile = project.getAuthor().getProfile();
        String authorCountry = (authorProfile != null && authorProfile.getCountry() != null) ? authorProfile.getCountry().trim() : "";
        String myCountry = (currentProfile != null && currentProfile.getCountry() != null) ? currentProfile.getCountry().trim() : "";
        boolean sameCountry = !authorCountry.isEmpty() && !myCountry.isEmpty() && authorCountry.equalsIgnoreCase(myCountry);

        String authorCity = (authorProfile != null && authorProfile.getCity() != null) ? authorProfile.getCity().trim() : "";
        String myCity = (currentProfile != null && currentProfile.getCity() != null) ? currentProfile.getCity().trim() : "";
        boolean sameCity = sameCountry && !authorCity.isEmpty() && !myCity.isEmpty() && authorCity.equalsIgnoreCase(myCity);

        int recognitions = project.getRecognitionsCount() != null ? project.getRecognitionsCount() : 0;
        boolean isOpenSource = Boolean.TRUE.equals(project.getIsOpenSource()) || project.getProjectType() == africa.afridev.model.enums.ProjectType.OPEN_SOURCE;
        boolean isCollab = (project.getMaxMembers() != null && project.getMaxMembers() > 1) || isOpenSource;

        double matchPercentage;
        String reason;

        String authorName = (authorProfile != null && authorProfile.getFullName() != null) ? authorProfile.getFullName() : project.getAuthor().getEmail();

        if (currentUser != null) {
            double score = 20.0;

            // Priorite reseau forte : projet d'une personne suivie !
            if (isAuthorFollowed) {
                score += 25.0;
            }

            // Stack partagee
            score += Math.min(35.0, matchedStack.size() * 10.0);

            // Synergie locale (meme pays / ville)
            if (sameCountry) {
                score += 25.0;
                if (sameCity) {
                    score += 10.0;
                }
            }

            // Popularite
            score += Math.min(20.0, recognitions * 2.0);

            // Opportunite de collaboration
            if (isCollab) {
                score += 15.0;
            }

            // Qualite (demo, repo)
            if (project.getDemoUrl() != null && !project.getDemoUrl().isBlank()) score += 5.0;
            if (project.getRepoUrl() != null && !project.getRepoUrl().isBlank()) score += 5.0;

            // Non encore reconnu (decouverte)
            if (!recognized && !isAuthor) {
                score += 10.0;
            }

            matchPercentage = Math.min(99.0, Math.max(40.0, (double) Math.round(score)));

            // Formulation de la raison explicite
            if (isAuthorFollowed && !matchedStack.isEmpty()) {
                reason = "Publié par " + authorName + " (membre suivi) • Stack partagée (" + String.join(", ", matchedStack.subList(0, Math.min(2, matchedStack.size()))) + ")";
            } else if (isAuthorFollowed) {
                reason = "Publié par " + authorName + " (membre que vous suivez)";
            } else if (sameCountry && !matchedStack.isEmpty()) {
                reason = "Auteur au " + authorCountry + " • " + matchedStack.size() + " techno(s) en commun";
            } else if (!matchedStack.isEmpty()) {
                reason = "Correspond à votre stack (" + String.join(", ", matchedStack.subList(0, Math.min(3, matchedStack.size()))) + ")";
            } else if (sameCountry) {
                reason = "Projet conçu au " + authorCountry + " (Synergie locale)";
            } else if (isCollab && project.getMaxMembers() != null && project.getMaxMembers() > 1) {
                reason = "Recherche active de collaborateurs (" + project.getMaxMembers() + " membres)";
            } else if (recognitions >= 5) {
                reason = "Très plébiscité par la communauté (" + recognitions + " reconnaissances)";
            } else {
                reason = "Projet recommandé dans l'écosystème AfriDev";
            }
        } else {
            // Mode visiteur non connecte
            double score = 40.0;
            score += Math.min(30.0, recognitions * 3.0);
            if (project.getDemoUrl() != null && !project.getDemoUrl().isBlank()) score += 15.0;
            if (isOpenSource) score += 15.0;

            matchPercentage = Math.min(98.0, Math.max(50.0, (double) Math.round(score)));

            if (recognitions >= 5) {
                reason = "Projet star de la communauté (" + recognitions + " reconnaissances)";
            } else if (isOpenSource) {
                reason = "Projet Open Source africain en vedette";
            } else {
                reason = "Projet innovant sur AfriDev Hub";
            }
        }

        // Confidentiality check for Enterprise or Monetized repository URL
        boolean isPurchased = isAuthor || (currentUser != null && paymentRepository.existsByBuyerIdAndTargetIdAndStatus(currentUser.getId(), project.getId(), africa.afridev.model.enums.PaymentStatus.COMPLETED));
        boolean isMonetizedProject = Boolean.TRUE.equals(project.getIsMonetized()) || (project.getPrice() != null && project.getPrice().compareTo(BigDecimal.ZERO) > 0) || project.getSaleType() != null;

        String sanitizedRepoUrl = project.getRepoUrl();
        if (project.getProjectType() == africa.afridev.model.enums.ProjectType.ENTERPRISE || (isMonetizedProject && !isOpenSource && !isPurchased)) {
            sanitizedRepoUrl = null;
        }

        boolean hasArchive = project.getSourceCodeArchiveUrl() != null && !project.getSourceCodeArchiveUrl().isBlank();
        String safeArchiveUrl = (isPurchased || isAuthor) ? project.getSourceCodeArchiveUrl() : null;

        List<String> screenshotsList = (project.getScreenshots() != null && !project.getScreenshots().isEmpty())
                ? project.getScreenshots()
                : List.of(resolveDefaultProjectCover(project));

        return ProjectDto.builder()
                .id(project.getId())
                .author(authService.mapToUserDto(project.getAuthor()))
                .title(project.getTitle())
                .description(project.getDescription())
                .stack(project.getStack())
                .repoUrl(sanitizedRepoUrl)
                .demoUrl(project.getDemoUrl())
                .screenshots(screenshotsList)
                .isOpenSource(isOpenSource)
                .projectType(project.getProjectType() != null ? project.getProjectType() : africa.afridev.model.enums.ProjectType.OPEN_SOURCE)
                .price(project.getPrice())
                .currency(project.getCurrency() != null ? project.getCurrency() : "XOF")
                .isMonetized(isMonetizedProject)
                .payoutPhoneNumber(project.getPayoutPhoneNumber())
                .payoutOperator(project.getPayoutOperator())
                .acceptedPaymentMethods(project.getAcceptedPaymentMethods())
                .saleType(project.getSaleType())
                .saasPricingType(project.getSaasPricingType())
                .licenseType(project.getLicenseType())
                .demoAccountInfo(isAuthor ? project.getDemoAccountInfo() : null)
                .companyName(project.getCompanyName())
                .companyRole(project.getCompanyRole())
                .youtubeUrl(project.getYoutubeUrl())
                .documentationPdfUrl(project.getDocumentationPdfUrl())
                .sourceCodeArchiveUrl(safeArchiveUrl)
                .hasSourceCodeArchive(hasArchive)
                .isPurchasedByCurrentUser(isPurchased)
                .maxMembers(project.getMaxMembers())
                .recognitionsCount(recognitions)
                .viewsCount(project.getViewsCount() != null ? project.getViewsCount() : 0)
                .recognizedByCurrentUser(recognized)
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .matchPercentage(matchPercentage)
                .suggestionReason(reason)
                .matchedStack(matchedStack)
                .isAuthorFollowed(isAuthorFollowed)
                .build();
    }

    @Transactional(readOnly = true)
    public String getSourceCodeDownloadUrl(String userEmail, String projectId) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable."));

        boolean isAuthor = project.getAuthor().getId().equals(user.getId());
        boolean hasPurchased = paymentRepository.existsByBuyerIdAndTargetIdAndStatus(user.getId(), projectId, africa.afridev.model.enums.PaymentStatus.COMPLETED);
        boolean isAdmin = user.getRole() == africa.afridev.model.enums.Role.ADMIN || user.getRole() == africa.afridev.model.enums.Role.SUPER_ADMIN;

        if (!isAuthor && !hasPurchased && !isAdmin) {
            throw new IllegalStateException("Vous devez acheter ce projet pour accéder à son code source.");
        }

        if (project.getSourceCodeArchiveUrl() != null && !project.getSourceCodeArchiveUrl().isBlank()) {
            return project.getSourceCodeArchiveUrl();
        }
        if (project.getRepoUrl() != null && !project.getRepoUrl().isBlank()) {
            return project.getRepoUrl();
        }
        throw new IllegalStateException("Le créateur du projet n'a pas encore configuré d'archive de code source.");
    }

    public static String resolveDefaultProjectCover(ProjectEntity project) {
        String stackLower = project.getStack() != null ? String.join(" ", project.getStack()).toLowerCase() : "";
        if (stackLower.contains("ai") || stackLower.contains("llm") || stackLower.contains("python") || stackLower.contains("data") || stackLower.contains("intelligence")) {
            return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
        } else if (stackLower.contains("mobile") || stackLower.contains("flutter") || stackLower.contains("react native") || stackLower.contains("android") || stackLower.contains("ios")) {
            return "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1200&q=80";
        } else if (stackLower.contains("fintech") || stackLower.contains("money") || stackLower.contains("bank") || stackLower.contains("pay") || stackLower.contains("crypto")) {
            return "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80";
        } else if (stackLower.contains("cloud") || stackLower.contains("devops") || stackLower.contains("docker") || stackLower.contains("kubernetes") || stackLower.contains("aws")) {
            return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80";
        } else if (stackLower.contains("angular") || stackLower.contains("react") || stackLower.contains("vue") || stackLower.contains("frontend") || stackLower.contains("web")) {
            return "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80";
        }
        return "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80";
    }
    }
}
