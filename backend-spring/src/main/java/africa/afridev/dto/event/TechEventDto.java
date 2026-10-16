package africa.afridev.dto.event;

import africa.afridev.model.enums.TechEventType;
import africa.afridev.model.enums.VoteType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechEventDto {
    private String id;
    private String title;
    private String description;
    private TechEventType type;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String location;
    private Boolean isOnline;
    private String eventUrl;
    private String bannerUrl;
    private String organizerId;
    private String organizerName;
    private String organizerAvatar;
    private List<String> tags;
    private Integer agreeCount;
    private Integer disagreeCount;
    private VoteType userVote; // AGREE, DISAGREE, or null
    private LocalDateTime createdAt;

    // Champs de recommandation intelligente
    private Double matchPercentage;
    private String suggestionReason;
    private List<String> matchedTags;
    private Boolean isOrganizerFollowed;
}
