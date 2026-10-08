package africa.afridev.repository;

import africa.afridev.model.entity.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, String> {

    @Query("SELECT m FROM MessageEntity m WHERE " +
           "(m.sender.id = :user1 AND m.recipient.id = :user2) OR " +
           "(m.sender.id = :user2 AND m.recipient.id = :user1) " +
           "ORDER BY m.createdAt ASC")
    List<MessageEntity> findConversationBetween(@Param("user1") String user1Id, @Param("user2") String user2Id);

    @Query("SELECT DISTINCT m FROM MessageEntity m WHERE m.sender.id = :userId OR m.recipient.id = :userId ORDER BY m.createdAt DESC")
    List<MessageEntity> findAllUserMessages(@Param("userId") String userId);
}
