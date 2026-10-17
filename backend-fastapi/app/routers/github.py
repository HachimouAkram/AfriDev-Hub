from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.github import (
    GitHubStatsResponse,
    GitHubVerifyResponse,
    GitHubRateLimitResponse
)
from app.services.github_service import GitHubService

router = APIRouter(prefix="/api/v1/github", tags=["GitHub Analytics & Verification"])

@router.get("/rate-limit", response_model=GitHubRateLimitResponse)
async def check_github_rate_limit():
    """Vérifie la connectivité à l'API GitHub et retourne le quota de requêtes disponible."""
    try:
        return await GitHubService.get_rate_limit()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erreur de connectivité à GitHub API: {str(e)}"
        )

@router.get("/verify/{username}", response_model=GitHubVerifyResponse)
async def verify_github_user(username: str):
    """Vérifie si un nom d'utilisateur GitHub existe réellement avant synchronisation."""
    if not username or len(username.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur GitHub invalide."
        )

    try:
        return await GitHubService.verify_user(username.strip())
    except RuntimeError as re:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(re)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la vérification du compte GitHub: {str(e)}"
        )

@router.get("/stats/{username}", response_model=GitHubStatsResponse)
async def get_github_stats(
    username: str,
    refresh: bool = Query(False, description="Forcer le rafraîchissement en ignorant le cache Redis")
):
    """Récupère les statistiques agrégées (étoiles, contributions, langages) d'un profil GitHub."""
    if not username or len(username.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur GitHub invalide."
        )

    try:
        stats = await GitHubService.fetch_user_github_stats(username.strip(), bypass_cache=refresh)
        return stats
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except RuntimeError as re:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(re)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la synchronisation GitHub: {str(e)}"
        )

