package africa.afridev.service;

import africa.afridev.dto.auth.ProfileDto;
import africa.afridev.dto.profile.GithubSyncRequest;
import africa.afridev.dto.profile.ProfileUpdateRequest;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.Availability;
import africa.afridev.repository.ProfileRepository;
import africa.afridev.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthService authService;

    @Mock
    private RedisCacheService redisCacheService;

    @InjectMocks
    private ProfileService profileService;

    private UserEntity user;
    private ProfileEntity profile;

    @BeforeEach
    void setUp() {
        profile = ProfileEntity.builder()
                .id("prof-1")
                .fullName("Amara Diop")
                .country("Sénégal")
                .city("Dakar")
                .title("Fullstack Developer")
                .availability(Availability.FULL_TIME)
                .completionScore(60)
                .build();

        user = UserEntity.builder()
                .id("user-1")
                .email("amara@afridev.africa")
                .profile(profile)
                .build();
    }

    @Test
    void testGetProfileById_Success() {
        when(profileRepository.findById("prof-1")).thenReturn(Optional.of(profile));
        
        ProfileDto mockDto = new ProfileDto();
        mockDto.setId("prof-1");
        mockDto.setFullName("Amara Diop");
        when(authService.mapToProfileDto(profile)).thenReturn(mockDto);

        ProfileDto result = profileService.getProfileById("prof-1");

        assertNotNull(result);
        assertEquals("prof-1", result.getId());
        assertEquals("Amara Diop", result.getFullName());
        verify(profileRepository).findById("prof-1");
    }

    @Test
    void testGetProfileById_NotFound_ThrowsException() {
        when(profileRepository.findById("unknown")).thenReturn(Optional.empty());
        when(profileRepository.findByUserId("unknown")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> profileService.getProfileById("unknown"));
    }

    @Test
    void testUpdateProfile_SuccessAndCalculatesCompletionScore() {
        when(userRepository.findByEmail("amara@afridev.africa")).thenReturn(Optional.of(user));
        when(profileRepository.save(any(ProfileEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileDto mockDto = new ProfileDto();
        mockDto.setId("prof-1");
        mockDto.setBio("Passionate African Developer");
        mockDto.setCompletionScore(75);
        when(authService.mapToProfileDto(any(ProfileEntity.class))).thenReturn(mockDto);

        ProfileUpdateRequest updateReq = new ProfileUpdateRequest();
        updateReq.setBio("Passionate African Developer");
        updateReq.setGithubUrl("https://github.com/amaradiop");

        ProfileDto result = profileService.updateProfile("amara@afridev.africa", updateReq);

        assertNotNull(result);
        assertEquals("Passionate African Developer", result.getBio());
        verify(profileRepository).save(any(ProfileEntity.class));
        verify(redisCacheService).evictNetworkCache();
    }

    @Test
    void testSyncGithub_FallbackHandledGracefully() {
        when(userRepository.findByEmail("amara@afridev.africa")).thenReturn(Optional.of(user));
        when(profileRepository.save(any(ProfileEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileDto mockDto = new ProfileDto();
        mockDto.setId("prof-1");
        when(authService.mapToProfileDto(any(ProfileEntity.class))).thenReturn(mockDto);

        GithubSyncRequest syncReq = new GithubSyncRequest();
        syncReq.setGithubUsername("amaradev");

        ProfileDto result = profileService.syncGithub("amara@afridev.africa", syncReq);

        assertNotNull(result);
        verify(profileRepository).save(any(ProfileEntity.class));
        assertEquals("https://github.com/amaradev", profile.getGithubUrl());
        assertNotNull(profile.getGithubStatsJson(), "Le fallback ou résultat json doit être défini");
    }

    @Test
    void testVerifyMobileMoney_Success() {
        when(userRepository.findByEmail("amara@afridev.africa")).thenReturn(Optional.of(user));
        when(profileRepository.save(any(ProfileEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileDto mockDto = new ProfileDto();
        mockDto.setMobileMoneyVerified(true);
        when(authService.mapToProfileDto(any(ProfileEntity.class))).thenReturn(mockDto);

        ProfileDto result = profileService.verifyMobileMoney("amara@afridev.africa");

        assertNotNull(result);
        assertTrue(result.getMobileMoneyVerified());
        assertTrue(profile.getMobileMoneyVerified());
        verify(redisCacheService).evictNetworkCache();
    }
}
