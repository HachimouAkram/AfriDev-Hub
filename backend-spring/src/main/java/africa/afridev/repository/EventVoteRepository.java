package africa.afridev.repository;

import africa.afridev.model.entity.EventVoteEntity;
import africa.afridev.model.enums.VoteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventVoteRepository extends JpaRepository<EventVoteEntity, String> {
    Optional<EventVoteEntity> findByEventIdAndUserId(String eventId, String userId);
    boolean existsByEventIdAndUserId(String eventId, String userId);
    long countByEventIdAndVoteType(String eventId, VoteType voteType);
}
