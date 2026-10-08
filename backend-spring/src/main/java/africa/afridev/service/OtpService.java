package africa.afridev.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final SecureRandom random = new SecureRandom();
    private static final long OTP_VALIDITY_SECONDS = 600; // 10 minutes

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, Integer> attemptsStorage = new ConcurrentHashMap<>();

    public String generateAndSaveOtp(String email) {
        Integer attempts = attemptsStorage.getOrDefault(email, 0);
        if (attempts >= 3) {
            throw new IllegalStateException("Nombre maximal de demandes d'OTP atteint pour cet email. Réessayez dans 1 heure.");
        }

        int number = 100000 + random.nextInt(900000);
        String code = String.valueOf(number);

        otpStorage.put(email, new OtpData(code, Instant.now().getEpochSecond() + OTP_VALIDITY_SECONDS));
        attemptsStorage.put(email, attempts + 1);

        // Simulation d'envoi d'email
        System.out.println("[OTP SERVICE] Code OTP généré pour " + email + " : " + code);
        return code;
    }

    public boolean verifyOtp(String email, String code) {
        OtpData data = otpStorage.get(email);
        if (data == null) {
            return false;
        }

        if (Instant.now().getEpochSecond() > data.expiresAt()) {
            otpStorage.remove(email);
            return false;
        }

        boolean isValid = data.code().equals(code);
        if (isValid) {
            otpStorage.remove(email);
            attemptsStorage.remove(email);
        }
        return isValid;
    }

    private record OtpData(String code, long expiresAt) {}
}
