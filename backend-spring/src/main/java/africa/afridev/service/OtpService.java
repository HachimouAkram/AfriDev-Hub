package africa.afridev.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();
    private static final long OTP_VALIDITY_SECONDS = 600; // 10 minutes

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, AttemptData> attemptsStorage = new ConcurrentHashMap<>();

    public OtpService(EmailService emailService) {
        this.emailService = emailService;
    }

    private static class AttemptData {
        final int count;
        final long resetAt;

        AttemptData(int count, long resetAt) {
            this.count = count;
            this.resetAt = resetAt;
        }
    }

    private static class OtpData {
        final String code;
        final long expiresAt;

        OtpData(String code, long expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    public String generateAndSaveOtp(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new IllegalArgumentException("L'adresse email est requise pour générer l'OTP.");
        }
        String email = rawEmail.trim().toLowerCase();
        long now = Instant.now().getEpochSecond();
        AttemptData attempt = attemptsStorage.get(email);
        if (attempt != null && now < attempt.resetAt && attempt.count >= 20) {
            long remainingMinutes = Math.max(1, (attempt.resetAt - now) / 60);
            throw new IllegalStateException("Nombre maximal de demandes d'OTP atteint pour cet email. Réessayez dans " + remainingMinutes + " minute(s).");
        }

        int newCount = (attempt == null || now >= attempt.resetAt) ? 1 : attempt.count + 1;
        attemptsStorage.put(email, new AttemptData(newCount, now + OTP_VALIDITY_SECONDS));

        int number = 100000 + random.nextInt(900000);
        String code = String.valueOf(number);

        otpStorage.put(email, new OtpData(code, now + OTP_VALIDITY_SECONDS));

        // ── Send OTP via email (Brevo SMTP) ──────────────────────────────────
        log.info("==================================================");
        log.info("🔑 [OTP GÉNÉRÉ] Nouveau code pour {} : {}", email, code);
        log.info("==================================================");

        try {
            emailService.sendOtpEmail(email, code);
            log.info("[OTP] Code envoyé par email avec succès à {}", email);
        } catch (Exception e) {
            log.error("[OTP] Erreur envoi email OTP à {} : {}", email, e.getMessage());
        }

        return code;
    }

    public boolean verifyOtp(String rawEmail, String rawCode) {
        if (rawEmail == null || rawCode == null) {
            return false;
        }
        String email = rawEmail.trim().toLowerCase();
        String code = rawCode.trim();

        OtpData data = otpStorage.get(email);
        if (data == null) {
            log.warn("[OTP VERIFY] Aucun OTP actif trouvé pour l'email {}", email);
            return false;
        }

        if (Instant.now().getEpochSecond() > data.expiresAt) {
            log.warn("[OTP VERIFY] OTP expiré pour l'email {}", email);
            otpStorage.remove(email);
            return false;
        }

        boolean isValid = data.code.equals(code);
        if (isValid) {
            log.info("[OTP VERIFY] OTP valide pour l'email {}", email);
            otpStorage.remove(email);
            attemptsStorage.remove(email);
        } else {
            log.warn("[OTP VERIFY] Code incorrect pour {} : saisi={}, attendu={}", email, code, data.code);
        }
        return isValid;
    }
}
