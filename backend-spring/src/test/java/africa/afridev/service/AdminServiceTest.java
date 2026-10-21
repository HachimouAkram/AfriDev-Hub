package africa.afridev.service;

import africa.afridev.dto.admin.*;
import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.project.ProjectDto;
import africa.afridev.model.entity.AuditLogEntity;
import africa.afridev.model.entity.ProfileEntity;
import africa.afridev.model.entity.ProjectEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.UserStatus;
import africa.afridev.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private EvaluationRepository evaluationRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AuthService authService;

    @Mock
    private EmailService emailService;

    @Mock
    private RedisCacheService redisCacheService;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private AdminService adminService;

    private UserEntity adminUser;
    private UserEntity regularUser;
    private ProfileEntity regularProfile;
    private ProjectEntity mockProject;

    @BeforeEach
    void setUp() {
        adminUser = UserEntity.builder()
                .id("admin-id")
                .email("hachimouisidk@groupeisi.com")
                .role(Role.SUPER_ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        regularProfile = ProfileEntity.builder()
                .fullName("Amadou Ba")
                .country("Sénégal")
                .title("Fullstack Developer")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        regularUser = UserEntity.builder()
                .id("user-id")
                .email("amadou@dev.africa")
                .role(Role.DEVELOPER)
                .status(UserStatus.ACTIVE)
                .profile(regularProfile)
                .build();

        regularProfile.setUser(regularUser);

        mockProject = ProjectEntity.builder()
                .id("project-id")
                .title("AfriHealth IA")
                .author(regularUser)
                .status(ContentStatus.PUBLISHED)
                .build();
    }

    @Test
    @DisplayName("getCountryAdoptionStats: retourne le cache Redis lorsqu'il est présent")
    void getCountryAdoptionStats_CacheHit() {
        PlatformAdoptionSummaryDto cached = PlatformAdoptionSummaryDto.builder()
                .activeCountriesCount(5)
                .totalContinentalUsers(120)
                .countries(List.of(
                        CountryAdoptionStatsDto.builder().country("Sénégal").userCount(50L).build()
                ))
                .build();

        when(redisCacheService.get(eq("admin:analytics:countries"), eq(PlatformAdoptionSummaryDto.class)))
                .thenReturn(cached);

        PlatformAdoptionSummaryDto result = adminService.getCountryAdoptionStats();

        assertNotNull(result);
        assertEquals(5, result.getActiveCountriesCount());
        assertEquals("Sénégal", result.getCountries().get(0).getCountry());
        verify(userRepository, never()).findAll();
    }

    @Test
    @DisplayName("getCountryAdoptionStats: calcule et met en cache lorsque le cache est vide")
    void getCountryAdoptionStats_CacheMiss() {
        when(redisCacheService.get(eq("admin:analytics:countries"), eq(PlatformAdoptionSummaryDto.class)))
                .thenReturn(null);

        when(userRepository.count()).thenReturn(1L);
        when(projectRepository.count()).thenReturn(1L);
        when(opportunityRepository.count()).thenReturn(0L);
        when(profileRepository.findAll()).thenReturn(List.of(regularProfile));
        when(projectRepository.countByAuthorId("user-id")).thenReturn(1L);
        when(opportunityRepository.countByPublisherId("user-id")).thenReturn(0L);

        PlatformAdoptionSummaryDto result = adminService.getCountryAdoptionStats();

        assertNotNull(result);
        assertEquals(1, result.getActiveCountriesCount());
        assertEquals(1, result.getCountries().size());
        assertEquals("Sénégal", result.getCountries().get(0).getCountry());

        verify(redisCacheService, times(1)).set(eq("admin:analytics:countries"), any(PlatformAdoptionSummaryDto.class), any(Duration.class));
    }

    @Test
    @DisplayName("getAdminUsers: récupère une page d'utilisateurs avec spécification de recherche")
    @SuppressWarnings("unchecked")
    void getAdminUsers_Success() {
        Page<UserEntity> userPage = new PageImpl<>(List.of(regularUser), PageRequest.of(0, 10), 1);
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(userPage);
        when(projectRepository.countByAuthorId("user-id")).thenReturn(3L);
        when(opportunityRepository.countByPublisherId("user-id")).thenReturn(0L);
        when(reportRepository.countByResourceId("user-id")).thenReturn(0L);

        Page<UserAdminDto> result = adminService.getAdminUsers("Amadou", "Sénégal", Role.DEVELOPER, UserStatus.ACTIVE, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        UserAdminDto dto = result.getContent().get(0);
        assertEquals("user-id", dto.getId());
        assertEquals("amadou@dev.africa", dto.getEmail());
        assertEquals("Sénégal", dto.getCountry());
        assertEquals(3L, dto.getProjectsCount());
    }

    @Test
    @DisplayName("updateUserStatus: suspend un compte utilisateur et déclenche l'email + audit log")
    void updateUserStatus_Success() {
        UserStatusUpdateRequest request = new UserStatusUpdateRequest();
        request.setStatus(UserStatus.SUSPENDED);
        request.setReason("Non-respect répété des conditions de publication");

        UserDto expectedUserDto = UserDto.builder()
                .id("user-id")
                .status(UserStatus.SUSPENDED)
                .build();

        when(userRepository.findByEmail("hachimouisidk@groupeisi.com")).thenReturn(Optional.of(adminUser));
        when(userRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(authService.mapToUserDto(any(UserEntity.class))).thenReturn(expectedUserDto);

        UserDto result = adminService.updateUserStatus("hachimouisidk@groupeisi.com", "user-id", request);

        assertNotNull(result);
        assertEquals(UserStatus.SUSPENDED, result.getStatus());
        verify(emailService, times(1)).sendAccountSanctionEmail(eq("amadou@dev.africa"), any(), eq("SUSPENDED"), eq(request.getReason()));
        verify(auditLogRepository, times(1)).save(any(AuditLogEntity.class));
        verify(redisCacheService, times(1)).evictNetworkCache();
        verify(redisCacheService, times(1)).evictByPrefix("admin:analytics:countries");
        verify(redisCacheService, times(1)).evictAdminUsersCache();
    }

    @Test
    @DisplayName("updateUserStatus: empêche un administrateur de modifier son propre statut")
    void updateUserStatus_SelfModification_ThrowsException() {
        UserStatusUpdateRequest request = new UserStatusUpdateRequest();
        request.setStatus(UserStatus.SUSPENDED);

        when(userRepository.findByEmail("hachimouisidk@groupeisi.com")).thenReturn(Optional.of(adminUser));

        assertThrows(IllegalArgumentException.class, () ->
                adminService.updateUserStatus("hachimouisidk@groupeisi.com", "admin-id", request)
        );

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendAccountSanctionEmail(any(), any(), any(), any());
    }

    @Test
    @DisplayName("moderateProject: gèle un projet en cas d'infraction/plagiat avec notification email")
    void moderateProject_Success() {
        ProjectModerateRequest request = new ProjectModerateRequest();
        request.setStatus(ContentStatus.HIDDEN);
        request.setReason("Suspicion avérée de plagiat de code propriétaire");

        ProjectDto projectDto = ProjectDto.builder()
                .id("project-id")
                .title("AfriHealth IA")
                .status(ContentStatus.HIDDEN)
                .build();

        when(userRepository.findByEmail("hachimouisidk@groupeisi.com")).thenReturn(Optional.of(adminUser));
        when(projectRepository.findById("project-id")).thenReturn(Optional.of(mockProject));
        when(projectRepository.save(any(ProjectEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(projectService.mapToProjectDto(any(ProjectEntity.class), any())).thenReturn(projectDto);

        ProjectDto result = adminService.moderateProject("hachimouisidk@groupeisi.com", "project-id", request);

        assertNotNull(result);
        assertEquals(ContentStatus.HIDDEN, mockProject.getStatus());
        verify(emailService, times(1)).sendProjectModerationEmail(
                eq("amadou@dev.africa"),
                any(),
                eq("AfriHealth IA"),
                eq("HIDDEN"),
                eq(request.getReason())
        );
        verify(auditLogRepository, times(1)).save(any(AuditLogEntity.class));
        verify(redisCacheService, times(1)).evictProjectsCache();
    }

    @Test
    @DisplayName("getAdminUsers: retourne le résultat depuis le cache Redis lorsqu'il existe")
    void getAdminUsers_ReturnsCachedData() {
        Pageable pageable = PageRequest.of(0, 10);
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        when(redisCacheService.getObjectMapper()).thenReturn(mapper);

        UserAdminDto dto = UserAdminDto.builder()
                .id("cached-id")
                .email("cached@dev.africa")
                .role(Role.DEVELOPER)
                .status(UserStatus.ACTIVE)
                .build();
        africa.afridev.dto.PagedResult<UserAdminDto> pagedResult = africa.afridev.dto.PagedResult.<UserAdminDto>builder()
                .content(List.of(dto))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .build();

        when(redisCacheService.get(anyString(), any(com.fasterxml.jackson.databind.JavaType.class)))
                .thenReturn(pagedResult);

        Page<UserAdminDto> result = adminService.getAdminUsers(null, null, null, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("cached@dev.africa", result.getContent().get(0).getEmail());
        verify(userRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }
}
