package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.auth.*;
import africa.afridev.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/email/request-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> requestOtp(@Valid @RequestBody OtpRequest request) {
        authService.requestOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "message", "Code OTP généré et envoyé avec succès. Valable 10 minutes."
        )));
    }

    @PostMapping("/email/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Vous devez être connecté pour accéder à cette ressource."));
        }
        UserDto currentUser = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(currentUser));
    }
}
