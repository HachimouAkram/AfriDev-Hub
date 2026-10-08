package africa.afridev.repository;

import africa.afridev.model.entity.ReportEntity;
import africa.afridev.model.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<ReportEntity, String> {
    Page<ReportEntity> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);
}
