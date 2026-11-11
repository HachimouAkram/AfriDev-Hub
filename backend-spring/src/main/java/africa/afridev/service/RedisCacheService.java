package africa.afridev.service;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisCacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

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

    // --- Méthodes génériques de mise en cache avec sérialisation JSON ---

    public <T> void set(String key, T value, Duration ttl) {
        if (key == null || value == null) return;
        try {
            String json = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(key, json, ttl);
        } catch (Exception e) {
            log.warn("Erreur d'enregistrement Redis [clé: {}]: {}", key, e.getMessage());
        }
    }

    public <T> T get(String key, Class<T> clazz) {
        if (key == null) return null;
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) return null;
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            log.warn("Erreur de désérialisation Redis [clé: {}]: {}", key, e.getMessage());
            return null;
        }
    }

    public <T> T get(String key, JavaType javaType) {
        if (key == null) return null;
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) return null;
            return objectMapper.readValue(json, javaType);
        } catch (Exception e) {
            log.warn("Erreur de désérialisation complexe Redis [clé: {}]: {}", key, e.getMessage());
            return null;
        }
    }

    public ObjectMapper getObjectMapper() {
        return this.objectMapper;
    }

    public void delete(String key) {
        if (key == null) return;
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Erreur de suppression Redis [clé: {}]: {}", key, e.getMessage());
        }
    }

    public void evictByPrefix(String prefix) {
        if (prefix == null) return;
        try {
            Set<String> keys = redisTemplate.keys(prefix + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Redis: {} clés purgées avec le préfixe '{}'", keys.size(), prefix);
            }
        } catch (Exception e) {
            log.warn("Erreur de purge Redis pour le préfixe '{}': {}", prefix, e.getMessage());
        }
    }

    public void evictProjectsCache() {
        evictByPrefix("cache:projects:");
    }

    public void evictOpportunitiesCache() {
        evictByPrefix("cache:opportunities:");
    }

    public void evictNetworkCache() {
        evictByPrefix("cache:network:");
    }

    public void evictEventsCache() {
        evictByPrefix("cache:events:");
    }

    public void evictLeaderboardCache() {
        evictByPrefix("cache:leaderboard:");
    }

    public void evictAdminUsersCache() {
        evictByPrefix("cache:admin:users:");
    }

    // --- Gestion du Rate Limiting & Lockout de Connexion (Anti-Brute Force) ---

    private static final String LOGIN_ATTEMPTS_PREFIX = "auth:attempts:";
    private static final String LOGIN_LOCKOUT_PREFIX = "auth:lockout:";

    public boolean isLoginLocked(String email) {
        if (email == null) return false;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(LOGIN_LOCKOUT_PREFIX + email.trim().toLowerCase()));
        } catch (Exception e) {
            log.warn("Erreur vérification verrouillage Redis: {}", e.getMessage());
            return false;
        }
    }

    public long getLoginLockRemainingSeconds(String email) {
        if (email == null) return 0L;
        try {
            Long expire = redisTemplate.getExpire(LOGIN_LOCKOUT_PREFIX + email.trim().toLowerCase());
            return expire != null && expire > 0 ? expire : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public long incrementFailedLoginAttempts(String email, Duration window) {
        if (email == null) return 1L;
        try {
            String key = LOGIN_ATTEMPTS_PREFIX + email.trim().toLowerCase();
            Long attempts = redisTemplate.opsForValue().increment(key);
            if (attempts != null && attempts == 1) {
                redisTemplate.expire(key, window);
            }
            return attempts != null ? attempts : 1L;
        } catch (Exception e) {
            log.warn("Erreur incrément tentatives Redis: {}", e.getMessage());
            return 1L;
        }
    }

    public void lockLogin(String email, Duration lockoutDuration) {
        if (email == null) return;
        try {
            String normEmail = email.trim().toLowerCase();
            redisTemplate.opsForValue().set(LOGIN_LOCKOUT_PREFIX + normEmail, "LOCKED", lockoutDuration);
            redisTemplate.delete(LOGIN_ATTEMPTS_PREFIX + normEmail);
            log.warn("[SECURITY] Compte {} verrouillé pour {} minutes suite à trop d'échecs", normEmail, lockoutDuration.toMinutes());
        } catch (Exception e) {
            log.warn("Erreur verrouillage Redis: {}", e.getMessage());
        }
    }

    public void clearFailedLoginAttempts(String email) {
        if (email == null) return;
        try {
            String normEmail = email.trim().toLowerCase();
            redisTemplate.delete(LOGIN_ATTEMPTS_PREFIX + normEmail);
            redisTemplate.delete(LOGIN_LOCKOUT_PREFIX + normEmail);
        } catch (Exception e) {
            log.warn("Erreur nettoyage tentatives Redis: {}", e.getMessage());
        }
    }
}
