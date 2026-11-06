from pydantic import BaseModel, Field
from typing import List, Optional

class SummarizeRequest(BaseModel):
    title: Optional[str] = None
    content: str = Field(..., min_length=20, description="Contenu de la publication ou discussion à résumer")
    max_sentences: int = Field(default=3, ge=1, le=10)

class SummarizeResponse(BaseModel):
    summary: str
    key_points: List[str]
    original_words_count: int
    reading_time_minutes: int

class CandidateGroupInput(BaseModel):
    group_id: str
    name: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    country: Optional[str] = None
    member_count: int = 0
    access_type: str = "PUBLIC"

class UserGroupRecommendationProfile(BaseModel):
    user_id: str
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    country: Optional[str] = None
    joined_group_ids: List[str] = Field(default_factory=list)

class GroupRecommendationRequest(BaseModel):
    user: UserGroupRecommendationProfile
    candidate_groups: List[CandidateGroupInput]
    limit: int = 5

class GroupMatchResult(BaseModel):
    group_id: str
    name: str
    match_score: float
    matched_tags: List[str]
    recommendation_reason: str

class GroupRecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[GroupMatchResult]

class ContentModerationRequest(BaseModel):
    title: Optional[str] = None
    content: str
    context: str = "HELP_POST"  # HELP_POST, COMMENT, GROUP_MESSAGE

class ContentModerationResponse(BaseModel):
    is_safe: bool
    risk_level: str  # SAFE, LOW, MEDIUM, HIGH
    flagged_reasons: List[str] = Field(default_factory=list)
    suggested_action: str  # ALLOW, WARN, BLOCK

class TagSuggestionRequest(BaseModel):
    title: str
    content: str
    max_tags: int = 5

class TagSuggestionResponse(BaseModel):
    suggested_tags: List[str]
    confidence_scores: dict

