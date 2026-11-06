from pydantic import BaseModel, Field
from typing import List, Optional

class MenteeProfileInput(BaseModel):
    user_id: str
    country: Optional[str] = None
    level: Optional[str] = None  # JUNIOR, MID, etc.
    desired_topics: List[str] = Field(default_factory=list)
    question_context: Optional[str] = None

class MentorCandidateInput(BaseModel):
    mentor_id: str
    user_id: str
    full_name: str
    country: Optional[str] = None
    title: Optional[str] = None
    mentor_bio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    mentor_topics: List[str] = Field(default_factory=list)
    mentor_hours_per_week: int = 2
    mentees_helped_count: int = 0
    xp_points: int = 0

class MentorRecommendationRequest(BaseModel):
    mentee: MenteeProfileInput
    candidates: List[MentorCandidateInput]
    limit: int = 5

class MentorMatchResult(BaseModel):
    mentor_id: str
    user_id: str
    full_name: str
    match_score: float
    common_topics: List[str]
    recommendation_reason: str

class MentorRecommendationResponse(BaseModel):
    mentee_id: str
    recommendations: List[MentorMatchResult]
