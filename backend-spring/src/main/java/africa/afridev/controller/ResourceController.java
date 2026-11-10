package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.resource.ResourceCreateRequest;
import africa.afridev.dto.resource.ResourceDto;
import africa.afridev.model.enums.ResourceType;
import africa.afridev.model.enums.SkillLevel;
import africa.afridev.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ResourceDto>>> searchResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) SkillLevel level,
            @RequestParam(required = false) String tech,
            @RequestParam(required = false) String lang,
            @RequestParam(required = false) Boolean isPaid,
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable
    ) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        Page<ResourceDto> page = resourceService.search(type, level, tech, lang, isPaid, email, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceDto>> getResource(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        ResourceDto dto = resourceService.getById(id, email);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<ResourceDto>> completeResource(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ResourceDto dto = resourceService.completeResource(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ResourceDto>> createResource(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ResourceCreateRequest request
    ) {
        ResourceDto dto = resourceService.createResource(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}

