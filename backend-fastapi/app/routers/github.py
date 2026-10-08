from fastapi import APIRouter, HTTPException, status
from app.schemas.github import GitHubStatsResponse
from app.services.github_service import GitHubService

router = APIRouter(prefix="/api/v1/github", tags=["GitHub Analytics"])

@router.get("/stats/{username}", response_model=GitHubStatsResponse)
async def get_github_stats(username: str):
    if not username or len(username.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur GitHub invalide."
        )

    try:
        stats = await GitHubService.fetch_user_github_stats(username.strip())
        return stats
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la synchronisation GitHub: {str(e)}"
        )
