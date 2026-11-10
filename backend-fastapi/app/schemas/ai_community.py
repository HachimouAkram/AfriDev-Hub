from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

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

# --- Nouvelles requêtes et réponses IA Killer (Phase 1 & 5) ---

class MatchRequest(BaseModel):
    candidate: Dict[str, Any]
    opportunity: Dict[str, Any]

class MatchResponse(BaseModel):
    score: int
    matched_skills: List[str]
    explanation: str
    recommended: bool

class AuditProjectRequest(BaseModel):
    repo_url: Optional[str] = ""
    title: str
    description: str
    stack: List[str] = Field(default_factory=list)
    technologies: Optional[List[str]] = Field(default_factory=list)
    readme: Optional[str] = None

class AuditProjectResponse(BaseModel):
    overall_score: int
    security_score: int
    architecture_score: int
    documentation_score: int
    strengths: List[str]
    improvements: List[str]
    summary: str
    commercial_viability: str

class ProjectPitchRequest(BaseModel):
    title: str
    description: str
    stack: List[str] = Field(default_factory=list)
    technologies: Optional[List[str]] = Field(default_factory=list)
    project_type: str = "FOR_SALE"

class ProjectPitchResponse(BaseModel):
    catchy_title: str
    enhanced_description: str
    suggested_tags: List[str]
    recommended_price_xof: int
    recommended_price_usd: int
    target_audience: str
    key_selling_points: List[str]

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    target_lang: str = Field(..., description="fr, en, wo, sw")
    source_lang: str = "auto"

class TranslateResponse(BaseModel):
    translated_text: str
    target_lang: str

class InterviewRequest(BaseModel):
    role: str
    tech_stack: List[str] = Field(default_factory=list)
    question_index: int = 1
    previous_answer: Optional[str] = None

class InterviewResponse(BaseModel):
    feedback_on_previous: Optional[str] = None
    score_previous: Optional[int] = None
    next_question: str
    question_category: str
    hint: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    image_base64: Optional[str] = None
    image_mime: Optional[str] = None
    history: Optional[List[ChatMessage]] = None
    lang: Optional[str] = "fr"

class ChatResponse(BaseModel):
    reply: str
    lang: str
