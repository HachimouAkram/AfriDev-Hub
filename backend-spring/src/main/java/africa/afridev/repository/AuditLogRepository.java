package africa.afridev.repository;

import africa.afridev.model.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, String> {
    Page<AuditLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
