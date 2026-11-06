package africa.afridev.repository;

import africa.afridev.model.entity.GroupPostEntity;
import africa.afridev.model.enums.GroupPostType;
import africa.afridev.model.enums.GroupPostVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupPostRepository extends JpaRepository<GroupPostEntity, String> {

    Page<GroupPostEntity> findByGroupIdOrderByIsPinnedDescCreatedAtDesc(String groupId, Pageable pageable);

    Page<GroupPostEntity> findByGroupIdAndVisibilityOrderByIsPinnedDescCreatedAtDesc(
            String groupId, GroupPostVisibility visibility, Pageable pageable);

    Page<GroupPostEntity> findByGroupIdAndTypeOrderByIsPinnedDescCreatedAtDesc(
            String groupId, GroupPostType type, Pageable pageable);

    @Query("SELECT p FROM GroupPostEntity p WHERE p.group.id = :groupId " +
           "AND (:canSeePrivate = true OR p.visibility = 'PUBLIC') " +
           "AND (:type IS NULL OR p.type = :type) " +
           "ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<GroupPostEntity> findGroupFeed(
            @Param("groupId") String groupId,
            @Param("canSeePrivate") boolean canSeePrivate,
            @Param("type") GroupPostType type,
            Pageable pageable);

    List<GroupPostEntity> findByGroupIdAndIsPinnedTrueOrderByCreatedAtDesc(String groupId);

    long countByGroupId(String groupId);
}

