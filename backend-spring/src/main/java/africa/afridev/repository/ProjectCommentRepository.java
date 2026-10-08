package africa.afridev.repository;

import africa.afridev.model.entity.ProjectCommentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectCommentRepository extends JpaRepository<ProjectCommentEntity, String> {
    List<ProjectCommentEntity> findByProjectIdOrderByCreatedAtAsc(String projectId);
    Page<ProjectCommentEntity> findByProjectIdOrderByCreatedAtDesc(String projectId, Pageable pageable);
    long countByProjectId(String projectId);
}
