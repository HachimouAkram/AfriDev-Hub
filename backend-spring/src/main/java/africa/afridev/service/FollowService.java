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
    private final africa.afridev.repository.ProfileRepository profileRepository;
    private final AuthService authService;
    private final RedisCacheService redisCacheService;

    private UserEntity resolveUser(String idOrEmailOrProfileId) {
        return userRepository.findById(idOrEmailOrProfileId)
                .or(() -> userRepository.findByEmail(idOrEmailOrProfileId))
                .or(() -> profileRepository.findById(idOrEmailOrProfileId).map(africa.afridev.model.entity.ProfileEntity::getUser))
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable pour ID: " + idOrEmailOrProfileId));
    }

    @Transactional
    public FollowStatsDto followUser(String currentUserEmail, String targetUserId) {
        UserEntity follower = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur suiveur non trouvé."));

        UserEntity target = resolveUser(targetUserId);

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
            redisCacheService.evictNetworkCache();
            redisCacheService.evictProjectsCache();
            redisCacheService.evictOpportunitiesCache();
            redisCacheService.evictEventsCache();
        }

        return getFollowStats(currentUserEmail, target.getId());
    }

    @Transactional
    public FollowStatsDto unfollowUser(String currentUserEmail, String targetUserId) {
        UserEntity follower = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur suiveur non trouvé."));

        UserEntity target = resolveUser(targetUserId);

        followRepository.findByFollowerIdAndFollowingId(follower.getId(), target.getId())
                .ifPresent(f -> {
                    followRepository.delete(f);
                    redisCacheService.removeFollow(follower.getId(), target.getId());
                    redisCacheService.evictNetworkCache();
                    redisCacheService.evictProjectsCache();
                    redisCacheService.evictOpportunitiesCache();
                    redisCacheService.evictEventsCache();
                });

        return getFollowStats(currentUserEmail, target.getId());
    }

    @Transactional(readOnly = true)
    public FollowStatsDto getFollowStats(String currentUserEmail, String targetUserId) {
        UserEntity target = resolveUser(targetUserId);
        String resolvedTargetId = target.getId();

        long followers = followRepository.countByFollowingId(resolvedTargetId);
        long following = followRepository.countByFollowerId(resolvedTargetId);

        boolean followedByCurrent = false;
        boolean followsCurrentUser = false;
        if (currentUserEmail != null) {
            var currUserOpt = userRepository.findByEmail(currentUserEmail);
            if (currUserOpt.isPresent()) {
                String currId = currUserOpt.get().getId();
                followedByCurrent = followRepository.existsByFollowerIdAndFollowingId(currId, resolvedTargetId);
                followsCurrentUser = followRepository.existsByFollowerIdAndFollowingId(resolvedTargetId, currId);
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
        String resolvedId = resolveUser(userId).getId();
        return followRepository.findByFollowingId(resolvedId).stream()
                .map(f -> authService.mapToUserDto(f.getFollower()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getFollowing(String userId) {
        String resolvedId = resolveUser(userId).getId();
        return followRepository.findByFollowerId(resolvedId).stream()
                .map(f -> authService.mapToUserDto(f.getFollowing()))
                .collect(Collectors.toList());
    }
}
