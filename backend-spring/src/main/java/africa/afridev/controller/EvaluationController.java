package africa.afridev.controller;

import africa.afridev.dto.ApiResponse;
import africa.afridev.dto.evaluation.EvaluationCreateRequest;
import africa.afridev.dto.evaluation.EvaluationDto;
import africa.afridev.dto.evaluation.ReputationScoreDto;
import africa.afridev.service.EvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping
    public ResponseEntity<ApiResponse<EvaluationDto>> submitEvaluation(
            Authentication authentication,
            @Valid @RequestBody EvaluationCreateRequest request
    ) {
        EvaluationDto evaluation = evaluationService.submitEvaluation(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(evaluation));
    }

    @GetMapping("/received/{evaluateeId}")
    public ResponseEntity<ApiResponse<List<EvaluationDto>>> getReceivedEvaluations(@PathVariable String evaluateeId) {
        List<EvaluationDto> evaluations = evaluationService.getReceivedEvaluations(evaluateeId);
        return ResponseEntity.ok(ApiResponse.ok(evaluations));
    }

    @GetMapping("/score/{evaluateeId}")
    public ResponseEntity<ApiResponse<ReputationScoreDto>> getReputationScore(@PathVariable String evaluateeId) {
        ReputationScoreDto score = evaluationService.getReputationScore(evaluateeId);
        return ResponseEntity.ok(ApiResponse.ok(score));
    }
}
