package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.admin.ReportCreateRequest;
import africa.afridev.dto.admin.ReportDto;
import africa.afridev.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final AdminService adminService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReportDto>> createReport(
            Authentication authentication,
            @Valid @RequestBody ReportCreateRequest request
    ) {
        ReportDto report = adminService.createReport(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(report));
    }
}
