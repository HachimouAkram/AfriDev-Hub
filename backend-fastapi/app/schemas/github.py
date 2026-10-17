from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class LanguageStat(BaseModel):
    name: str
    percentage: float
    color: str

class GitHubStatsResponse(BaseModel):
    username: str
    public_repos: int = Field(..., description="Nombre de dépôts publics")
    followers: int = Field(0, description="Nombre d'abonnés")
    total_stars: int = Field(0, description="Nombre d'étoiles cumulées")
    total_contributions_last_year: int = Field(0, description="Contributions des 12 derniers mois")
    top_languages: List[LanguageStat] = Field(default_factory=list)
    cached: bool = False

class GitHubVerifyResponse(BaseModel):
    username: str
    exists: bool
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    html_url: Optional[str] = None
    bio: Optional[str] = None
    public_repos: Optional[int] = 0
    followers: Optional[int] = 0
    message: str

class GitHubRateLimitResponse(BaseModel):
    limit: int
    remaining: int
    reset_epoch: int
    reset_datetime: str
    authenticated: bool
    status: str

