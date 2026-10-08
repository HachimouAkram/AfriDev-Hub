package africa.afridev.repository;

import africa.afridev.model.entity.RecognitionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecognitionRepository extends JpaRepository<RecognitionEntity, String> {
    boolean existsByProjectIdAndUserId(String projectId, String userId);
    Optional<RecognitionEntity> findByProjectIdAndUserId(String projectId, String userId);
    void deleteByProjectIdAndUserId(String projectId, String userId);
}
