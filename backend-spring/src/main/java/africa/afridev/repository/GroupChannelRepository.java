package africa.afridev.repository;

import africa.afridev.model.entity.GroupChannelEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupChannelRepository extends JpaRepository<GroupChannelEntity, String> {

    List<GroupChannelEntity> findByGroupIdOrderByPositionAscCreatedAtAsc(String groupId);

    Optional<GroupChannelEntity> findByGroupIdAndIsDefaultTrue(String groupId);

    boolean existsByGroupIdAndNameIgnoreCase(String groupId, String name);
}
