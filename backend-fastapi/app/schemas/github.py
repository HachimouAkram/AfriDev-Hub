from pydantic import BaseModel, Field
from typing import List, Dict, Optional

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
