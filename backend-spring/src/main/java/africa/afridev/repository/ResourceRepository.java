package africa.afridev.repository;

import africa.afridev.model.entity.ResourceEntity;
import africa.afridev.model.enums.ResourceType;
import africa.afridev.model.enums.SkillLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends JpaRepository<ResourceEntity, String> {

    @Query("SELECT r FROM ResourceEntity r WHERE " +
           "(:type IS NULL OR r.type = :type) AND " +
           "(:level IS NULL OR r.level = :level) AND " +
           "(CAST(:tech AS string) IS NULL OR LOWER(r.technology) LIKE LOWER(CONCAT('%', CAST(:tech AS string), '%'))) AND " +
           "(CAST(:lang AS string) IS NULL OR r.language = CAST(:lang AS string)) AND " +
           "(:isPaid IS NULL OR r.isPaid = :isPaid) " +
           "ORDER BY r.createdAt DESC")
    Page<ResourceEntity> searchResources(
            @Param("type") ResourceType type,
            @Param("level") SkillLevel level,
            @Param("tech") String tech,
            @Param("lang") String lang,
            @Param("isPaid") Boolean isPaid,
            Pageable pageable
    );
}

