package africa.afridev.dto.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SyncBatchResponse {
    private int processedCount;
    private int failedCount;
    private List<SyncActionResult> results;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SyncActionResult {
        private String clientActionId;
        private String status; // SUCCESS, DUPLICATE, FAILED
        private String message;
        private String serverId;
    }
}

