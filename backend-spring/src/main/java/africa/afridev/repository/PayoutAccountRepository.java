package africa.afridev.repository;

import africa.afridev.model.entity.PayoutAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayoutAccountRepository extends JpaRepository<PayoutAccountEntity, String> {
    List<PayoutAccountEntity> findByUserId(String userId);
    Optional<PayoutAccountEntity> findByUserIdAndIsDefaultTrue(String userId);
}

