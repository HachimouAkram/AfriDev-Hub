package africa.afridev.repository;

import africa.afridev.model.entity.CompanyActivityLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyActivityLogRepository extends JpaRepository<CompanyActivityLogEntity, String> {

    Page<CompanyActivityLogEntity> findByCompanyIdOrderByCreatedAtDesc(String companyId, Pageable pageable);

    List<CompanyActivityLogEntity> findTop10ByCompanyIdOrderByCreatedAtDesc(String companyId);

    Page<CompanyActivityLogEntity> findByCompanyIdAndActorIdOrderByCreatedAtDesc(
            String companyId,
            String actorId,
            Pageable pageable);
}

