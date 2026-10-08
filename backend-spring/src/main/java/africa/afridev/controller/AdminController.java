package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.admin.*;
import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.enums.ReportStatus;
import africa.afridev.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getPlatformStats() {
        AdminStatsDto stats = adminService.getPlatformStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody UserStatusUpdateRequest request
    ) {
        UserDto updatedUser = adminService.updateUserStatus(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(updatedUser));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<Page<ReportDto>>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Page<ReportDto> reports = adminService.getReports(status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(reports, Map.of("page", page, "perPage", size, "total", reports.getTotalElements())));
    }

    @PatchMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<ReportDto>> handleReport(
            @PathVariable String id,
            Authentication authentication,
            @RequestParam ReportStatus status
    ) {
        ReportDto report = adminService.handleReport(authentication.getName(), id, status);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLogDto>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AuditLogDto> auditLogs = adminService.getAuditLogs(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(auditLogs, Map.of("page", page, "perPage", size, "total", auditLogs.getTotalElements())));
    }
}
