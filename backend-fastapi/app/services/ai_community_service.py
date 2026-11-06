import re
import math
from typing import List, Dict, Tuple
from app.schemas.ai_community import (
    SummarizeRequest,
    SummarizeResponse,
    GroupRecommendationRequest,
    GroupRecommendationResponse,
    GroupMatchResult,
    ContentModerationRequest,
    ContentModerationResponse,
    TagSuggestionRequest,
    TagSuggestionResponse
)

KNOWN_TECH_TAGS = [
    "python", "javascript", "typescript", "java", "spring-boot", "fastapi", "django", "flask",
    "angular", "react", "vue", "nextjs", "nodejs", "express", "flutter", "react-native", "android",
    "ios", "kotlin", "swift", "docker", "kubernetes", "aws", "azure", "gcp", "devops", "ci-cd",
    "postgresql", "mysql", "mongodb", "redis", "graphql", "rest-api", "git", "github", "linux",
    "machine-learning", "deep-learning", "ia", "data-science", "nlp", "cybersecurite", "blockchain",
    "stage", "emploi", "orientation", "formation", "etudes", "carriere", "junior", "mentorat"
]

SPAM_KEYWORDS = [
    "casino", "crypto giveaway", "get rich quick", "gagnez de l'argent facile",
    "free money", "whatsapp me for money", "click here to claim", "whatsapp +", "telegram @"
]

class AICommunityService:

    @classmethod
    def summarize_text(cls, req: SummarizeRequest) -> SummarizeResponse:
        content = req.content.strip()
        words = content.split()
        original_words_count = len(words)
        reading_time_minutes = max(1, math.ceil(original_words_count / 200))

        # Découpage en phrases
        sentences = re.split(r'(?<=[.!?])\s+', content)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

        if not sentences:
            sentences = [content]

        # Scoring simple des phrases par présence de mots-clés
        scored: List[Tuple[str, int]] = []
        for s in sentences:
            s_lower = s.lower()
            score = 0
            for tag in KNOWN_TECH_TAGS:
                if tag in s_lower:
                    score += 2
            # Préférer les phrases concises et informatives
            word_count = len(s.split())
            if 8 <= word_count <= 35:
                score += 1
            scored.append((s, score))

        # Trier et garder les N meilleures phrases
        scored.sort(key=lambda x: x[1], reverse=True)
        top_sentences = [item[0] for item in scored[:req.max_sentences]]

        summary = " ".join(top_sentences)
        key_points = top_sentences[:3]

        return SummarizeResponse(
            summary=summary,
            key_points=key_points,
            original_words_count=original_words_count,
            reading_time_minutes=reading_time_minutes
        )

    @classmethod
    def recommend_groups(cls, req: GroupRecommendationRequest) -> GroupRecommendationResponse:
        user = req.user
        joined = set(user.joined_group_ids)
        user_keywords = set([k.lower().strip() for k in (user.skills + user.interests)])
        user_country = user.country.lower().strip() if user.country else None

        results: List[GroupMatchResult] = []

        for grp in req.candidate_groups:
            # Ne pas recommander les groupes déjà rejoints
            if grp.group_id in joined:
                continue

            score = 0.0
            matched_tags = []
            reasons = []

            # 1. Correspondance de tags (skills & interests)
            grp_tags = set([t.lower().strip() for t in grp.tags])
            common = user_keywords.intersection(grp_tags)
            if common:
                tag_score = len(common) * 20.0
                score += min(50.0, tag_score)
                matched_tags.extend(list(common))
                reasons.append(f"Centres d'intérêt communs : {', '.join(list(common)[:3])}")

            # 2. Correspondance pays / proximité régionale
            if user_country and grp.country and grp.country.lower().strip() == user_country:
                score += 25.0
                reasons.append(f"Communauté locale ({grp.country})")

            # 3. Dynamique de membres (activité)
            if grp.member_count > 50:
                score += 15.0
            elif grp.member_count > 10:
                score += 10.0
            elif grp.member_count > 0:
                score += 5.0

            # 4. Accessibilité
            if grp.access_type == "PUBLIC":
                score += 10.0

            final_score = min(100.0, round(score, 1))

            if not reasons:
                reasons.append("Communauté active recommandée pour vous")

            results.append(GroupMatchResult(
                group_id=grp.group_id,
                name=grp.name,
                match_score=final_score,
                matched_tags=matched_tags,
                recommendation_reason=" • ".join(reasons)
            ))

        results.sort(key=lambda r: r.match_score, reverse=True)
        return GroupRecommendationResponse(
            user_id=user.user_id,
            recommendations=results[:req.limit]
        )

    @classmethod
    def moderate_content(cls, req: ContentModerationRequest) -> ContentModerationResponse:
        text = f"{req.title or ''} {req.content}".lower()
        reasons = []

        # Vérification des mots-clés de spam
        for kw in SPAM_KEYWORDS:
            if kw in text:
                reasons.append(f"Présence de terme suspect lié au spam : '{kw}'")

        # Vérification des liens multiples
        urls = re.findall(r'https?://\S+', text)
        if len(urls) >= 4:
            reasons.append("Nombre excessif de liens externes (possible message publicitaire)")

        # Détermination du niveau de risque
        if len(reasons) >= 2 or any("casino" in r or "free money" in r for r in reasons):
            return ContentModerationResponse(
                is_safe=False,
                risk_level="HIGH",
                flagged_reasons=reasons,
                suggested_action="BLOCK"
            )
        elif len(reasons) == 1:
            return ContentModerationResponse(
                is_safe=True,
                risk_level="LOW",
                flagged_reasons=reasons,
                suggested_action="WARN"
            )
        else:
            return ContentModerationResponse(
                is_safe=True,
                risk_level="SAFE",
                flagged_reasons=[],
                suggested_action="ALLOW"
            )

    @classmethod
    def suggest_tags(cls, req: TagSuggestionRequest) -> TagSuggestionResponse:
        full_text = f"{req.title} {req.content}".lower()
        # Nettoyage ponctuation
        words = set(re.findall(r'[a-zA-Z0-9_\-\+]+', full_text))

        detected: List[Tuple[str, float]] = []

        for tag in KNOWN_TECH_TAGS:
            if tag in full_text:
                score = 0.9 if tag in req.title.lower() else 0.75
                detected.append((tag, score))

        # Trier par score décroissant et dédoublonner
        detected.sort(key=lambda x: x[1], reverse=True)
        top_tags = detected[:req.max_tags]

        return TagSuggestionResponse(
            suggested_tags=[t[0] for t in top_tags],
            confidence_scores={t[0]: t[1] for t in top_tags}
        )

