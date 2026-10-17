package africa.afridev.service;

import africa.afridev.dto.auth.AuthResponse;
import africa.afridev.dto.auth.LoginRequest;
import africa.afridev.dto.auth.RegisterRequest;
import africa.afridev.dto.auth.RegisterResponse;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.UserStatus;
import africa.afridev.repository.UserRepository;
import africa.afridev.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import africa.afridev.repository.LoginSessionRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private OtpService otpService;

    @Mock
    private EmailService emailService;

    @Mock
    private LoginSessionRepository loginSessionRepository;

    @InjectMocks
    private AuthService authService;


    private UserEntity mockUser;

    @BeforeEach
    void setUp() {
        mockUser = UserEntity.builder()
                .id("user-123")
                .email("test@afridev.africa")
                .passwordHash("hashed_pass")
                .role(Role.DEVELOPER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build();
    }

    @Test
    void testRegister_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@afridev.africa");
        request.setPassword("password123");
        request.setFullName("Cheikh Anta");
        request.setCountry("Sénégal");
        request.setCity("Dakar");
        request.setTitle("Backend Engineer");

        when(userRepository.existsByEmail("new@afridev.africa")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encoded_pass");
        when(userRepository.save(any())).thenReturn(mockUser);
        // OTP generation may be called but we ignore its result (mock returns nothing by default)

        RegisterResponse response = authService.register(request);

        assertNotNull(response);
        assertTrue(response.isRequiresEmailVerification());
        assertEquals("new@afridev.africa", response.getEmail());
        verify(userRepository, times(1)).save(any());
    }

    @Test
    void testLogin_Success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@afridev.africa");
        request.setPassword("password123");

        when(userRepository.findByEmail("test@afridev.africa")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("password123", "hashed_pass")).thenReturn(true);
        when(loginSessionRepository.existsByUserIdAndDeviceIdAndStatus(any(), any(), eq("ACTIVE"))).thenReturn(true);
        when(tokenProvider.generateToken("test@afridev.africa")).thenReturn("mocked_jwt_token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mocked_jwt_token", response.getToken());

    }

    @Test
    void testLogin_InvalidPassword_ThrowsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@afridev.africa");
        request.setPassword("wrong_password");

        when(userRepository.findByEmail("test@afridev.africa")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrong_password", "hashed_pass")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
    }

    @Test
    void testLogin_EmailNotVerified_ThrowsException() {
        mockUser.setEmailVerified(false);
        LoginRequest request = new LoginRequest();
        request.setEmail("test@afridev.africa");
        request.setPassword("password123");

        when(userRepository.findByEmail("test@afridev.africa")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("password123", "hashed_pass")).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> authService.login(request));
    }
}
