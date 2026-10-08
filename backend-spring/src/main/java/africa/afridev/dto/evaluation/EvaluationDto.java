package africa.afridev.dto.evaluation;

import africa.afridev.dto.auth.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EvaluationDto {
    private String id;
    private UserDto evaluator;
    private UserDto evaluatee;
    private CollaborationDto collaboration;
    private Integer codeQuality;
    private Integer collaborationRating;
    private Integer technicalDepth;
    private Integer reliability;
    private String feedback;
    private Boolean isPublic;
    private Float weight;
    private LocalDateTime createdAt;
}
