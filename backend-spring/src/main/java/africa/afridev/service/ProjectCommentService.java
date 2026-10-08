package africa.afridev.service;

import africa.afridev.dto.project.ProjectCommentCreateRequest;
import africa.afridev.dto.project.ProjectCommentDto;
import africa.afridev.model.entity.ProjectCommentEntity;
import africa.afridev.model.entity.ProjectEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.ProjectCommentRepository;
import africa.afridev.repository.ProjectRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectCommentService {

    private final ProjectCommentRepository commentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional
    public ProjectCommentDto addComment(String userEmail, String projectId, ProjectCommentCreateRequest request) {
        UserEntity author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable avec l'id: " + projectId));

        ProjectCommentEntity comment = ProjectCommentEntity.builder()
                .project(project)
                .author(author)
                .content(request.getContent())
                .build();

        ProjectCommentEntity saved = commentRepository.save(comment);
        return mapToCommentDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectCommentDto> getCommentsForProject(String projectId) {
        return commentRepository.findByProjectIdOrderByCreatedAtAsc(projectId).stream()
                .map(this::mapToCommentDto)
                .collect(Collectors.toList());
    }

    private ProjectCommentDto mapToCommentDto(ProjectCommentEntity entity) {
        return ProjectCommentDto.builder()
                .id(entity.getId())
                .projectId(entity.getProject().getId())
                .author(authService.mapToUserDto(entity.getAuthor()))
                .content(entity.getContent())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
