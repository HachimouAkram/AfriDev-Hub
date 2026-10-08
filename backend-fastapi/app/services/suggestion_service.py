from typing import List, Set
from app.schemas.suggestions import (
    UserSuggestionRequest,
    UserSuggestionResponse,
    ScoredUserSuggestion,
    UserProfileInput
)

class SuggestionService:

    @staticmethod
    def _normalize_skills(skills: List[str]) -> Set[str]:
        return {s.strip().lower() for s in skills if s and s.strip()}

    @classmethod
    def calculate_suggestions(cls, request: UserSuggestionRequest) -> UserSuggestionResponse:
        target = request.target_user
        target_skills = cls._normalize_skills(target.skills)
        scored_results: List[ScoredUserSuggestion] = []

        for candidate in request.candidates:
            # Ne pas recommander l'utilisateur lui-même ni les profils déjà suivis
            if candidate.user_id == target.user_id or candidate.is_followed:
                continue

            candidate_skills = cls._normalize_skills(candidate.skills)
            
            # 1. Calcul d'intersection de compétences (Jaccard Index)
            common_skills = target_skills.intersection(candidate_skills)
            skill_score = 0.0
            if target_skills and candidate_skills:
                union_skills = target_skills.union(candidate_skills)
                skill_score = (len(common_skills) / len(union_skills)) * 40.0
            elif common_skills:
                skill_score = min(len(common_skills) * 10.0, 40.0)

            # 2. Score de synergie des rôles
            role_score = 15.0
            target_role = target.role.upper()
            candidate_role = candidate.role.upper()

            if target_role == "RECRUITER" and candidate_role == "DEVELOPER":
                role_score = 30.0
            elif target_role == "DEVELOPER" and candidate_role == "RECRUITER":
                role_score = 25.0
            elif target_role == "DEVELOPER" and candidate_role == "DEVELOPER":
                role_score = 20.0

            # 3. Score de réputation par les pairs (Max 20 points)
            reputation_score_pts = (min(candidate.reputation_score, 5.0) / 5.0) * 20.0

            # 4. Score de proximité géographique (Max 10 points)
            geo_score = 0.0
            if target.country and candidate.country and target.country.lower() == candidate.country.lower():
                geo_score += 7.0
                if target.city and candidate.city and target.city.lower() == candidate.city.lower():
                    geo_score += 3.0

            # Cumul et bornage du match percentage entre 35% et 99%
            raw_match = skill_score + role_score + reputation_score_pts + geo_score
            match_percentage = min(max(round(raw_match, 1), 35.0), 99.0)

            # Construction du motif explicatif
            reasons = []
            if common_skills:
                skills_list_str = ", ".join([s.capitalize() for s in list(common_skills)[:3]])
                reasons.append(f"Compétences communes : {skills_list_str}")
            if candidate.reputation_score >= 4.0:
                reasons.append(f"Excellente réputation certifiée ({candidate.reputation_score:.1f}/5)")
            if target_role == "RECRUITER" and candidate_role == "DEVELOPER":
                reasons.append("Développeur hautement qualifié pour vos recrutements")
            elif target_role == "DEVELOPER" and candidate_role == "RECRUITER":
                reasons.append("Recruteur actif dans votre écosystème")
            elif geo_score > 0:
                reasons.append(f"Basé dans le même pays ({candidate.country})")

            reason_str = " & ".join(reasons) if reasons else "Profil recommandé pour étendre votre réseau"

            scored_results.append(
                ScoredUserSuggestion(
                    user_id=candidate.user_id,
                    full_name=candidate.full_name,
                    role=candidate.role,
                    match_percentage=match_percentage,
                    matched_skills=list(common_skills),
                    reason=reason_str,
                    reputation_score=candidate.reputation_score
                )
            )

        # Trier par score de compatibilité décroissant
        scored_results.sort(key=lambda x: x.match_percentage, reverse=True)

        return UserSuggestionResponse(
            target_user_id=target.user_id,
            total_candidates_analyzed=len(request.candidates),
            suggestions=scored_results[:request.limit]
        )
