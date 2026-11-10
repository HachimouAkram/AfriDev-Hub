package africa.afridev.repository;

import africa.afridev.model.entity.UserResourceProgressEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserResourceProgressRepository extends JpaRepository<UserResourceProgressEntity, String> {
    Optional<UserResourceProgressEntity> findByUserIdAndResourceId(String userId, String resourceId);
    boolean existsByUserIdAndResourceIdAndIsCompletedTrue(String userId, String resourceId);
}

