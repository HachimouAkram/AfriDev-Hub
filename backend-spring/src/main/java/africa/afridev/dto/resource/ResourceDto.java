package africa.afridev.dto.resource;

import africa.afridev.model.enums.ResourceType;
import africa.afridev.model.enums.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ResourceDto {
    private String id;
    private String title;
    private String description;
    private ResourceType type;
    private SkillLevel level;
    private String technology;
    private String language;
    private String youtubeUrl;
    private String thumbnailUrl;
    private String contentMarkdown;
    private String pdfUrl;
    private Boolean isPaid;
    private BigDecimal price;
    private String currency;
    private Integer durationMinutes;
    private Integer xpReward;
    private Integer viewsCount;
    private Integer completionsCount;
    private String authorName;
    private Boolean isCompletedByCurrentUser;
    private Boolean isUnlockedByCurrentUser;
    private LocalDateTime createdAt;
}

