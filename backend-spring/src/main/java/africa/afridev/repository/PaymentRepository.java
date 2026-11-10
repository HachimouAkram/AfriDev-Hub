package africa.afridev.repository;

import africa.afridev.model.entity.PaymentEntity;
import africa.afridev.model.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, String> {
    Optional<PaymentEntity> findByOrderNumber(String orderNumber);
    Optional<PaymentEntity> findByExternalReference(String externalReference);
    Page<PaymentEntity> findByBuyerId(String buyerId, Pageable pageable);
    Page<PaymentEntity> findBySellerId(String sellerId, Pageable pageable);
    boolean existsByBuyerIdAndTargetIdAndStatus(String buyerId, String targetId, PaymentStatus status);
}

