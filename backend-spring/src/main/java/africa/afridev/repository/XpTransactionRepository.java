package africa.afridev.repository;

import africa.afridev.model.entity.XpTransactionEntity;
import africa.afridev.model.enums.XpSourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface XpTransactionRepository extends JpaRepository<XpTransactionEntity, String> {
    List<XpTransactionEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    boolean existsByUserIdAndSourceTypeAndSourceId(String userId, XpSourceType sourceType, String sourceId);

    long countByUserIdAndSourceTypeAndCreatedAtAfter(String userId, XpSourceType sourceType, LocalDateTime after);
}
