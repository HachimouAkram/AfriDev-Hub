package africa.afridev.repository;

import africa.afridev.model.entity.CompanyEntity;
import africa.afridev.model.enums.ContentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<CompanyEntity, String> {

    Optional<CompanyEntity> findBySlug(String slug);

    Optional<CompanyEntity> findByOwnerId(String ownerId);

    boolean existsBySlug(String slug);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByOwnerId(String ownerId);

    Page<CompanyEntity> findByStatusOrderByCompanyXpDesc(ContentStatus status, Pageable pageable);

    @Query("SELECT c FROM CompanyEntity c WHERE c.status = :status " +
           "AND (CAST(:country AS string) IS NULL OR LOWER(c.country) = LOWER(CAST(:country AS string))) " +
           "AND (CAST(:sector AS string) IS NULL OR LOWER(c.sector) = LOWER(CAST(:sector AS string))) " +
           "AND (CAST(:query AS string) IS NULL OR (LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) " +
           "     OR LOWER(c.description) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')))) " +
           "ORDER BY c.companyXp DESC")
    Page<CompanyEntity> searchCompanies(
            @Param("status") ContentStatus status,
            @Param("country") String country,
            @Param("sector") String sector,
            @Param("query") String query,
            Pageable pageable);
}

