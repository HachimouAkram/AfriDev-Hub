package africa.afridev.repository;

import africa.afridev.model.entity.EvaluationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationRepository extends JpaRepository<EvaluationEntity, String> {
    List<EvaluationEntity> findByEvaluateeIdAndIsPublicTrueOrderByCreatedAtDesc(String evaluateeId);
    List<EvaluationEntity> findByEvaluatorIdOrderByCreatedAtDesc(String evaluatorId);
    boolean existsByEvaluatorIdAndEvaluateeIdAndCollaborationId(String evaluatorId, String evaluateeId, String collaborationId);
    boolean existsByEvaluatorIdAndCollaborationId(String evaluatorId, String collaborationId);
    long countByEvaluateeIdAndIsPublicTrue(String evaluateeId);
}
