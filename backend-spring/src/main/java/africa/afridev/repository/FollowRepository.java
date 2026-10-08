package africa.afridev.repository;

import africa.afridev.model.entity.FollowEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<FollowEntity, String> {
    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);
    Optional<FollowEntity> findByFollowerIdAndFollowingId(String followerId, String followingId);
    long countByFollowingId(String followingId); // Number of followers
    long countByFollowerId(String followerId); // Number of following
    List<FollowEntity> findByFollowerId(String followerId);
    List<FollowEntity> findByFollowingId(String followingId);
}
