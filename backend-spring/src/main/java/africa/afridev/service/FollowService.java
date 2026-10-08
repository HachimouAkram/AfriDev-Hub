package africa.afridev.service;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.follow.FollowStatsDto;
import africa.afridev.model.entity.FollowEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.FollowRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final RedisCacheService redisCacheService;

    @Transactional
    public FollowStatsDto followUser(String currentUserEmail, String targetUserId) {
        UserEntity follower = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur suiveur non trouvé."));

        UserEntity target = userRepository.findById(targetUserId)
                .or(() -> userRepository.findByEmail(targetUserId))
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur cible non trouvé."));

        if (follower.getId().equals(target.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous suivre vous-même.");
        }

        if (!followRepository.existsByFollowerIdAndFollowingId(follower.getId(), target.getId())) {
            FollowEntity follow = FollowEntity.builder()
                    .follower(follower)
                    .following(target)
                    .build();
            followRepository.save(follow);
            redisCacheService.addFollow(follower.getId(), target.getId());
        }

        return getFollowStats(currentUserEmail, targetUserId);
    }

    @Transactional
    public FollowStatsDto unfollowUser(String currentUserEmail, String targetUserId) {
        UserEntity follower = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur suiveur non trouvé."));

        followRepository.findByFollowerIdAndFollowingId(follower.getId(), targetUserId)
                .ifPresent(f -> {
                    followRepository.delete(f);
                    redisCacheService.removeFollow(follower.getId(), targetUserId);
                });

        return getFollowStats(currentUserEmail, targetUserId);
    }

    @Transactional(readOnly = true)
    public FollowStatsDto getFollowStats(String currentUserEmail, String targetUserId) {
        long followers = followRepository.countByFollowingId(targetUserId);
        long following = followRepository.countByFollowerId(targetUserId);

        boolean followedByCurrent = false;
        boolean followsCurrentUser = false;
        if (currentUserEmail != null) {
            var currUserOpt = userRepository.findByEmail(currentUserEmail);
            if (currUserOpt.isPresent()) {
                String currId = currUserOpt.get().getId();
                followedByCurrent = followRepository.existsByFollowerIdAndFollowingId(currId, targetUserId);
                followsCurrentUser = followRepository.existsByFollowerIdAndFollowingId(targetUserId, currId);
            }
        }

        return FollowStatsDto.builder()
                .followersCount(followers)
                .followingCount(following)
                .followedByCurrentUser(followedByCurrent)
                .followsCurrentUser(followsCurrentUser)
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserDto> getFollowers(String userId) {
        return followRepository.findByFollowingId(userId).stream()
                .map(f -> authService.mapToUserDto(f.getFollower()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getFollowing(String userId) {
        return followRepository.findByFollowerId(userId).stream()
                .map(f -> authService.mapToUserDto(f.getFollowing()))
                .collect(Collectors.toList());
    }
}
