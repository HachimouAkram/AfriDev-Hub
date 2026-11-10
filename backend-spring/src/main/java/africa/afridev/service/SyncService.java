package africa.afridev.service;

import africa.afridev.dto.sync.SyncBatchRequest;
import africa.afridev.dto.sync.SyncBatchResponse;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncService {

    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final ProjectCommentService commentService;
    private final RedisCacheService redisCacheService;

    // Cache local des actions déjà exécutées pour garantir l'idempotence
    private final Map<String, Boolean> processedActionIds = new ConcurrentHashMap<>();

    @Transactional
    public SyncBatchResponse processBatch(String userEmail, SyncBatchRequest request) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé: " + userEmail));

        List<SyncBatchResponse.SyncActionResult> results = new ArrayList<>();
        int successCount = 0;
        int failedCount = 0;

        if (request.getActions() != null) {
            for (SyncBatchRequest.SyncActionItem item : request.getActions()) {
                String actionId = item.getClientActionId();

                if (actionId != null && processedActionIds.containsKey(actionId)) {
                    results.add(SyncBatchResponse.SyncActionResult.builder()
                            .clientActionId(actionId)
                            .status("DUPLICATE")
                            .message("Action déjà synchronisée auparavant")
                            .build());
                    continue;
                }

                try {
                    String actionType = item.getActionType() != null ? item.getActionType().toUpperCase() : "";
                    Map<String, Object> payload = item.getPayload() != null ? item.getPayload() : Map.of();
                    String createdServerId = null;

                    if ("RECOGNIZE_PROJECT".equals(actionType)) {
                        String projectId = (String) payload.get("projectId");
                        if (projectId != null) {
                            projectService.recognizeProject(userEmail, projectId);
                            createdServerId = projectId;
                        }
                    } else if ("PROJECT_COMMENT".equals(actionType)) {
                        String projectId = (String) payload.get("projectId");
                        String content = (String) payload.get("content");
                        if (projectId != null && content != null) {
                            africa.afridev.dto.project.ProjectCommentCreateRequest cReq = new africa.afridev.dto.project.ProjectCommentCreateRequest();
                            cReq.setContent(content);
                            var c = commentService.addComment(userEmail, projectId, cReq);
                            createdServerId = c.getId();
                        }
                    }

                    if (actionId != null) {
                        processedActionIds.put(actionId, true);
                    }

                    results.add(SyncBatchResponse.SyncActionResult.builder()
                            .clientActionId(actionId)
                            .status("SUCCESS")
                            .message("Action synchronisée avec succès")
                            .serverId(createdServerId)
                            .build());
                    successCount++;
                } catch (Exception e) {
                    log.warn("Erreur synchronisation action {}: {}", item.getClientActionId(), e.getMessage());
                    results.add(SyncBatchResponse.SyncActionResult.builder()
                            .clientActionId(item.getClientActionId())
                            .status("FAILED")
                            .message(e.getMessage())
                            .build());
                    failedCount++;
                }
            }
        }

        return SyncBatchResponse.builder()
                .processedCount(successCount)
                .failedCount(failedCount)
                .results(results)
                .build();
    }
}

