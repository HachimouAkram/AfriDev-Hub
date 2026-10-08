package africa.afridev.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisCacheService {

    private final StringRedisTemplate redisTemplate;

    private static final String FOLLOWING_KEY_PREFIX = "user:following:";
    private static final String FOLLOWERS_KEY_PREFIX = "user:followers:";

    public boolean isFollowing(String followerId, String followeeId) {
        if (followerId == null || followeeId == null) return false;
        try {
            String key = FOLLOWING_KEY_PREFIX + followerId;
            Boolean isMember = redisTemplate.opsForSet().isMember(key, followeeId);
            return Boolean.TRUE.equals(isMember);
        } catch (Exception e) {
            log.warn("Erreur d'accès Redis isFollowing, fallback DB: {}", e.getMessage());
            return false;
        }
    }

    public void addFollow(String followerId, String followeeId) {
        if (followerId == null || followeeId == null) return;
        try {
            redisTemplate.opsForSet().add(FOLLOWING_KEY_PREFIX + followerId, followeeId);
            redisTemplate.opsForSet().add(FOLLOWERS_KEY_PREFIX + followeeId, followerId);
        } catch (Exception e) {
            log.warn("Erreur d'écriture Redis addFollow: {}", e.getMessage());
        }
    }

    public void removeFollow(String followerId, String followeeId) {
        if (followerId == null || followeeId == null) return;
        try {
            redisTemplate.opsForSet().remove(FOLLOWING_KEY_PREFIX + followerId, followeeId);
            redisTemplate.opsForSet().remove(FOLLOWERS_KEY_PREFIX + followeeId, followerId);
        } catch (Exception e) {
            log.warn("Erreur d'écriture Redis removeFollow: {}", e.getMessage());
        }
    }

    public long getFollowersCount(String userId) {
        try {
            Long size = redisTemplate.opsForSet().size(FOLLOWERS_KEY_PREFIX + userId);
            return size != null ? size : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public long getFollowingCount(String userId) {
        try {
            Long size = redisTemplate.opsForSet().size(FOLLOWING_KEY_PREFIX + userId);
            return size != null ? size : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public void cacheUserDirectory(String key, String jsonContent, long ttlSeconds) {
        try {
            redisTemplate.opsForValue().set("directory:" + key, jsonContent, Duration.ofSeconds(ttlSeconds));
        } catch (Exception e) {
            log.warn("Erreur mise en cache Redis: {}", e.getMessage());
        }
    }

    public String getCachedUserDirectory(String key) {
        try {
            return redisTemplate.opsForValue().get("directory:" + key);
        } catch (Exception e) {
            return null;
        }
    }
}
