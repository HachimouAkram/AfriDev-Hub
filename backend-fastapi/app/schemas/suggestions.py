from pydantic import BaseModel, Field
from typing import List, Optional

class UserProfileInput(BaseModel):
    user_id: str
    full_name: str
    role: str = Field(..., description="DEVELOPER ou RECRUITER")
    skills: List[str] = Field(default_factory=list, description="Liste des compétences / technologies")
    country: Optional[str] = None
    city: Optional[str] = None
    reputation_score: float = Field(default=0.0, ge=0.0, le=5.0)
    total_evaluations: int = 0
    is_followed: bool = False

class UserSuggestionRequest(BaseModel):
    target_user: UserProfileInput
    candidates: List[UserProfileInput]
    limit: int = Field(default=10, ge=1, le=50)

class ScoredUserSuggestion(BaseModel):
    user_id: str
    full_name: str
    role: str
    match_percentage: float = Field(..., description="Pourcentage de compatibilité entre 0.0 et 100.0%")
    matched_skills: List[str] = Field(default_factory=list)
    reason: str
    reputation_score: float

class UserSuggestionResponse(BaseModel):
    target_user_id: str
    total_candidates_analyzed: int
    suggestions: List[ScoredUserSuggestion]
