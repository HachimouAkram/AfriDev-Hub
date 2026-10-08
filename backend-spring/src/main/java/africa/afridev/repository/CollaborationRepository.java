package africa.afridev.repository;

import africa.afridev.model.entity.CollaborationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollaborationRepository extends JpaRepository<CollaborationEntity, String> {
    List<CollaborationEntity> findByInitiatorIdOrPartnerId(String initiatorId, String partnerId);
}
