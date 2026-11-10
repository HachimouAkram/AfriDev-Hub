package africa.afridev.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.fastapi.url:http://localhost:8000}")
    private String fastApiBaseUrl = "http://localhost:8000";

    @Value("${app.fastapi.internal-key:afridev_internal_secret_key_2026_x7k9}")
    private String internalApiKey = "afridev_internal_secret_key_2026_x7k9";

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Key", internalApiKey);
        return headers;
    }

    private Map<String, Object> postToFastApi(String endpoint, Map<String, Object> payload) {
        String url = fastApiBaseUrl.replaceAll("/+$", "") + endpoint;
        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, createHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Échec de l'appel au microservice IA FastAPI ({}): {}", endpoint, e.getMessage());
        }
        return Map.of("error", "Service IA temporairement indisponible", "status", 500);
    }

    public Map<String, Object> auditProject(Map<String, Object> request) {
        return postToFastApi("/api/v1/ai/audit-project", request);
    }

    public Map<String, Object> generateProjectPitch(Map<String, Object> request) {
        return postToFastApi("/api/v1/ai/project-pitch", request);
    }

    public Map<String, Object> translate(Map<String, Object> request) {
        return postToFastApi("/api/v1/ai/translate", request);
    }

    public Map<String, Object> matchCandidate(Map<String, Object> request) {
        return postToFastApi("/api/v1/ai/match", request);
    }

    public Map<String, Object> interviewStep(Map<String, Object> request) {
        return postToFastApi("/api/v1/ai/interview", request);
    }

    public Map<String, Object> moderateContent(Map<String, Object> request) {
        return postToFastApi("/api/v1/ai/moderate", request);
    }

    public Map<String, Object> chat(Map<String, Object> request) {
        return postToFastApi("/api/v1/ai/chat", request);
    }

    public Map<String, Object> summarize(Map<String, Object> request) {
        return postToFastApi("/api/v1/ai/summarize", request);
    }
}

