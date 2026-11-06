package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.mentor.MentorCardDto;
import africa.afridev.dto.mentor.MentorUpdateRequest;
import africa.afridev.service.MentorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la gestion et la recherche des Mentors (Phase 2).
 * Base URL : /api/v1/mentors
 */
@RestController
@RequestMapping("/mentors")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;

    /**
     * GET /mentors — Liste paginée des mentors avec filtres (Tâche 2.3)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<MentorCardDto>>> getMentors(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("xpPoints").descending());
        Page<MentorCardDto> mentors = mentorService.getMentors(country, topic, query, pageable);
        return ResponseEntity.ok(ApiResponse.ok(mentors,
                Map.of("page", page, "perPage", size, "total", mentors.getTotalElements())));
    }

    /**
     * GET /mentors/top — Top mentors de la communauté (Tâche 2.3 & 2.8)
     */
    @GetMapping("/top")
    public ResponseEntity<ApiResponse<List<MentorCardDto>>> getTopMentors(
            @RequestParam(defaultValue = "6") int limit
    ) {
        List<MentorCardDto> top = mentorService.getTopMentors(limit);
        return ResponseEntity.ok(ApiResponse.ok(top));
    }

    /**
     * GET /mentors/user/{userId} — Consulter le profil mentor d'un utilisateur
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<MentorCardDto>> getMentorByUserId(@PathVariable String userId) {
        MentorCardDto mentor = mentorService.getMentorByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok(mentor));
    }

    /**
     * PUT /mentors/status — Activer/Désactiver ou mettre à jour le statut mentor (Tâche 2.2)
     */
    @PutMapping("/status")
    public ResponseEntity<ApiResponse<MentorCardDto>> updateMentorStatus(
            Authentication authentication,
            @Valid @RequestBody MentorUpdateRequest request
    ) {
        MentorCardDto updated = mentorService.updateMentorProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}

