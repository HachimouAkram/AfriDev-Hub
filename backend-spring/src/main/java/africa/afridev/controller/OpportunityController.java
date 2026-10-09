package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.opportunity.ApplicationCreateRequest;
import africa.afridev.dto.opportunity.ApplicationDto;
import africa.afridev.dto.opportunity.OpportunityCreateRequest;
import africa.afridev.dto.opportunity.OpportunityDto;
import africa.afridev.model.enums.ApplicationStatus;
import africa.afridev.model.enums.OpportunityType;
import africa.afridev.service.OpportunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/opportunities")
@RequiredArgsConstructor
public class OpportunityController {

    private final OpportunityService opportunityService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OpportunityDto>>> getAllOpportunities(
            @RequestParam(required = false) OpportunityType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<OpportunityDto> opportunities = opportunityService.getAllOpportunities(type, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(opportunities, Map.of("page", page, "perPage", size, "total", opportunities.getTotalElements())));
    }

    @GetMapping("/my-applications")
    public ResponseEntity<ApiResponse<List<ApplicationDto>>> getMyApplications(Authentication authentication) {
        List<ApplicationDto> applications = opportunityService.getMyApplications(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(applications));
    }

    @GetMapping("/my-posted")
    public ResponseEntity<ApiResponse<List<OpportunityDto>>> getMyPostedOpportunities(Authentication authentication) {
        List<OpportunityDto> opportunities = opportunityService.getMyPostedOpportunities(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(opportunities));
    }

    @GetMapping("/my-received-applications")
    public ResponseEntity<ApiResponse<List<ApplicationDto>>> getApplicationsReceivedForMyOpportunities(Authentication authentication) {
        List<ApplicationDto> applications = opportunityService.getApplicationsReceivedForMyOpportunities(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(applications));
    }

    @PatchMapping("/applications/{applicationId}/status")
    public ResponseEntity<ApiResponse<ApplicationDto>> updateApplicationStatus(
            @PathVariable String applicationId,
            @RequestParam ApplicationStatus status,
            Authentication authentication
    ) {
        ApplicationDto updated = opportunityService.updateApplicationStatus(authentication.getName(), applicationId, status);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OpportunityDto>> getOpportunityById(@PathVariable String id) {
        OpportunityDto opportunity = opportunityService.getOpportunityById(id);
        return ResponseEntity.ok(ApiResponse.ok(opportunity));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OpportunityDto>> createOpportunity(
            Authentication authentication,
            @Valid @RequestBody OpportunityCreateRequest request
    ) {
        OpportunityDto opportunity = opportunityService.createOpportunity(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(opportunity));
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<ApiResponse<ApplicationDto>> applyToOpportunity(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody ApplicationCreateRequest request
    ) {
        ApplicationDto application = opportunityService.applyToOpportunity(authentication.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(application));
    }

    @GetMapping("/{id}/applications")
    public ResponseEntity<ApiResponse<List<ApplicationDto>>> getApplicationsForOpportunity(
            @PathVariable String id,
            Authentication authentication
    ) {
        List<ApplicationDto> applications = opportunityService.getApplicationsForOpportunity(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(applications));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OpportunityDto>> updateOpportunity(
            @PathVariable String id,
            Authentication authentication,
            @Valid @RequestBody OpportunityCreateRequest request
    ) {
        OpportunityDto opportunity = opportunityService.updateOpportunity(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(opportunity));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<OpportunityDto>> toggleOpportunityStatus(
            @PathVariable String id,
            Authentication authentication
    ) {
        OpportunityDto opportunity = opportunityService.toggleOpportunityStatus(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(opportunity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOpportunity(
            @PathVariable String id,
            Authentication authentication
    ) {
        opportunityService.deleteOpportunity(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
