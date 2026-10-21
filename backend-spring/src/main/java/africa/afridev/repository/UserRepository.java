package africa.afridev.repository;

import africa.afridev.model.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String>, JpaSpecificationExecutor<UserEntity> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByProfileId(String profileId);
    Optional<UserEntity> findByGithubId(String githubId);
    boolean existsByEmail(String email);
    boolean existsByGithubId(String githubId);

    @Query("SELECT DISTINCT u FROM UserEntity u LEFT JOIN FETCH u.profile")
    List<UserEntity> findAllWithProfile();
}
