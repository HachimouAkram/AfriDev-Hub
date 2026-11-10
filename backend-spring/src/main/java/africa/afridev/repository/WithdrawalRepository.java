package africa.afridev.repository;

import africa.afridev.model.entity.WithdrawalEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WithdrawalRepository extends JpaRepository<WithdrawalEntity, String> {
    Page<WithdrawalEntity> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    Optional<WithdrawalEntity> findByReference(String reference);
}

