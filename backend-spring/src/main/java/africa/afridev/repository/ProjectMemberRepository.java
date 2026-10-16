package africa.afridev.repository;

import africa.afridev.model.entity.ProjectMemberEntity;
import africa.afridev.model.enums.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMemberEntity, String> {
    List<ProjectMemberEntity> findByProjectId(String projectId);
    List<ProjectMemberEntity> findByProjectIdAndStatus(String projectId, MemberStatus status);
    List<ProjectMemberEntity> findByUserId(String userId);
    Optional<ProjectMemberEntity> findByProjectIdAndUserId(String projectId, String userId);
    boolean existsByProjectIdAndUserId(String projectId, String userId);
    boolean existsByProjectIdAndUserIdAndStatus(String projectId, String userId, MemberStatus status);
    long countByProjectIdAndStatus(String projectId, MemberStatus status);
}
