package africa.afridev.repository;

import africa.afridev.model.entity.ProjectEntity;
import africa.afridev.model.enums.ContentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, String> {
    Page<ProjectEntity> findByStatusOrderByCreatedAtDesc(ContentStatus status, Pageable pageable);
    Page<ProjectEntity> findByAuthorIdAndStatus(String authorId, ContentStatus status, Pageable pageable);
}
