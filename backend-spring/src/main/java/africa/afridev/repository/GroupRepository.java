package africa.afridev.repository;

import africa.afridev.model.entity.GroupEntity;
import africa.afridev.model.enums.GroupAccessType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<GroupEntity, String> {

    Optional<GroupEntity> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByNameIgnoreCase(String name);

    Page<GroupEntity> findByAccessTypeNotOrderByMemberCountDesc(GroupAccessType accessType, Pageable pageable);

    @Query("SELECT g FROM GroupEntity g WHERE g.accessType <> 'PRIVE' " +
           "AND (:country IS NULL OR LOWER(g.country) = LOWER(:country)) " +
           "AND (:query IS NULL OR (LOWER(g.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(g.description) LIKE LOWER(CONCAT('%', :query, '%')))) " +
           "ORDER BY g.memberCount DESC")
    Page<GroupEntity> searchPublicGroups(
            @Param("country") String country,
            @Param("query") String query,
            Pageable pageable);

    @Query("SELECT g FROM GroupEntity g JOIN g.tags t WHERE g.accessType <> 'PRIVE' " +
           "AND LOWER(t) = LOWER(:tag) ORDER BY g.memberCount DESC")
    Page<GroupEntity> findByTag(@Param("tag") String tag, Pageable pageable);

    Page<GroupEntity> findByOwnerIdOrderByCreatedAtDesc(String ownerId, Pageable pageable);
}

