from fastapi import APIRouter, HTTPException, status
from app.schemas.mentors import MentorRecommendationRequest, MentorRecommendationResponse
from app.services.mentor_matching_service import MentorMatchingService

router = APIRouter(prefix="/api/v1/recommendations/mentors", tags=["AI Mentor Matching"])

@router.post("", response_model=MentorRecommendationResponse)
def recommend_mentors(request: MentorRecommendationRequest):
    if not request.mentee or not request.mentee.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le profil du demandeur (mentee) est obligatoire."
        )

    try:
        return MentorMatchingService.calculate_recommendations(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du calcul des recommandations de mentors: {str(e)}"
        )

