package africa.afridev.dto.mentor;

import africa.afridev.dto.auth.UserDto;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MentorCardDto {
    private String id;
    private UserDto user;
    private String fullName;
    private String title;
    private String country;
    private String city;
    private String avatarUrl;
    private String mentorBio;
    private Integer mentorHoursPerWeek;
    private List<String> mentorTopics;
    private List<String> skills;
    private Integer menteesHelpedCount;
    private Long xpPoints;
    private String levelTitle;
    private Integer levelNumber;
    private Double matchScore;
}
