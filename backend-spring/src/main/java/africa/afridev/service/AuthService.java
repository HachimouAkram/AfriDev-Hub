package africa.afridev.service;

import africa.afridev.dto.auth.*;
import africa.afridev.model.entity.LoginSessionEntity;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.Availability;
import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.UserStatus;
import africa.afridev.repository.LoginSessionRepository;
import africa.afridev.repository.UserRepository;
import africa.afridev.security.DeviceParserUtil;
import africa.afridev.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final OtpService otpService;
    private final EmailService emailService;
    private final LoginSessionRepository loginSessionRepository;
    private final RedisCacheService redisCacheService;
    private final CompanyService companyService;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Un compte existe déjà avec cet adresse email.");
        }

        Role userRole = request.getRole() != null ? request.getRole() : Role.DEVELOPER;

        UserEntity user = UserEntity.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .build();

        ProfileEntity profile = ProfileEntity.builder()
                .user(user)
                .fullName(request.getFullName())
                .country(request.getCountry())
                .city(request.getCity())
                .title(request.getTitle())
                .companyName(request.getCompanyName())
                .bio(request.getBio())
                .skills(request.getSkills() != null ? request.getSkills() : new ArrayList<>())
                .availability(Availability.OPEN)
                .completionScore(60)
                .mobileMoneyVerified(false)
                .build();

        user.setProfile(profile);
        userRepository.save(user);

        // Si le rôle est RECRUTEUR, auto-créer l'entreprise associée
        if (userRole == Role.RECRUITER) {
            try {
                companyService.autoCreateCompanyForRecruiter(
                        user,
                        request.getCompanyName(),
                        request.getCountry(),
                        request.getCity(),
                        request.getBio(),
                        request.getTitle()
                );
                log.info("[AUTH] Entreprise auto-créée pour le recruteur {}", user.getEmail());
            } catch (Exception e) {
                log.error("[AUTH] Erreur lors de la création automatique de l'entreprise pour {} : {}", user.getEmail(), e.getMessage());
            }
        }

        // Envoyer l'OTP de vérification automatiquement
        try {
            otpService.generateAndSaveOtp(request.getEmail());
            log.info("[AUTH] Compte créé, OTP envoyé à {}", request.getEmail());
        } catch (Exception e) {
            log.warn("[AUTH] Compte créé mais OTP non envoyé à {} : {}", request.getEmail(), e.getMessage());
        }

        return RegisterResponse.builder()
                .email(request.getEmail())
                .requiresEmailVerification(true)
                .message("Compte créé avec succès. Vérifiez votre boîte email pour saisir votre code OTP.")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        return login(request, null);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        // 1. Protection Anti-Brute Force : Vérifier si le compte est temporairement bloqué (10 minutes)
        if (redisCacheService.isLoginLocked(email)) {
            long remainingSec = redisCacheService.getLoginLockRemainingSeconds(email);
            long minutes = Math.max(1, (remainingSec + 59) / 60);
            throw new IllegalStateException("COMPTE_TEMPORAIREMENT_BLOQUE: Votre compte a été temporairement désactivé suite à 5 tentatives de mot de passe incorrectes. Veuillez patienter encore " + minutes + " minute(s) avant de réessayer.");
        }

        UserEntity user = userRepository.findByEmail(email)
                .or(() -> request.getEmail() != null ? userRepository.findByEmail(request.getEmail().trim()) : java.util.Optional.empty())
                .orElse(null);
        DeviceParserUtil.DeviceInfo deviceInfo = DeviceParserUtil.parse(httpRequest);

        // 2. Vérification des identifiants (Mot de passe)
        if (user == null || user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Incrémenter les tentatives d'échecs (durée de validité de la fenêtre : 10 minutes)
            long attempts = redisCacheService.incrementFailedLoginAttempts(email, Duration.ofMinutes(10));
            if (attempts >= 5) {
                // Déclencher le verrouillage temporaire pour 10 minutes
                redisCacheService.lockLogin(email, Duration.ofMinutes(10));

                // Envoyer l'email d'alerte sécurité si le compte existe
                if (user != null) {
                    try {
                        emailService.sendAccountLockedEmail(user.getEmail(), 10, deviceInfo.ipAddress(), deviceInfo.deviceName());
                    } catch (Exception e) {
                        log.warn("[SECURITY] Échec d'envoi de l'email d'alerte de verrouillage à {} : {}", user.getEmail(), e.getMessage());
                    }
                }

                throw new IllegalStateException("COMPTE_TEMPORAIREMENT_BLOQUE: Votre compte a été temporairement désactivé suite à 5 tentatives consécutives incorrectes. Un email d'alerte a été envoyé sur votre compte email. Veuillez patienter et réessayer dans 10 minutes.");
            } else {
                long remaining = 5 - attempts;
                throw new IllegalArgumentException("Identifiants invalides (email ou mot de passe incorrect). Attention : il vous reste " + remaining + " tentative(s) avant la désactivation temporaire de votre compte (10 min).");
            }
        }

        // Si le mot de passe est correct, réinitialiser immédiatement le compteur d'échecs
        redisCacheService.clearFailedLoginAttempts(email);

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.BANNED) {
            throw new IllegalStateException("Ce compte est suspendu ou banni.");
        }

        // Bloquer si email non vérifié
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            // Renvoyer l'OTP silencieusement
            try {
                otpService.generateAndSaveOtp(request.getEmail());
            } catch (Exception e) {
                log.warn("[AUTH] Renvoi OTP échoué pour {} : {}", request.getEmail(), e.getMessage());
            }
            throw new IllegalStateException("EMAIL_NOT_VERIFIED");
        }

        // ── Device & 2FA Check ──
        String deviceId = (request.getDeviceId() != null && !request.getDeviceId().isBlank())
                ? request.getDeviceId()
                : "dev_" + Math.abs((deviceInfo.ipAddress() + deviceInfo.deviceName()).hashCode());

        boolean isKnownDevice = loginSessionRepository.existsByUserIdAndDeviceIdAndStatus(user.getId(), deviceId, "ACTIVE");
        boolean requires2fa = Boolean.TRUE.equals(user.getTwoFactorEnabled()) || !isKnownDevice;

        if (requires2fa) {
            String code = otpService.generateAndSaveOtp(user.getEmail());
            try {
                emailService.sendSecurityOtpEmail(user.getEmail(), code, deviceInfo.deviceName(), deviceInfo.ipAddress(), !isKnownDevice);
            } catch (Exception e) {
                log.warn("[AUTH 2FA] Échec envoi email sécurité: {}", e.getMessage());
            }

            String promptMessage = isKnownDevice
                    ? "Authentification à deux facteurs requise. Un code de sécurité à 6 chiffres a été envoyé à votre adresse email."
                    : "Nouvel appareil détecté (" + deviceInfo.deviceName() + "). Un code de sécurité à 6 chiffres a été envoyé à votre adresse email pour confirmer votre identité.";

            return AuthResponse.builder()
                    .twoFactorRequired(true)
                    .email(user.getEmail())
                    .message(promptMessage)
                    .build();
        }

        // Enregistrer la session active de l'appareil
        recordOrUpdateSession(user, deviceId, deviceInfo, httpRequest);

        String token = tokenProvider.generateToken(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
    }

    @Transactional
    public AuthResponse verify2fa(TwoFactorVerifyRequest request, HttpServletRequest httpRequest) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtpCode());
        if (!valid) {
            throw new IllegalArgumentException("Code de sécurité 2FA invalide ou expiré.");
        }

        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.BANNED) {
            throw new IllegalStateException("Ce compte est suspendu ou banni.");
        }

        DeviceParserUtil.DeviceInfo deviceInfo = DeviceParserUtil.parse(httpRequest);
        String deviceId = (request.getDeviceId() != null && !request.getDeviceId().isBlank())
                ? request.getDeviceId()
                : "dev_" + Math.abs((deviceInfo.ipAddress() + deviceInfo.deviceName()).hashCode());

        recordOrUpdateSession(user, deviceId, deviceInfo, httpRequest);

        String token = tokenProvider.generateToken(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
    }

    private void recordOrUpdateSession(UserEntity user, String deviceId, DeviceParserUtil.DeviceInfo deviceInfo, HttpServletRequest httpRequest) {
        LoginSessionEntity session = loginSessionRepository.findByUserIdAndDeviceId(user.getId(), deviceId)
                .orElse(LoginSessionEntity.builder()
                        .user(user)
                        .deviceId(deviceId)
                        .deviceType(deviceInfo.deviceType())
                        .deviceName(deviceInfo.deviceName())
                        .browser(deviceInfo.browser())
                        .operatingSystem(deviceInfo.operatingSystem())
                        .ipAddress(deviceInfo.ipAddress())
                        .userAgent(httpRequest != null ? httpRequest.getHeader("User-Agent") : "")
                        .status("ACTIVE")
                        .build());

        session.setStatus("ACTIVE");
        session.setIpAddress(deviceInfo.ipAddress());
        session.setLastActiveAt(LocalDateTime.now());
        loginSessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public List<LoginSessionDto> getUserSessions(String email, String currentDeviceId) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));

        return loginSessionRepository.findByUserIdOrderByLastActiveAtDesc(user.getId())
                .stream()
                .map(session -> LoginSessionDto.builder()
                        .id(session.getId())
                        .deviceId(session.getDeviceId())
                        .deviceType(session.getDeviceType())
                        .deviceName(session.getDeviceName())
                        .browser(session.getBrowser())
                        .operatingSystem(session.getOperatingSystem())
                        .ipAddress(session.getIpAddress())
                        .location(session.getLocation())
                        .status(session.getStatus())
                        .createdAt(session.getCreatedAt())
                        .lastActiveAt(session.getLastActiveAt())
                        .isCurrent(currentDeviceId != null && currentDeviceId.equals(session.getDeviceId()))
                        .build())
                .toList();
    }

    @Transactional
    public void revokeSession(String email, String sessionId) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));

        LoginSessionEntity session = loginSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable."));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Vous n'êtes pas autorisé à révoquer cette session.");
        }

        session.setStatus("REVOKED");
        loginSessionRepository.save(session);
    }

    @Transactional
    public void revokeOtherSessions(String email, String currentDeviceId) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));

        List<LoginSessionEntity> sessions = loginSessionRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");
        for (LoginSessionEntity s : sessions) {
            if (currentDeviceId == null || !currentDeviceId.equals(s.getDeviceId())) {
                s.setStatus("REVOKED");
                loginSessionRepository.save(s);
            }
        }
    }

    @Transactional
    public UserDto toggleTwoFactor(String email, boolean enabled) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));

        user.setTwoFactorEnabled(enabled);
        userRepository.save(user);
        return mapToUserDto(user);
    }

    public String requestOtp(OtpRequest request) {
        return otpService.generateAndSaveOtp(request.getEmail());
    }

    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtpCode());
        if (!valid) {
            throw new IllegalArgumentException("Code OTP invalide ou expiré.");
        }

        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    // Création automatique lors de la première connexion par OTP
                    UserEntity newUser = UserEntity.builder()
                            .email(request.getEmail())
                            .emailVerified(true)
                            .role(Role.DEVELOPER)
                            .status(UserStatus.ACTIVE)
                            .build();

                    ProfileEntity newProfile = ProfileEntity.builder()
                            .user(newUser)
                            .fullName("Développeur " + request.getEmail().split("@")[0])
                            .country("Sénégal")
                            .city("Dakar")
                            .title("Développeur Full-Stack")
                            .completionScore(40)
                            .build();

                    newUser.setProfile(newProfile);
                    return userRepository.save(newUser);
                });

        // Marquer le compte comme vérifié si ce n'est pas déjà fait
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            user.setEmailVerified(true);
            userRepository.save(user);
            log.info("[AUTH] Email vérifié pour {}", request.getEmail());
        }

        String token = tokenProvider.generateToken(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        String tokenUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken();
        Map<String, Object> payload;
        try {
            payload = restTemplate.getForObject(tokenUrl, Map.class);
        } catch (Exception e) {
            log.error("[AUTH GOOGLE] Échec validation token Google : {}", e.getMessage());
            throw new IllegalArgumentException("Token Google invalide ou expiré.");
        }

        if (payload == null || !payload.containsKey("email")) {
            throw new IllegalArgumentException("Impossible de récupérer l'adresse email depuis Google.");
        }

        String email = (String) payload.get("email");
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");
        String aud = (String) payload.get("aud");

        // Valider l'audience si googleClientId est configuré
        if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals(aud)) {
            log.warn("[AUTH GOOGLE] Audience mismatch: attendu {} mais reçu {}", googleClientId, aud);
            throw new IllegalArgumentException("Token Google non autorisé pour cette application.");
        }

        UserEntity user = userRepository.findByEmail(email)
                .map(existingUser -> {
                    boolean modified = false;
                    if (!Boolean.TRUE.equals(existingUser.getEmailVerified())) {
                        existingUser.setEmailVerified(true);
                        modified = true;
                    }
                    if (existingUser.getProfile() != null && (existingUser.getProfile().getAvatarUrl() == null || existingUser.getProfile().getAvatarUrl().isBlank())) {
                        if (picture != null && !picture.isBlank()) {
                            existingUser.getProfile().setAvatarUrl(picture);
                            modified = true;
                        }
                    }
                    if (modified) {
                        return userRepository.save(existingUser);
                    }
                    return existingUser;
                })
                .orElseGet(() -> {
                    UserEntity newUser = UserEntity.builder()
                            .email(email)
                            .emailVerified(true)
                            .role(Role.DEVELOPER)
                            .status(UserStatus.ACTIVE)
                            .build();

                    ProfileEntity newProfile = ProfileEntity.builder()
                            .user(newUser)
                            .fullName(name != null && !name.isBlank() ? name : "Développeur " + email.split("@")[0])
                            .avatarUrl(picture)
                            .country("Sénégal")
                            .city("Dakar")
                            .title("Développeur")
                            .availability(Availability.OPEN)
                            .skills(new ArrayList<>())
                            .completionScore(60)
                            .mobileMoneyVerified(false)
                            .build();

                    newUser.setProfile(newProfile);
                    return userRepository.save(newUser);
                });

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.BANNED) {
            throw new IllegalStateException("Ce compte est suspendu ou banni.");
        }

        String token = tokenProvider.generateToken(user.getEmail());
        log.info("[AUTH GOOGLE] Connexion Google réussie pour {}", email);

        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));
        return mapToUserDto(user);
    }

    public UserDto mapToUserDto(UserEntity user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .emailVerified(user.getEmailVerified())
                .twoFactorEnabled(Boolean.TRUE.equals(user.getTwoFactorEnabled()))
                .githubId(user.getGithubId())
                .role(user.getRole())
                .status(user.getStatus())
                .profile(user.getProfile() != null ? mapToProfileDto(user.getProfile()) : null)
                .build();
    }

    public ProfileDto mapToProfileDto(ProfileEntity profile) {
        return ProfileDto.builder()
                .id(profile.getId())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .fullName(profile.getFullName())
                .country(profile.getCountry())
                .city(profile.getCity())
                .title(profile.getTitle())
                .bio(profile.getBio())
                .skills(profile.getSkills())
                .languages(profile.getLanguages())
                .yearsExperience(profile.getYearsExperience())
                .availability(profile.getAvailability())
                .hourlyRate(profile.getHourlyRate())
                .githubUrl(profile.getGithubUrl())
                .linkedinUrl(profile.getLinkedinUrl())
                .zindiUrl(profile.getZindiUrl())
                .portfolioUrl(profile.getPortfolioUrl())
                .avatarUrl(profile.getAvatarUrl())
                .bannerUrl(profile.getBannerUrl())
                .cvUrl(profile.getCvUrl())
                .completionScore(profile.getCompletionScore())
                .mobileMoneyVerified(profile.getMobileMoneyVerified())
                .xpPoints(profile.getXpPoints())
                .levelTitle(profile.getLevelTitle())
                .levelNumber(profile.getLevelNumber())
                .isMentor(Boolean.TRUE.equals(profile.getIsMentor()))
                .mentorBio(profile.getMentorBio())
                .mentorHoursPerWeek(profile.getMentorHoursPerWeek())
                .mentorTopics(profile.getMentorTopics())
                .menteesHelpedCount(profile.getMenteesHelpedCount())
                .preferredLanguage(profile.getPreferredLanguage() != null ? profile.getPreferredLanguage() : "fr")
                .whatsappEnabled(Boolean.TRUE.equals(profile.getWhatsappEnabled()))
                .whatsappNumber(profile.getWhatsappNumber())
                .build();
    }
}
