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
}
