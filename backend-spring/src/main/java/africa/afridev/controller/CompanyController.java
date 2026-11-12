package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.PagedResult;
import africa.afridev.dto.company.*;
import africa.afridev.model.entity.CompanyEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.repository.CompanyRepository;
import africa.afridev.repository.UserRepository;
import africa.afridev.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<CompanyDto>> createCompany(
            Authentication authentication,
            @Valid @RequestBody CreateCompanyRequest request
    ) {
        UserEntity user = getAuthenticatedUser(authentication);
        CompanyDto created = companyService.createCompany(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CompanyDto>> getMyCompany(Authentication authentication) {
        UserEntity user = getAuthenticatedUser(authentication);
        CompanyDto company = companyService.getMyCompany(user);
        return ResponseEntity.ok(ApiResponse.ok(company));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<CompanyDto>> getCompanyBySlug(@PathVariable String slug) {
        CompanyDto company = companyService.getCompanyBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(company));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyDto>> updateCompany(
            @PathVariable String id,
            Authentication authentication,
            @RequestBody UpdateCompanyRequest request
    ) {
        UserEntity user = getAuthenticatedUser(authentication);
        CompanyDto updated = companyService.updateCompany(id, user, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<PagedResult<CompanyMemberDto>>> listMembers(
            @PathVariable String id,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UserEntity user = getAuthenticatedUser(authentication);
        Pageable pageable = PageRequest.of(page, size);
        PagedResult<CompanyMemberDto> members = companyService.listMembers(id, user, pageable);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    @PostMapping("/{id}/members/invite")
    public ResponseEntity<ApiResponse<CompanyMemberDto>> inviteMember(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody InviteMemberRequest request
    ) {
        UserEntity user = getAuthenticatedUser(authentication);
        CompanyMemberDto member = companyService.inviteMember(id, user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(member));
    }

    @DeleteMapping("/{id}/members/{targetUserId}")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable String id,
            @PathVariable String targetUserId,
            Authentication authentication
    ) {
        UserEntity user = getAuthenticatedUser(authentication);
        companyService.removeMember(id, targetUserId, user);
        return ResponseEntity.ok(ApiResponse.ok("Membre retiré de l'entreprise avec succès."));
    }

    @GetMapping("/{id}/activity-log")
    public ResponseEntity<ApiResponse<PagedResult<CompanyActivityLogDto>>> getActivityLogs(
            @PathVariable String id,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UserEntity user = getAuthenticatedUser(authentication);
        Pageable pageable = PageRequest.of(page, size);
        PagedResult<CompanyActivityLogDto> logs = companyService.getActivityLogs(id, user, pageable);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ApiResponse<CompanyStatsDto>> getCompanyStats(
            @PathVariable String id,
            Authentication authentication
    ) {
        UserEntity user = getAuthenticatedUser(authentication);
        CompanyStatsDto stats = companyService.getCompanyStats(id, user);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CompanyDto>>> searchCompanies(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("companyXp").descending());
        Page<CompanyEntity> companies = companyRepository.searchCompanies(
                ContentStatus.PUBLISHED,
                country != null && !country.isBlank() ? country.trim() : null,
                sector != null && !sector.isBlank() ? sector.trim() : null,
                query != null && !query.isBlank() ? query.trim() : null,
                pageable);

        Page<CompanyDto> dtos = companies.map(companyService::mapToDto);
        return ResponseEntity.ok(ApiResponse.ok(dtos,
                Map.of("page", page, "perPage", size, "total", dtos.getTotalElements())));
    }

    private UserEntity getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new SecurityException("Authentification requise pour cette action.");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new SecurityException("Utilisateur introuvable."));
    }
}

