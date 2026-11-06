package africa.afridev.repository;

import africa.afridev.model.entity.ProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<ProfileEntity, String> {
    Optional<ProfileEntity> findByUserId(String userId);

    List<ProfileEntity> findAllByOrderByXpPointsDescCreatedAtAsc();

    List<ProfileEntity> findTop10ByOrderByXpPointsDescCreatedAtAsc();

    List<ProfileEntity> findTop5ByOrderByXpPointsDescCreatedAtAsc();

    List<ProfileEntity> findByFullNameContainingIgnoreCaseOrTitleContainingIgnoreCaseOrderByXpPointsDesc(String name, String title);

    List<ProfileEntity> findByIsMentorTrueOrderByXpPointsDesc();

    @org.springframework.data.jpa.repository.Query("SELECT p FROM ProfileEntity p WHERE p.isMentor = true " +
           "AND (:country IS NULL OR LOWER(p.country) = LOWER(:country)) " +
           "AND (:query IS NULL OR (LOWER(p.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(p.mentorBio) LIKE LOWER(CONCAT('%', :query, '%')))) " +
           "ORDER BY p.xpPoints DESC")
    org.springframework.data.domain.Page<ProfileEntity> searchMentors(
            @org.springframework.data.repository.query.Param("country") String country,
            @org.springframework.data.repository.query.Param("query") String query,
            org.springframework.data.domain.Pageable pageable);
}
