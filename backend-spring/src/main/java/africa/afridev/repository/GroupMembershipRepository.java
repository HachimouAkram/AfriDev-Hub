package africa.afridev.repository;

import africa.afridev.model.entity.GroupMembershipEntity;
import africa.afridev.model.enums.GroupMemberRole;
import africa.afridev.model.enums.GroupMemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMembershipRepository extends JpaRepository<GroupMembershipEntity, String> {

    Optional<GroupMembershipEntity> findByGroupIdAndUserId(String groupId, String userId);

    boolean existsByGroupIdAndUserIdAndStatus(String groupId, String userId, GroupMemberStatus status);

    Page<GroupMembershipEntity> findByGroupIdAndStatusOrderByRoleAscJoinedAtAsc(
            String groupId, GroupMemberStatus status, Pageable pageable);

    Page<GroupMembershipEntity> findByUserIdAndStatusOrderByJoinedAtDesc(
            String userId, GroupMemberStatus status, Pageable pageable);

    List<GroupMembershipEntity> findByGroupIdAndRoleInAndStatus(
            String groupId, List<GroupMemberRole> roles, GroupMemberStatus status);

    long countByGroupIdAndStatus(String groupId, GroupMemberStatus status);

    void deleteByGroupIdAndUserId(String groupId, String userId);
}
