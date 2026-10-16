package africa.afridev.repository;

import africa.afridev.model.entity.LoginSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoginSessionRepository extends JpaRepository<LoginSessionEntity, String> {

    List<LoginSessionEntity> findByUserIdOrderByLastActiveAtDesc(String userId);

    Optional<LoginSessionEntity> findByUserIdAndDeviceId(String userId, String deviceId);

    List<LoginSessionEntity> findByUserIdAndStatus(String userId, String status);

    boolean existsByUserIdAndDeviceIdAndStatus(String userId, String deviceId, String status);
}
