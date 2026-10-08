package africa.afridev.service;

import africa.afridev.dto.evaluation.*;
import africa.afridev.model.entity.CollaborationEntity;
import africa.afridev.model.entity.EvaluationEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.CollaborationRepository;
import africa.afridev.repository.EvaluationRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final CollaborationRepository collaborationRepository;
    private final EvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String FASTAPI_REPUTATION_URL = "http://localhost:8000/api/v1/reputation/calculate";

    @Transactional
    public CollaborationDto declareCollaboration(String userEmail, CollaborationCreateRequest request) {
        UserEntity initiator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        UserEntity partner = userRepository.findById(request.getPartnerId())
                .or(() -> userRepository.findByEmail(request.getPartnerId()))
                .orElseThrow(() -> new IllegalArgumentException("Partenaire de collaboration introuvable."));

        if (initiator.getId().equals(partner.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas déclarer une collaboration avec vous-même.");
        }

        CollaborationEntity collaboration = CollaborationEntity.builder()
                .initiator(initiator)
                .partner(partner)
                .type(request.getType())
                .proofUrl(request.getProofUrl())
                .verified(false) // Nécessite la confirmation du partenaire
                .build();

        CollaborationEntity saved = collaborationRepository.save(collaboration);
        return mapToCollaborationDto(saved);
    }

    @Transactional
    public CollaborationDto verifyCollaboration(String userEmail, String collaborationId) {
        UserEntity partner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        CollaborationEntity collaboration = collaborationRepository.findById(collaborationId)
                .orElseThrow(() -> new IllegalArgumentException("Collaboration introuvable."));

        if (!collaboration.getPartner().getId().equals(partner.getId())) {
            throw new IllegalStateException("Seul le partenaire désigné peut vérifier cette collaboration.");
        }

        collaboration.setVerified(true);
        CollaborationEntity saved = collaborationRepository.save(collaboration);
        return mapToCollaborationDto(saved);
    }

    @Transactional(readOnly = true)
    public List<CollaborationDto> getMyCollaborations(String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));
        return collaborationRepository.findByInitiatorIdOrPartnerId(user.getId(), user.getId())
                .stream()
                .map(col -> {
                    CollaborationDto dto = mapToCollaborationDto(col);
                    dto.setEvaluatedByCurrentUser(evaluationRepository.existsByEvaluatorIdAndCollaborationId(user.getId(), col.getId()));
                    return dto;
                })
                .toList();
    }

    @Transactional
    public EvaluationDto submitEvaluation(String userEmail, EvaluationCreateRequest request) {
        UserEntity evaluator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        UserEntity evaluatee = userRepository.findById(request.getEvaluateeId())
                .or(() -> userRepository.findByEmail(request.getEvaluateeId()))
                .orElseThrow(() -> new IllegalArgumentException("Développeur évalué introuvable."));

        if (evaluator.getId().equals(evaluatee.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous évaluer vous-même.");
        }

        CollaborationEntity collaboration = collaborationRepository.findById(request.getCollaborationId())
                .orElseThrow(() -> new IllegalArgumentException("Collaboration introuvable."));

        // REGLE DE SECURITE : La collaboration doit impérativement être vérifiée par le partenaire
        if (!Boolean.TRUE.equals(collaboration.getVerified())) {
            throw new IllegalStateException("RÈGLE DE SÉCURITÉ : L'évaluation est conditionnée à une collaboration préalablement vérifiée par le partenaire.");
        }

        if (evaluationRepository.existsByEvaluatorIdAndEvaluateeIdAndCollaborationId(evaluator.getId(), evaluatee.getId(), collaboration.getId())) {
            throw new IllegalStateException("Vous avez déjà émis une évaluation pour cette collaboration.");
        }

        // Calcul du poids de l'évaluateur (ex: +25% si Mobile Money vérifié)
        float weight = 1.0f;
        if (evaluator.getProfile() != null && Boolean.TRUE.equals(evaluator.getProfile().getMobileMoneyVerified())) {
            weight += 0.25f;
        }

        EvaluationEntity evaluation = EvaluationEntity.builder()
                .evaluator(evaluator)
                .evaluatee(evaluatee)
                .collaboration(collaboration)
                .codeQuality(request.getCodeQuality())
                .collaborationRating(request.getCollaborationRating())
                .technicalDepth(request.getTechnicalDepth())
                .reliability(request.getReliability())
                .feedback(request.getFeedback())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .weight(weight)
                .build();

        EvaluationEntity saved = evaluationRepository.save(evaluation);
        return mapToEvaluationDto(saved);
    }

    private String resolveUserId(String input) {
        if (input == null || input.isBlank()) return input;
        return userRepository.findById(input)
                .or(() -> userRepository.findByProfileId(input))
                .or(() -> userRepository.findByEmail(input))
                .map(UserEntity::getId)
                .orElse(input);
    }

    @Transactional(readOnly = true)
    public List<EvaluationDto> getReceivedEvaluations(String evaluateeId) {
        String targetId = resolveUserId(evaluateeId);
        return evaluationRepository.findByEvaluateeIdAndIsPublicTrueOrderByCreatedAtDesc(targetId)
                .stream()
                .map(this::mapToEvaluationDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReputationScoreDto getReputationScore(String evaluateeId) {
        String targetId = resolveUserId(evaluateeId);
        List<EvaluationEntity> evaluations = evaluationRepository.findByEvaluateeIdAndIsPublicTrueOrderByCreatedAtDesc(targetId);

        if (evaluations.isEmpty()) {
            return ReputationScoreDto.builder()
                    .evaluateeId(evaluateeId)
                    .totalEvaluations(0)
                    .overallReputationScore(0.0f)
                    .codeQualityAvg(0.0f)
                    .collaborationAvg(0.0f)
                    .technicalDepthAvg(0.0f)
                    .reliabilityAvg(0.0f)
                    .dimensions(List.of(
                            new ReputationScoreDto.DimensionScoreDto("Qualité du Code", 0.0f),
                            new ReputationScoreDto.DimensionScoreDto("Profondeur Technique", 0.0f),
                            new ReputationScoreDto.DimensionScoreDto("Fiabilité & Délais", 0.0f),
                            new ReputationScoreDto.DimensionScoreDto("Collaboration & Communication", 0.0f)
                    ))
                    .build();
        }

        // Appel au microservice FastAPI de réputation pour calcul algorithmique pondéré
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("evaluatee_id", targetId);

            List<Map<String, Object>> evalInputs = evaluations.stream().map(e -> {
                Map<String, Object> map = new HashMap<>();
                map.put("evaluator_id", e.getEvaluator().getId());
                map.put("evaluator_mobile_money_verified", e.getEvaluator().getProfile() != null && Boolean.TRUE.equals(e.getEvaluator().getProfile().getMobileMoneyVerified()));
                map.put("evaluator_completion_score", (e.getEvaluator().getProfile() != null && e.getEvaluator().getProfile().getCompletionScore() != null) ? e.getEvaluator().getProfile().getCompletionScore() : 60);
                map.put("code_quality", e.getCodeQuality());
                map.put("collaboration", e.getCollaborationRating());
                map.put("technical_depth", e.getTechnicalDepth());
                map.put("reliability", e.getReliability());
                return map;
            }).toList();

            payload.put("evaluations", evalInputs);

            ReputationScoreDto response = restTemplate.postForObject(FASTAPI_REPUTATION_URL, payload, ReputationScoreDto.class);
            if (response != null && response.getOverallReputationScore() != null) {
                return response;
            }
        } catch (Exception e) {
            // Fallback direct en Java si FastAPI indisponible
        }

        // Calcul de secours en Java
        double avgCode = evaluations.stream().mapToInt(EvaluationEntity::getCodeQuality).average().orElse(0.0);
        double avgCollab = evaluations.stream().mapToInt(EvaluationEntity::getCollaborationRating).average().orElse(0.0);
        double avgTech = evaluations.stream().mapToInt(EvaluationEntity::getTechnicalDepth).average().orElse(0.0);
        double avgReliability = evaluations.stream().mapToInt(EvaluationEntity::getReliability).average().orElse(0.0);
        double overall = (avgCode * 0.3) + (avgTech * 0.3) + (avgReliability * 0.2) + (avgCollab * 0.2);

        return ReputationScoreDto.builder()
                .evaluateeId(evaluateeId)
                .totalEvaluations(evaluations.size())
                .overallReputationScore((float) Math.round(overall * 100) / 100.0f)
                .codeQualityAvg((float) Math.round(avgCode * 100) / 100.0f)
                .collaborationAvg((float) Math.round(avgCollab * 100) / 100.0f)
                .technicalDepthAvg((float) Math.round(avgTech * 100) / 100.0f)
                .reliabilityAvg((float) Math.round(avgReliability * 100) / 100.0f)
                .dimensions(List.of(
                        new ReputationScoreDto.DimensionScoreDto("Qualité du Code", (float) avgCode),
                        new ReputationScoreDto.DimensionScoreDto("Profondeur Technique", (float) avgTech),
                        new ReputationScoreDto.DimensionScoreDto("Fiabilité & Délais", (float) avgReliability),
                        new ReputationScoreDto.DimensionScoreDto("Collaboration & Communication", (float) avgCollab)
                ))
                .build();
    }

    private CollaborationDto mapToCollaborationDto(CollaborationEntity col) {
        return CollaborationDto.builder()
                .id(col.getId())
                .initiator(authService.mapToUserDto(col.getInitiator()))
                .partner(authService.mapToUserDto(col.getPartner()))
                .type(col.getType())
                .proofUrl(col.getProofUrl())
                .verified(col.getVerified())
                .createdAt(col.getCreatedAt())
                .build();
    }

    private EvaluationDto mapToEvaluationDto(EvaluationEntity ev) {
        return EvaluationDto.builder()
                .id(ev.getId())
                .evaluator(authService.mapToUserDto(ev.getEvaluator()))
                .evaluatee(authService.mapToUserDto(ev.getEvaluatee()))
                .collaboration(mapToCollaborationDto(ev.getCollaboration()))
                .codeQuality(ev.getCodeQuality())
                .collaborationRating(ev.getCollaborationRating())
                .technicalDepth(ev.getTechnicalDepth())
                .reliability(ev.getReliability())
                .feedback(ev.getFeedback())
                .isPublic(ev.getIsPublic())
                .weight(ev.getWeight())
                .createdAt(ev.getCreatedAt())
                .build();
    }
}
