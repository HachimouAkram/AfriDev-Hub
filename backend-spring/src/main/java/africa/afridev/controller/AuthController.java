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
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            AuthResponse response = authService.login(request, httpRequest);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (IllegalStateException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if ("EMAIL_NOT_VERIFIED".equals(msg)) {
                // Retourner un code spécifique que le frontend peut détecter
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("EMAIL_NOT_VERIFIED",
                                "Votre email n'est pas encore vérifié. Un nouveau code OTP vient d'être envoyé à votre adresse."));
            }
            if (msg.startsWith("COMPTE_TEMPORAIREMENT_BLOQUE:")) {
                String cleanMsg = msg.substring("COMPTE_TEMPORAIREMENT_BLOQUE:".length()).trim();
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(ApiResponse.error("COMPTE_TEMPORAIREMENT_BLOQUE", cleanMsg));
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FORBIDDEN", msg));
        }
    }

    @PostMapping("/login/verify-2fa")
    public ResponseEntity<ApiResponse<AuthResponse>> verify2fa(@Valid @RequestBody TwoFactorVerifyRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        AuthResponse response = authService.verify2fa(request, httpRequest);
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

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        AuthResponse response = authService.loginWithGoogle(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/github")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGithub(@Valid @RequestBody GithubAuthRequest request) {
        AuthResponse response = authService.loginWithGithub(request);
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

    @PostMapping("/change-initial-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> changeInitialPassword(
            Authentication authentication,
            @Valid @RequestBody ChangeInitialPasswordRequest request
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Non authentifié."));
        }
        authService.changeInitialPassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Mot de passe mis à jour avec succès.")));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request);
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "message", "Un code de réinitialisation de sécurité a été envoyé à votre adresse email."
            )));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("EMAIL_NOT_FOUND", e.getMessage()));
        }
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        try {
            authService.verifyResetCode(request.getEmail(), request.getOtpCode());
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "message", "Code validé avec succès."
            )));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("INVALID_OTP", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "message", "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter."
            )));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("INVALID_REQUEST", e.getMessage()));
        }
    }
}
