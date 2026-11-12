package africa.afridev.repository;

import africa.afridev.model.entity.OpportunityEntity;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.OpportunityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OpportunityRepository extends JpaRepository<OpportunityEntity, String> {
    Page<OpportunityEntity> findByStatusOrderByCreatedAtDesc(ContentStatus status, Pageable pageable);
    Page<OpportunityEntity> findByTypeAndStatusOrderByCreatedAtDesc(OpportunityType type, ContentStatus status, Pageable pageable);
    java.util.List<OpportunityEntity> findByStatus(ContentStatus status);
    java.util.List<OpportunityEntity> findByTypeAndStatus(OpportunityType type, ContentStatus status);
    java.util.List<OpportunityEntity> findByPublisherIdOrderByCreatedAtDesc(String publisherId);
    long countByPublisherId(String publisherId);
    Page<OpportunityEntity> findByCompanyIdAndStatusOrderByCreatedAtDesc(String companyId, ContentStatus status, Pageable pageable);
    java.util.List<OpportunityEntity> findByCompanyIdOrderByCreatedAtDesc(String companyId);
    long countByCompanyId(String companyId);
    long countByCompanyIdAndStatus(String companyId, ContentStatus status);
}
