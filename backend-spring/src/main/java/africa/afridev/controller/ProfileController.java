package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.auth.ProfileDto;
import africa.afridev.dto.profile.GithubSyncRequest;
import africa.afridev.dto.profile.ProfileUpdateRequest;
import africa.afridev.model.enums.Availability;
import africa.afridev.service.ProfileService;
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
}
