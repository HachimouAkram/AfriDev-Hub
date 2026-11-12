package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.dashboard.DashboardKpiResponse;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/kpis")
    public ResponseEntity<ApiResponse<DashboardKpiResponse>> getDashboardKpis(@AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Vous devez être connecté."));
        }
        DashboardKpiResponse kpis = dashboardService.getDashboardKpis(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(kpis));
    }
}
