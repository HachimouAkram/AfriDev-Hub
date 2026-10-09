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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final OtpService otpService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
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
                .completionScore(60) // 60% pour la saisie des champs obligatoires
                .mobileMoneyVerified(false)
                .build();

        user.setProfile(profile);

        UserEntity savedUser = userRepository.save(user);
        String token = tokenProvider.generateToken(savedUser.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(savedUser))
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

        String token = tokenProvider.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
    }

    public void requestOtp(OtpRequest request) {
        otpService.generateAndSaveOtp(request.getEmail());
    }

    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtpCode());
        if (!valid) {
            throw new IllegalArgumentException("Code OTP invalide ou expiré.");
        }

        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    // Création automatique de compte lors de la première connexion par OTP
                    UserEntity newUser = UserEntity.builder()
                            .email(request.getEmail())
                            .emailVerified(true)
                            .role(Role.DEVELOPER)
                            .status(UserStatus.ACTIVE)
                            .build();

                    ProfileEntity newProfile = ProfileEntity.builder()
                            .user(newUser)
                            .fullName("Développeur " + request.getEmail().split("@")[0])
                            .country("Sénégal") // Valeur par défaut modifiable dans l'onboarding
                            .city("Dakar")
                            .title("Développeur Full-Stack")
                            .completionScore(40)
                            .build();

                    newUser.setProfile(newProfile);
                    return userRepository.save(newUser);
                });

        String token = tokenProvider.generateToken(user.getEmail());

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
                .completionScore(profile.getCompletionScore())
                .mobileMoneyVerified(profile.getMobileMoneyVerified())
                .build();
    }
}
