package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.dashboard.DashboardKpiResponse;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.UserRepository;
import africa.afridev.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    @GetMapping("/kpis")
    public ResponseEntity<ApiResponse<DashboardKpiResponse>> getDashboardKpis(
            @AuthenticationPrincipal UserDetails userDetails,
            Principal principal
    ) {
        String email = null;
        if (userDetails != null) {
            email = userDetails.getUsername();
        } else if (principal != null) {
            email = principal.getName();
        }

        if (email == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Vous devez être connecté."));
        }

        UserEntity user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("NOT_FOUND", "Utilisateur non trouvé."));
        }

        DashboardKpiResponse kpis = dashboardService.getDashboardKpis(user);
        return ResponseEntity.ok(ApiResponse.ok(kpis));
    }
}
