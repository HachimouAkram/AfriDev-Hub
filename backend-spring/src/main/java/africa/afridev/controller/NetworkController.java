package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.network.NetworkSuggestionDto;
import africa.afridev.dto.network.UserNetworkDto;
import africa.afridev.service.NetworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/network")
@RequiredArgsConstructor
public class NetworkController {

    private final NetworkService networkService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserNetworkDto>>> getNetworkUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String country,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        String currentEmail = authentication != null ? authentication.getName() : null;
        Page<UserNetworkDto> users = networkService.getNetworkUsers(currentEmail, role, query, skill, country, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(users, Map.of("page", page, "perPage", size, "total", users.getTotalElements())));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<NetworkSuggestionDto>>> getNetworkSuggestions(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication
    ) {
        String currentEmail = authentication != null ? authentication.getName() : null;
        List<NetworkSuggestionDto> suggestions = networkService.getNetworkSuggestions(currentEmail, limit);
        return ResponseEntity.ok(ApiResponse.ok(suggestions));
    }
}
