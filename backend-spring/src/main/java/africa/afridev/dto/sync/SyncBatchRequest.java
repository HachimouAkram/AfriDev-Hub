package africa.afridev.dto.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SyncBatchRequest {

    private List<SyncActionItem> actions;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SyncActionItem {
        private String clientActionId; // UUID généré côté client
        private String actionType;     // HELP_POST, COMMENT, RECOGNITION, etc.
        private Map<String, Object> payload;
        private Long clientTimestamp;
    }
}

