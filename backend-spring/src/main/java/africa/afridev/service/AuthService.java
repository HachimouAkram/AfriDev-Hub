package africa.afridev.service;

import africa.afridev.dto.auth.*;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.Availability;
import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.UserStatus;
import africa.afridev.repository.UserRepository;
import africa.afridev.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final OtpService otpService;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Un compte existe déjà avec cet adresse email.");
        }

        UserEntity user = UserEntity.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.DEVELOPER)
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .build();

        ProfileEntity profile = ProfileEntity.builder()
                .user(user)
                .fullName(request.getFullName())
                .country(request.getCountry())
                .city(request.getCity())
                .title(request.getTitle())
                .bio(request.getBio())
                .skills(request.getSkills() != null ? request.getSkills() : new ArrayList<>())
                .availability(Availability.OPEN)
                .completionScore(60)
                .mobileMoneyVerified(false)
                .build();

        user.setProfile(profile);
        userRepository.save(user);

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

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Identifiants invalides (email ou mot de passe incorrect)."));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Identifiants invalides (email ou mot de passe incorrect).");
        }

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

        String token = tokenProvider.generateToken(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
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
                .build();
    }
}
