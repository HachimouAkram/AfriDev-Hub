from fastapi import APIRouter, HTTPException, status
from app.schemas.ai_community import (
    SummarizeRequest,
    SummarizeResponse,
    GroupRecommendationRequest,
    GroupRecommendationResponse,
    ContentModerationRequest,
    ContentModerationResponse,
    TagSuggestionRequest,
    TagSuggestionResponse
)
from app.services.ai_community_service import AICommunityService

router = APIRouter(prefix="/api/v1/ai", tags=["AI Community & NLP Services"])

@router.post("/summarize", response_model=SummarizeResponse)
def summarize_post(req: SummarizeRequest):
    """Résume automatiquement un long post ou échange communautaire."""
    try:
        return AICommunityService.summarize_text(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du résumé automatique: {str(e)}"
        )

@router.post("/recommend-groups", response_model=GroupRecommendationResponse)
def recommend_groups(req: GroupRecommendationRequest):
    """Recommande des communautés adaptées au profil et centres d'intérêt du membre."""
    try:
        return AICommunityService.recommend_groups(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la recommandation de groupes: {str(e)}"
        )

@router.post("/moderate", response_model=ContentModerationResponse)
def moderate_content(req: ContentModerationRequest):
    """Analyse un message ou une publication pour détecter le spam ou contenu inapproprié."""
    try:
        return AICommunityService.moderate_content(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la modération automatique: {str(e)}"
        )

@router.post("/extract-tags", response_model=TagSuggestionResponse)
def extract_tags(req: TagSuggestionRequest):
    """Extrait et suggère des tags techniques pertinents à partir d'un titre et d'une description."""
    try:
        return AICommunityService.suggest_tags(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'extraction des tags: {str(e)}"
        )
