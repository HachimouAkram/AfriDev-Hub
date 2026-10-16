package africa.afridev.service;

import africa.afridev.dto.collaboration.*;
import africa.afridev.model.entity.*;
import africa.afridev.model.enums.MemberStatus;
import africa.afridev.model.enums.TaskStatus;
import africa.afridev.repository.ProjectMemberRepository;
import africa.afridev.repository.ProjectRepository;
import africa.afridev.repository.ProjectTaskRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectCollaborationService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final ProjectTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ── GESTION DES MEMBRES & RECRUTEMENT ─────────────────────────────────────

    @Transactional
    public ProjectMemberDto applyToJoin(String projectId, String userEmail, MemberApplyRequest request) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable"));

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        if (project.getAuthor().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Vous êtes déjà l'auteur / lead de ce projet.");
        }

        if (memberRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            throw new IllegalArgumentException("Vous avez déjà postulé ou faites déjà partie de ce projet.");
        }

        if (project.getMaxMembers() != null && project.getMaxMembers() > 0) {
            long acceptedCount = memberRepository.countByProjectIdAndStatus(projectId, MemberStatus.ACCEPTED);
            if (acceptedCount >= project.getMaxMembers()) {
                throw new IllegalStateException("Ce projet a atteint son effectif maximum de " + project.getMaxMembers() + " collaborateurs. Les candidatures sont closes.");
            }
        }

        String cvUrl = request.getCvUrl();
        if ((cvUrl == null || cvUrl.isBlank()) && user.getProfile() != null) {
            cvUrl = user.getProfile().getCvUrl();
        }

        ProjectMemberEntity member = ProjectMemberEntity.builder()
                .project(project)
                .user(user)
                .role(request.getRole() != null ? request.getRole() : "Contributeur")
                .message(request.getMessage())
                .cvUrl(cvUrl)
                .status(MemberStatus.PENDING)
                .build();

        ProjectMemberEntity saved = memberRepository.save(member);
        log.info("[COLLAB] Nouvelle candidature de {} (CV: {}) pour le projet {}", userEmail, cvUrl, project.getTitle());

        notificationService.createNotification(
                project.getAuthor(),
                "COLLABORATION",
                "Nouvelle candidature pour votre projet",
                user.getEmail() + " souhaite rejoindre l'équipe de \"" + project.getTitle() + "\" comme " + member.getRole() + ".",
                "/dashboard/projects?openCollab=" + project.getId()
        );

        return mapToMemberDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberDto> getProjectMembers(String projectId) {
        return memberRepository.findByProjectId(projectId).stream()
                .map(this::mapToMemberDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectMemberDto updateMemberStatus(String projectId, String memberId, String leadEmail, MemberStatusUpdateRequest request) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable"));

        if (!project.getAuthor().getEmail().equalsIgnoreCase(leadEmail)) {
            throw new IllegalArgumentException("Seul le créateur du projet peut valider ou refuser les membres.");
        }

        ProjectMemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Membre/candidature introuvable"));

        if (!member.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Ce membre n'appartient pas à ce projet.");
        }

        member.setStatus(request.getStatus());
        if (request.getStatus() == MemberStatus.ACCEPTED) {
            member.setJoinedAt(LocalDateTime.now());
        }
        ProjectMemberEntity saved = memberRepository.save(member);
        log.info("[COLLAB] Statut membre {} mis à jour: {}", member.getUser().getEmail(), request.getStatus());

        if (request.getStatus() == MemberStatus.ACCEPTED) {
            notificationService.createNotification(
                    member.getUser(),
                    "COLLABORATION",
                    "Félicitations ! Candidature acceptée",
                    "Vous avez été accepté(e) dans l'équipe du projet \"" + project.getTitle() + "\" !",
                    "/dashboard/projects?openCollab=" + project.getId()
            );

            // Vérifier si le quota maximal de collaborateurs est atteint
            if (project.getMaxMembers() != null && project.getMaxMembers() > 0) {
                long currentAccepted = memberRepository.countByProjectIdAndStatus(projectId, MemberStatus.ACCEPTED);
                if (currentAccepted >= project.getMaxMembers()) {
                    List<ProjectMemberEntity> pendingList = memberRepository.findByProjectIdAndStatus(projectId, MemberStatus.PENDING);
                    for (ProjectMemberEntity pending : pendingList) {
                        pending.setStatus(MemberStatus.REJECTED);
                        memberRepository.save(pending);

                        notificationService.createNotification(
                                pending.getUser(),
                                "COLLABORATION",
                                "Candidature non retenue (Quota atteint)",
                                "Le nombre maximum de collaborateurs requis (" + project.getMaxMembers() + ") pour le projet \"" 
                                        + project.getTitle() + "\" a été atteint. Votre candidature n'a pas pu être retenue. Merci pour votre intérêt !",
                                "/projects"
                        );
                    }
                    log.info("[COLLAB] Quota de {} membres atteint pour {}. {} candidatures ont été clôturées avec motif.",
                            project.getMaxMembers(), project.getTitle(), pendingList.size());
                }
            }
        } else if (request.getStatus() == MemberStatus.REJECTED) {
            notificationService.createNotification(
                    member.getUser(),
                    "COLLABORATION",
                    "Réponse à votre candidature",
                    "Votre candidature pour rejoindre le projet \"" + project.getTitle() + "\" n'a pas été retenue par le chef de projet.",
                    "/projects"
            );
        }

        return mapToMemberDto(saved);
    }

    // ── GESTION DES TÂCHES (KANBAN & SUIVI PROFESSIONNEL) ────────────────────

    @Transactional
    public ProjectTaskDto createTask(String projectId, String userEmail, TaskCreateRequest request) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable"));

        UserEntity currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        boolean isLead = project.getAuthor().getId().equals(currentUser.getId());
        if (!isLead) {
            throw new IllegalArgumentException("Seul le chef de projet peut créer et assigner des tâches.");
        }

        UserEntity assignedTo = null;
        if (request.getAssignedToId() != null && !request.getAssignedToId().isBlank()) {
            assignedTo = userRepository.findById(request.getAssignedToId()).orElse(null);
        }

        ProjectTaskEntity task = ProjectTaskEntity.builder()
                .project(project)
                .createdBy(currentUser)
                .title(request.getTitle())
                .description(request.getDescription())
                .assignedTo(assignedTo)
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : africa.afridev.model.enums.TaskPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .completedAt(request.getStatus() == TaskStatus.DONE ? LocalDateTime.now() : null)
                .orderIndex((int) taskRepository.countByProjectId(projectId))
                .build();

        ProjectTaskEntity saved = taskRepository.save(task);
        log.info("[TASK] Tâche créée '{}' sur le projet {}", saved.getTitle(), project.getTitle());
        return mapToTaskDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectTaskDto> getProjectTasks(String projectId, String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return Collections.emptyList();
        }
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable"));

        boolean isLead = project.getAuthor().getEmail().equalsIgnoreCase(userEmail);
        if (!isLead) {
            UserEntity user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null || !memberRepository.existsByProjectIdAndUserIdAndStatus(projectId, user.getId(), MemberStatus.ACCEPTED)) {
                return Collections.emptyList();
            }
        }

        List<ProjectTaskEntity> tasks = taskRepository.findByProjectIdOrderByOrderIndexAscCreatedAtDesc(projectId);
        
        // Règle : Chaque développeur ne voit que les tâches qui lui ont été attribuées
        if (!isLead) {
            tasks = tasks.stream()
                    .filter(t -> t.getAssignedTo() != null && t.getAssignedTo().getEmail().equalsIgnoreCase(userEmail))
                    .collect(Collectors.toList());
        }

        return tasks.stream()
                .map(this::mapToTaskDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectTaskDto> getProjectTasks(String projectId) {
        return getProjectTasks(projectId, null);
    }

    @Transactional
    public ProjectTaskDto updateTask(String projectId, String taskId, String userEmail, TaskUpdateRequest request) {
        ProjectTaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Tâche introuvable"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Cette tâche n'appartient pas au projet spécifié.");
        }

        ProjectEntity project = task.getProject();
        UserEntity currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        boolean isLead = project.getAuthor().getId().equals(currentUser.getId());
        boolean isAssignee = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(currentUser.getId());

        if (!isLead && !isAssignee) {
            throw new IllegalArgumentException("Vous n'êtes pas autorisé à modifier cette tâche.");
        }

        if (isLead) {
            if (request.getTitle() != null && !request.getTitle().isBlank()) {
                task.setTitle(request.getTitle());
            }
            if (request.getDescription() != null) {
                task.setDescription(request.getDescription());
            }
            if (request.getPriority() != null) {
                task.setPriority(request.getPriority());
            }
            if (request.getDueDate() != null) {
                task.setDueDate(request.getDueDate());
            }
            if (request.getOrderIndex() != null) {
                task.setOrderIndex(request.getOrderIndex());
            }
            if (request.getAssignedToId() != null) {
                if (request.getAssignedToId().isBlank()) {
                    task.setAssignedTo(null);
                } else {
                    userRepository.findById(request.getAssignedToId()).ifPresent(task::setAssignedTo);
                }
            }
            if (request.getRejectionReason() != null) {
                task.setRejectionReason(request.getRejectionReason().isBlank() ? null : request.getRejectionReason());
            }
        }

        // Règle de progression des statuts
        if (request.getStatus() != null && request.getStatus() != task.getStatus()) {
            if (!isLead) {
                int currentRank = getStatusRank(task.getStatus());
                int newRank = getStatusRank(request.getStatus());

                // Règle : Le développeur ne peut pas retourner en arrière
                if (newRank < currentRank) {
                    throw new IllegalArgumentException("En tant que développeur, vous ne pouvez pas rétrograder le statut d'une tâche.");
                }

                // Règle : Si le développeur met sur TERMINÉ, elle passe en REVIEW pour vérification du chef de projet
                if (request.getStatus() == TaskStatus.DONE) {
                    task.setStatus(TaskStatus.REVIEW);
                    task.setRejectionReason(null); // Réinitialiser le motif de rejet lors de la nouvelle soumission
                } else {
                    task.setStatus(request.getStatus());
                    if (request.getStatus() == TaskStatus.REVIEW) {
                        task.setRejectionReason(null);
                    }
                }
            } else {
                task.setStatus(request.getStatus());
                if (request.getStatus() == TaskStatus.DONE) {
                    task.setCompletedAt(LocalDateTime.now());
                    task.setRejectionReason(null);
                } else {
                    task.setCompletedAt(null);
                }
            }
        }

        ProjectTaskEntity saved = taskRepository.save(task);
        return mapToTaskDto(saved);
    }

    @Transactional
    public ProjectTaskDto validateTask(String projectId, String taskId, String userEmail) {
        ProjectTaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Tâche introuvable"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Cette tâche n'appartient pas au projet spécifié.");
        }

        ProjectEntity project = task.getProject();
        if (!project.getAuthor().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("Seul le chef de projet peut valider et clôturer une tâche.");
        }

        task.setStatus(TaskStatus.DONE);
        task.setCompletedAt(LocalDateTime.now());
        task.setRejectionReason(null);
        ProjectTaskEntity saved = taskRepository.save(task);
        log.info("[TASK] Tâche '{}' validée et terminée par le chef de projet {}", saved.getTitle(), userEmail);
        return mapToTaskDto(saved);
    }

    @Transactional
    public ProjectTaskDto rejectTask(String projectId, String taskId, String userEmail, String rejectionReason) {
        ProjectTaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Tâche introuvable"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Cette tâche n'appartient pas au projet spécifié.");
        }

        ProjectEntity project = task.getProject();
        if (!project.getAuthor().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("Seul le chef de projet peut rejeter une tâche.");
        }

        if (rejectionReason == null || rejectionReason.trim().isBlank()) {
            throw new IllegalArgumentException("Veuillez indiquer un motif de rejet pour orienter le développeur.");
        }

        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setCompletedAt(null);
        task.setRejectionReason(rejectionReason.trim());
        ProjectTaskEntity saved = taskRepository.save(task);
        log.info("[TASK] Tâche '{}' rejetée par le chef de projet {} avec motif: {}", saved.getTitle(), userEmail, rejectionReason);
        return mapToTaskDto(saved);
    }

    private int getStatusRank(TaskStatus status) {
        if (status == null) return 0;
        return switch (status) {
            case TODO -> 0;
            case IN_PROGRESS -> 1;
            case REVIEW -> 2;
            case DONE -> 3;
        };
    }

    @Transactional
    public void deleteTask(String projectId, String taskId, String userEmail) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable"));

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        ProjectTaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Tâche introuvable"));

        boolean isLead = project.getAuthor().getId().equals(user.getId());
        if (!isLead) {
            throw new IllegalArgumentException("Seul le chef de projet peut supprimer une tâche.");
        }

        taskRepository.delete(task);
        log.info("[TASK] Tâche {} supprimée du projet {}", taskId, projectId);
    }

    // ── SUIVI PROFESSIONNEL DE LA PROGRESSION ─────────────────────────────────

    @Transactional(readOnly = true)
    public ProjectProgressDto getProjectProgress(String projectId, String userEmail) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Projet introuvable"));

        List<ProjectTaskEntity> tasks = taskRepository.findByProjectIdOrderByOrderIndexAscCreatedAtDesc(projectId);
        long total = tasks.size();
        long completed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long review = tasks.stream().filter(t -> t.getStatus() == TaskStatus.REVIEW).count();
        long todo = tasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();

        LocalDate today = LocalDate.now();
        long overdue = tasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE && t.getDueDate() != null && t.getDueDate().isBefore(today))
                .count();

        int percentage = total > 0 ? (int) Math.round(((double) completed / total) * 100) : 0;
        long activeMembers = memberRepository.countByProjectIdAndStatus(projectId, MemberStatus.ACCEPTED) + 1; // +1 pour le lead

        boolean isLead = userEmail != null && project.getAuthor().getEmail().equalsIgnoreCase(userEmail);

        return ProjectProgressDto.builder()
                .projectId(project.getId())
                .projectTitle(project.getTitle())
                .totalTasks(total)
                .completedTasks(completed)
                .inProgressTasks(inProgress)
                .reviewTasks(review)
                .todoTasks(todo)
                .overdueTasks(overdue)
                .completionPercentage(percentage)
                .activeMembersCount(activeMembers)
                .isProjectLead(isLead)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProjectProgressDto> getMyCollaborativeProjectsProgress(String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        List<ProjectEntity> allProjects = projectRepository.findAll();
        return allProjects.stream()
                .filter(p -> p.getProjectType() == africa.afridev.model.enums.ProjectType.COLLABORATIVE)
                .filter(p -> p.getAuthor().getId().equals(user.getId()) || 
                             memberRepository.existsByProjectIdAndUserIdAndStatus(p.getId(), user.getId(), MemberStatus.ACCEPTED))
                .map(p -> getProjectProgress(p.getId(), userEmail))
                .toList();
    }

    // ── MAPPERS ──────────────────────────────────────────────────────────────

    private ProjectMemberDto mapToMemberDto(ProjectMemberEntity entity) {
        String fullName = "Développeur";
        String avatar = null;
        String title = null;
        if (entity.getUser() != null && entity.getUser().getProfile() != null) {
            fullName = entity.getUser().getProfile().getFullName();
            avatar = entity.getUser().getProfile().getAvatarUrl();
            title = entity.getUser().getProfile().getTitle();
        }

        return ProjectMemberDto.builder()
                .id(entity.getId())
                .projectId(entity.getProject().getId())
                .userId(entity.getUser().getId())
                .userName(fullName)
                .userEmail(entity.getUser().getEmail())
                .userAvatar(avatar)
                .userTitle(title)
                .role(entity.getRole())
                .message(entity.getMessage())
                .cvUrl(entity.getCvUrl())
                .status(entity.getStatus())
                .joinedAt(entity.getJoinedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private ProjectTaskDto mapToTaskDto(ProjectTaskEntity entity) {
        String assignedName = null;
        String assignedAvatar = null;
        if (entity.getAssignedTo() != null && entity.getAssignedTo().getProfile() != null) {
            assignedName = entity.getAssignedTo().getProfile().getFullName();
            assignedAvatar = entity.getAssignedTo().getProfile().getAvatarUrl();
        }

        String createdName = "Auteur";
        if (entity.getCreatedBy() != null && entity.getCreatedBy().getProfile() != null) {
            createdName = entity.getCreatedBy().getProfile().getFullName();
        }

        boolean isOverdue = entity.getStatus() != TaskStatus.DONE
                && entity.getDueDate() != null
                && entity.getDueDate().isBefore(LocalDate.now());

        return ProjectTaskDto.builder()
                .id(entity.getId())
                .projectId(entity.getProject().getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .rejectionReason(entity.getRejectionReason())
                .assignedToId(entity.getAssignedTo() != null ? entity.getAssignedTo().getId() : null)
                .assignedToName(assignedName)
                .assignedToAvatar(assignedAvatar)
                .createdById(entity.getCreatedBy() != null ? entity.getCreatedBy().getId() : null)
                .createdByName(createdName)
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .dueDate(entity.getDueDate())
                .isOverdue(isOverdue)
                .completedAt(entity.getCompletedAt())
                .orderIndex(entity.getOrderIndex())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
