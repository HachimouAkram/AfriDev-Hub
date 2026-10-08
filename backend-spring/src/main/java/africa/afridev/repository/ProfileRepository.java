package africa.afridev.repository;

import africa.afridev.model.entity.ProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<ProfileEntity, String> {
    Optional<ProfileEntity> findByUserId(String userId);
}
