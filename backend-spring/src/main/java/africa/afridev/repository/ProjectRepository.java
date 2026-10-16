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
    Page<ProjectEntity> findByStatusAndProjectTypeOrderByCreatedAtDesc(ContentStatus status, africa.afridev.model.enums.ProjectType projectType, Pageable pageable);
    java.util.List<ProjectEntity> findByStatus(ContentStatus status);
    java.util.List<ProjectEntity> findByStatusAndProjectType(ContentStatus status, africa.afridev.model.enums.ProjectType projectType);
    Page<ProjectEntity> findByAuthorIdAndStatus(String authorId, ContentStatus status, Pageable pageable);
    Page<ProjectEntity> findByAuthorIdOrderByCreatedAtDesc(String authorId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM ProjectEntity p " +
           "LEFT JOIN ProjectMemberEntity m ON m.project = p AND m.status = africa.afridev.model.enums.MemberStatus.ACCEPTED AND m.user.id = :userId " +
           "WHERE p.author.id = :userId OR m.user.id = :userId " +
           "ORDER BY p.createdAt DESC")
    Page<ProjectEntity> findMyProjects(@org.springframework.data.repository.query.Param("userId") String userId, Pageable pageable);
}
