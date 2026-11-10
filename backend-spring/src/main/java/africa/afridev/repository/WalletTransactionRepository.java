package africa.afridev.repository;

import africa.afridev.model.entity.WalletTransactionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransactionEntity, String> {
    Page<WalletTransactionEntity> findByWalletIdOrderByCreatedAtDesc(String walletId, Pageable pageable);
}

