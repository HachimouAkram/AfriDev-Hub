from fastapi import APIRouter, HTTPException, status
from app.schemas.suggestions import UserSuggestionRequest, UserSuggestionResponse
from app.services.suggestion_service import SuggestionService

router = APIRouter(prefix="/api/v1/suggestions", tags=["AI User Suggestions & Matching"])

@router.post("/network", response_model=UserSuggestionResponse)
def get_network_user_suggestions(request: UserSuggestionRequest):
    if not request.target_user or not request.target_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'utilisateur cible (target_user) est requis."
        )

    try:
        return SuggestionService.calculate_suggestions(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du calcul des suggestions d'utilisateurs: {str(e)}"
        )
