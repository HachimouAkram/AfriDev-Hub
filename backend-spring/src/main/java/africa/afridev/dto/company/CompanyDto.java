package africa.afridev.dto.company;

import africa.afridev.model.enums.ContentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompanyDto {
    private String id;
    private String name;
    private String slug;
    private String description;
    private String logoUrl;
    private String bannerUrl;
    private String coverUrl;
    private String websiteUrl;
    private String linkedinUrl;
    private String twitterUrl;
    private String country;
    private String city;
    private String sector;
    private String companySize;
    private String ownerId;
    private String ownerName;
    private String ownerEmail;
    private Long companyXp;
    private String companyLevel;
    private Integer levelNumber;
    private String badge;
    private Boolean verified;
    private ContentStatus status;
    private long activeOpportunitiesCount;
    private long totalMembersCount;
    private LocalDateTime createdAt;
}

