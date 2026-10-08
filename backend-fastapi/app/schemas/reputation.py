from pydantic import BaseModel, Field
from typing import List, Optional

class SingleEvaluationInput(BaseModel):
    evaluator_id: str
    evaluator_mobile_money_verified: bool = False
    evaluator_completion_score: int = 60
    code_quality: int = Field(..., ge=1, le=5)
    collaboration: int = Field(..., ge=1, le=5)
    technical_depth: int = Field(..., ge=1, le=5)
    reliability: int = Field(..., ge=1, le=5)

class ReputationCalculationRequest(BaseModel):
    evaluatee_id: str
    evaluations: List[SingleEvaluationInput]

class DimensionScore(BaseModel):
    dimension: str
    score: float

class ReputationCalculationResponse(BaseModel):
    evaluatee_id: str
    total_evaluations: int
    overall_reputation_score: float = Field(..., description="Score global sur 5.0")
    code_quality_avg: float
    collaboration_avg: float
    technical_depth_avg: float
    reliability_avg: float
    dimensions: List[DimensionScore]
    fraud_penalty_applied: bool = False
