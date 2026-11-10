import os
from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
from app.schemas.ai_community import (
    SummarizeRequest,
    SummarizeResponse,
    GroupRecommendationRequest,
    GroupRecommendationResponse,
    ContentModerationRequest,
    ContentModerationResponse,
    TagSuggestionRequest,
    TagSuggestionResponse,
    MatchRequest,
    MatchResponse,
    AuditProjectRequest,
    AuditProjectResponse,
    ProjectPitchRequest,
    ProjectPitchResponse,
    TranslateRequest,
    TranslateResponse,
    InterviewRequest,
    InterviewResponse,
    ChatRequest,
    ChatResponse
)
from app.services.ai_community_service import AICommunityService
from app.services.ai_engine import AIEngine

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "afridev_internal_secret_key_2026_x7k9")

def verify_internal_access(x_internal_key: Optional[str] = Header(None)):
    # Permet l'accès direct en dev si non configuré, mais valide la clé si fournie
    if INTERNAL_API_KEY and x_internal_key and x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit: Clé d'API interne non valide"
        )

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

# --- NOUVEAUX ENDPOINTS IA ULTRA-PUISSANTS (GEMINI + COHERE + GROQ) ---

@router.post("/match", response_model=MatchResponse)
def match_developer_opportunity(req: MatchRequest):
    """Calcule le score de compatibilité sémantique entre un développeur et une opportunité via Cohere Embeddings."""
    try:
        res = AIEngine.match_candidate(req.candidate, req.opportunity)
        return MatchResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du matching IA: {str(e)}"
        )

@router.post("/audit-project", response_model=AuditProjectResponse)
def audit_project(req: AuditProjectRequest):
    """Analyse technique et commerciale d'un projet GitHub via Gemini / Groq."""
    try:
        final_stack = req.stack or req.technologies or []
        res = AIEngine.audit_github_project(req.repo_url or "", req.title, req.description, final_stack, req.readme)
        return AuditProjectResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'audit IA du projet: {str(e)}"
        )

@router.post("/project-pitch", response_model=ProjectPitchResponse)
def generate_project_pitch(req: ProjectPitchRequest):
    """Génère une description commerciale percutante et suggère un prix en XOF via Gemini."""
    try:
        res = AIEngine.project_pitch_and_pricing(req.title, req.description, req.stack, req.project_type)
        return ProjectPitchResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du pitch de projet: {str(e)}"
        )

@router.post("/translate", response_model=TranslateResponse)
def translate_content(req: TranslateRequest):
    """Traduit dynamiquement un contenu entre Français, Anglais, Wolof et Kiswahili."""
    try:
        res = AIEngine.translate(req.text, req.target_lang, req.source_lang)
        return TranslateResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la traduction IA: {str(e)}"
        )

@router.post("/interview", response_model=InterviewResponse)
def technical_interview_step(req: InterviewRequest):
    """Simulateur d'entretien technique interactif mené par une IA."""
    try:
        res = AIEngine.interview_simulator(req.role, req.tech_stack, req.question_index, req.previous_answer)
        return InterviewResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la simulation d'entretien: {str(e)}"
        )

@router.post("/chat", response_model=ChatResponse)
async def public_chat(request: ChatRequest, x_internal_key: Optional[str] = Header(None)):
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in request.history] if request.history else None
        res = AIEngine.multimodal_chat(
            message=request.message,
            image_base64=request.image_base64,
            image_mime=request.image_mime,
            history=history_dicts,
            lang=request.lang or "fr"
        )
        return ChatResponse(reply=res["reply"], lang=res.get("lang", "fr"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur du chatbot IA: {str(e)}"
        )
