package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/audit-project")
    public ResponseEntity<ApiResponse<Map<String, Object>>> auditProject(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = aiService.auditProject(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/project-pitch")
    public ResponseEntity<ApiResponse<Map<String, Object>>> projectPitch(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = aiService.generateProjectPitch(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/translate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> translate(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = aiService.translate(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/match")
    public ResponseEntity<ApiResponse<Map<String, Object>>> match(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = aiService.matchCandidate(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/interview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> interview(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = aiService.interviewStep(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/moderate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> moderate(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = aiService.moderateContent(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summarize(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = aiService.summarize(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = aiService.chat(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
