package africa.afridev.repository;

import africa.afridev.model.entity.CompanyMemberEntity;
import africa.afridev.model.enums.CompanyMemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyMemberRepository extends JpaRepository<CompanyMemberEntity, String> {

    Optional<CompanyMemberEntity> findByCompanyIdAndUserId(String companyId, String userId);

    List<CompanyMemberEntity> findByUserIdAndStatus(String userId, CompanyMemberStatus status);

    Optional<CompanyMemberEntity> findFirstByUserIdAndStatusOrderByCreatedAtAsc(String userId, CompanyMemberStatus status);

    Page<CompanyMemberEntity> findByCompanyIdAndStatusOrderByCreatedAtDesc(
            String companyId,
            CompanyMemberStatus status,
            Pageable pageable);

    List<CompanyMemberEntity> findByCompanyId(String companyId);

    long countByCompanyIdAndStatus(String companyId, CompanyMemberStatus status);

    boolean existsByCompanyIdAndUserIdAndStatus(String companyId, String userId, CompanyMemberStatus status);

    void deleteByCompanyIdAndUserId(String companyId, String userId);
}

