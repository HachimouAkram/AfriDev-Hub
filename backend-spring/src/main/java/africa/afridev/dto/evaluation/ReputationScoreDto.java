package africa.afridev.dto.evaluation;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReputationScoreDto {
    @JsonProperty("evaluateeId")
    @JsonAlias({"evaluateeId", "evaluatee_id"})
    private String evaluateeId;

    @JsonProperty("totalEvaluations")
    @JsonAlias({"totalEvaluations", "total_evaluations"})
    private Integer totalEvaluations;

    @JsonProperty("overallReputationScore")
    @JsonAlias({"overallReputationScore", "overall_reputation_score"})
    private Float overallReputationScore; // Out of 5.0

    @JsonProperty("codeQualityAvg")
    @JsonAlias({"codeQualityAvg", "code_quality_avg"})
    private Float codeQualityAvg;

    @JsonProperty("collaborationAvg")
    @JsonAlias({"collaborationAvg", "collaboration_avg"})
    private Float collaborationAvg;

    @JsonProperty("technicalDepthAvg")
    @JsonAlias({"technicalDepthAvg", "technical_depth_avg"})
    private Float technicalDepthAvg;

    @JsonProperty("reliabilityAvg")
    @JsonAlias({"reliabilityAvg", "reliability_avg"})
    private Float reliabilityAvg;

    private List<DimensionScoreDto> dimensions;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DimensionScoreDto {
        private String dimension;
        private Float score;
    }
}

