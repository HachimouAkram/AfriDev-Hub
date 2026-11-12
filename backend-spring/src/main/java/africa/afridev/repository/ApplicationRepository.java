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
    List<ApplicationEntity> findByOpportunityCompanyIdOrderByCreatedAtDesc(String companyId);
    long countByOpportunityCompanyId(String companyId);
    long countByOpportunityCompanyIdAndStatus(String companyId, africa.afridev.model.enums.ApplicationStatus status);
    long countByApplicantId(String applicantId);

    @org.springframework.data.jpa.repository.Query("SELECT a.opportunity.id FROM ApplicationEntity a WHERE a.applicant.id = :applicantId")
    java.util.Set<String> findAppliedOpportunityIdsByApplicantId(@org.springframework.data.repository.query.Param("applicantId") String applicantId);
}
