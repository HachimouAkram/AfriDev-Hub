package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.auth.ProfileDto;
import africa.afridev.dto.profile.GithubSyncRequest;
import africa.afridev.dto.profile.ProfileUpdateRequest;
import africa.afridev.model.enums.Availability;
import africa.afridev.service.ProfileService;
import africa.afridev.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final AuthService authService;
    private final africa.afridev.service.UserAccountDeletionService userAccountDeletionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProfileDto>>> getAllProfiles(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) Availability availability,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ProfileDto> profiles = profileService.getAllProfiles(country, skill, availability, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(profiles, Map.of("page", page, "perPage", size, "total", profiles.getTotalElements())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProfileDto>> getProfileById(@PathVariable String id) {
        ProfileDto profile = profileService.getProfileById(id);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<ProfileDto>> updateProfile(
            Authentication authentication,
            @RequestBody ProfileUpdateRequest request
    ) {
        ProfileDto updatedProfile = profileService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(updatedProfile));
    }

    @PostMapping("/me/sync-github")
    public ResponseEntity<ApiResponse<ProfileDto>> syncGithub(
            Authentication authentication,
            @Valid @RequestBody GithubSyncRequest request
    ) {
        ProfileDto syncedProfile = profileService.syncGithub(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(syncedProfile));
    }

    @PostMapping("/me/verify-mobile-money")
    public ResponseEntity<ApiResponse<ProfileDto>> verifyMobileMoney(Authentication authentication) {
        ProfileDto verifiedProfile = profileService.verifyMobileMoney(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(verifiedProfile));
    }

    // ── GESTION DES SESSIONS ET SÉCURITÉ 2FA ──

    @GetMapping("/me/security/sessions")
    public ResponseEntity<ApiResponse<java.util.List<africa.afridev.dto.auth.LoginSessionDto>>> getSessions(
            Authentication authentication,
            @RequestHeader(value = "X-Device-Id", required = false) String currentDeviceId
    ) {
        java.util.List<africa.afridev.dto.auth.LoginSessionDto> sessions = authService.getUserSessions(authentication.getName(), currentDeviceId);
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    @DeleteMapping("/me/security/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> revokeSession(
            Authentication authentication,
            @PathVariable String sessionId
    ) {
        authService.revokeSession(authentication.getName(), sessionId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Session révoquée avec succès")));
    }

    @DeleteMapping("/me/security/sessions/other")
    public ResponseEntity<ApiResponse<Map<String, String>>> revokeOtherSessions(
            Authentication authentication,
            @RequestHeader(value = "X-Device-Id", required = false) String currentDeviceId
    ) {
        authService.revokeOtherSessions(authentication.getName(), currentDeviceId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Toutes les autres sessions ont été déconnectées avec succès")));
    }

    @PutMapping("/me/security/2fa")
    public ResponseEntity<ApiResponse<africa.afridev.dto.auth.UserDto>> toggleTwoFactor(
            Authentication authentication,
            @Valid @RequestBody africa.afridev.dto.auth.TwoFactorToggleRequest request
    ) {
        africa.afridev.dto.auth.UserDto updatedUser = authService.toggleTwoFactor(authentication.getName(), request.getEnabled());
        return ResponseEntity.ok(ApiResponse.ok(updatedUser));
    }

    // ── SUPPRESSION DU COMPTE (ZONE DE DANGER) ──

    @GetMapping("/me/deletion-impact")
    public ResponseEntity<ApiResponse<africa.afridev.dto.auth.AccountDeletionImpactDto>> getDeletionImpact(
            Authentication authentication
    ) {
        africa.afridev.dto.auth.AccountDeletionImpactDto impact = userAccountDeletionService.getDeletionImpact(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(impact));
    }

    @PostMapping("/me/delete-account")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteAccountPost(
            Authentication authentication,
            @RequestBody(required = false) africa.afridev.dto.auth.DeleteAccountRequest request
    ) {
        userAccountDeletionService.deleteAccount(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Votre compte et toutes les données associées ont été supprimés avec succès.")));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteAccount(
            Authentication authentication,
            @RequestBody(required = false) africa.afridev.dto.auth.DeleteAccountRequest request
    ) {
        userAccountDeletionService.deleteAccount(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Votre compte et toutes les données associées ont été supprimés avec succès.")));
    }
}
