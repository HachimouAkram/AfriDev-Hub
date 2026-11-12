package africa.afridev.repository;

import africa.afridev.model.entity.TechEventEntity;
import africa.afridev.model.enums.TechEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TechEventRepository extends JpaRepository<TechEventEntity, String> {
    Page<TechEventEntity> findAllByOrderByStartDateAsc(Pageable pageable);
    Page<TechEventEntity> findByTypeOrderByStartDateAsc(TechEventType type, Pageable pageable);
    List<TechEventEntity> findByType(TechEventType type);
    List<TechEventEntity> findByOrganizerId(String organizerId);
    List<TechEventEntity> findByOrganizerIdOrderByStartDateDesc(String organizerId);
    List<TechEventEntity> findByCompanyIdOrderByStartDateDesc(String companyId);
    long countByCompanyId(String companyId);
}
