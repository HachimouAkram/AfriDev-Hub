package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.sync.SyncBatchRequest;
import africa.afridev.dto.sync.SyncBatchResponse;
import africa.afridev.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @PostMapping
    public ResponseEntity<ApiResponse<SyncBatchResponse>> syncOfflineActions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SyncBatchRequest request
    ) {
        SyncBatchResponse response = syncService.processBatch(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}

