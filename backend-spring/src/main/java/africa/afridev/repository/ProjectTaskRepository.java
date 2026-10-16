package africa.afridev.repository;

import africa.afridev.model.entity.ProjectTaskEntity;
import africa.afridev.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTaskEntity, String> {
    List<ProjectTaskEntity> findByProjectIdOrderByOrderIndexAscCreatedAtDesc(String projectId);
    List<ProjectTaskEntity> findByProjectIdAndStatus(String projectId, TaskStatus status);
    List<ProjectTaskEntity> findByAssignedToId(String assignedToId);
    long countByProjectId(String projectId);
    long countByProjectIdAndStatus(String projectId, TaskStatus status);
    long countByProjectIdAndStatusNotAndDueDateBefore(String projectId, TaskStatus status, LocalDate date);
}
