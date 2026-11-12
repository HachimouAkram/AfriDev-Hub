package africa.afridev.dto.group;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.model.enums.GroupAccessType;
import africa.afridev.model.enums.GroupMemberRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class GroupDto {
    private String id;
    private String name;
    private String slug;
    private String description;
    private String avatarUrl;
    private String bannerUrl;
    private GroupAccessType accessType;
    private List<String> tags;
    private String country;
    private String city;
    private String rulesMarkdown;
    private UserDto owner;
    private Integer memberCount;
    private Integer postCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Contexte utilisateur connecté
    private Boolean isMember;
    private GroupMemberRole userRole;
    private Boolean isPending;

    // Recommandation IA & Affinité
    private String suggestionReason;
    private Double matchPercentage;
}

