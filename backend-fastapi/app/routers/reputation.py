from fastapi import APIRouter, HTTPException, status
from app.schemas.reputation import ReputationCalculationRequest, ReputationCalculationResponse
from app.services.reputation_service import ReputationService

router = APIRouter(prefix="/api/v1/reputation", tags=["Reputation Intelligence"])

@router.post("/calculate", response_model=ReputationCalculationResponse)
def calculate_reputation(request: ReputationCalculationRequest):
    if not request.evaluatee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'identifiant du développeur évalué est obligatoire."
        )

    try:
        return ReputationService.calculate_reputation(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du calcul du score de réputation: {str(e)}"
        )
