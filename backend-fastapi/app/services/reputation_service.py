from app.schemas.reputation import (
    ReputationCalculationRequest,
    ReputationCalculationResponse,
    DimensionScore
)

class ReputationService:

    @staticmethod
    def calculate_reputation(request: ReputationCalculationRequest) -> ReputationCalculationResponse:
        evaluations = request.evaluations

        if not evaluations:
            return ReputationCalculationResponse(
                evaluatee_id=request.evaluatee_id,
                total_evaluations=0,
                overall_reputation_score=0.0,
                code_quality_avg=0.0,
                collaboration_avg=0.0,
                technical_depth_avg=0.0,
                reliability_avg=0.0,
                dimensions=[
                    DimensionScore(dimension="Qualité du Code", score=0.0),
                    DimensionScore(dimension="Profondeur Technique", score=0.0),
                    DimensionScore(dimension="Fiabilité & Délais", score=0.0),
                    DimensionScore(dimension="Collaboration & Communication", score=0.0),
                ],
                fraud_penalty_applied=False
            )

        total_weight = 0.0
        weighted_code_quality = 0.0
        weighted_collaboration = 0.0
        weighted_technical_depth = 0.0
        weighted_reliability = 0.0

        for ev in evaluations:
            # Calcul du poids de l'évaluateur (Mobile Money + Complétion de profil)
            base_weight = 1.0
            if ev.evaluator_mobile_money_verified:
                base_weight += 0.25
            profile_factor = max(0.5, ev.evaluator_completion_score / 100.0)
            weight = base_weight * profile_factor

            total_weight += weight
            weighted_code_quality += ev.code_quality * weight
            weighted_collaboration += ev.collaboration * weight
            weighted_technical_depth += ev.technical_depth * weight
            weighted_reliability += ev.reliability * weight

        code_quality_avg = round(weighted_code_quality / total_weight, 2)
        collaboration_avg = round(weighted_collaboration / total_weight, 2)
        technical_depth_avg = round(weighted_technical_depth / total_weight, 2)
        reliability_avg = round(weighted_reliability / total_weight, 2)

        # Calcul du score global pondéré (Code: 30%, Tech: 30%, Reliability: 20%, Collab: 20%)
        overall_score = round(
            (code_quality_avg * 0.30) +
            (technical_depth_avg * 0.30) +
            (reliability_avg * 0.20) +
            (collaboration_avg * 0.20),
            2
        )

        dimensions = [
            DimensionScore(dimension="Qualité du Code", score=code_quality_avg),
            DimensionScore(dimension="Profondeur Technique", score=technical_depth_avg),
            DimensionScore(dimension="Fiabilité & Délais", score=reliability_avg),
            DimensionScore(dimension="Collaboration & Communication", score=collaboration_avg),
        ]

        return ReputationCalculationResponse(
            evaluatee_id=request.evaluatee_id,
            total_evaluations=len(evaluations),
            overall_reputation_score=overall_score,
            code_quality_avg=code_quality_avg,
            collaboration_avg=collaboration_avg,
            technical_depth_avg=technical_depth_avg,
            reliability_avg=reliability_avg,
            dimensions=dimensions,
            fraud_penalty_applied=False
        )
