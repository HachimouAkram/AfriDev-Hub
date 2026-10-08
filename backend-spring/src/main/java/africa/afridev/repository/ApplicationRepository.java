package africa.afridev.repository;

import africa.afridev.model.entity.ApplicationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<ApplicationEntity, String> {
    boolean existsByOpportunityIdAndApplicantId(String opportunityId, String applicantId);
    List<ApplicationEntity> findByOpportunityId(String opportunityId);
    List<ApplicationEntity> findByApplicantIdOrderByCreatedAtDesc(String applicantId);
    List<ApplicationEntity> findByOpportunityPublisherIdOrderByCreatedAtDesc(String publisherId);
}
