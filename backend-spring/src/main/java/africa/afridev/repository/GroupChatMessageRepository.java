package africa.afridev.repository;

import africa.afridev.model.entity.GroupChatMessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupChatMessageRepository extends JpaRepository<GroupChatMessageEntity, String> {

    Page<GroupChatMessageEntity> findByChannelIdOrderByCreatedAtDesc(String channelId, Pageable pageable);

    List<GroupChatMessageEntity> findByChannelIdAndIsPinnedTrueOrderByCreatedAtDesc(String channelId);

    long countByChannelId(String channelId);
}

