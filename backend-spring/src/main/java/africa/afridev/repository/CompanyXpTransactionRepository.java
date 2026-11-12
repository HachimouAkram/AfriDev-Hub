package africa.afridev.repository;

import africa.afridev.model.entity.CompanyXpTransactionEntity;
import africa.afridev.model.enums.CompanyXpSourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface CompanyXpTransactionRepository extends JpaRepository<CompanyXpTransactionEntity, String> {

    boolean existsByCompanyIdAndSourceTypeAndSourceId(String companyId, CompanyXpSourceType sourceType, String sourceId);

    long countByCompanyIdAndSourceTypeAndCreatedAtAfter(String companyId, CompanyXpSourceType sourceType, LocalDateTime after);

    Page<CompanyXpTransactionEntity> findByCompanyIdOrderByCreatedAtDesc(String companyId, Pageable pageable);
}

