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

        ProjectEntity project = ProjectEntity.builder()
                .author(author)
                .title(request.getTitle())
                .description(request.getDescription())
                .stack(request.getStack() != null ? request.getStack() : new ArrayList<>())
                .repoUrl(request.getRepoUrl())
                .demoUrl(request.getDemoUrl())
                .screenshots(request.getScreenshots() != null ? request.getScreenshots() : new ArrayList<>())
                .isOpenSource(request.getIsOpenSource() != null ? request.getIsOpenSource() : false)
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

    private ProjectDto mapToProjectDto(ProjectEntity project, String currentUserEmail) {
        boolean recognized = false;
        if (currentUserEmail != null) {
            var userOpt = userRepository.findByEmail(currentUserEmail);
            if (userOpt.isPresent()) {
                recognized = recognitionRepository.existsByProjectIdAndUserId(project.getId(), userOpt.get().getId());
            }
        }

        return ProjectDto.builder()
                .id(project.getId())
                .author(authService.mapToUserDto(project.getAuthor()))
                .title(project.getTitle())
                .description(project.getDescription())
                .stack(project.getStack())
                .repoUrl(project.getRepoUrl())
                .demoUrl(project.getDemoUrl())
                .screenshots(project.getScreenshots())
                .isOpenSource(project.getIsOpenSource())
                .recognitionsCount(project.getRecognitionsCount())
                .recognizedByCurrentUser(recognized)
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
