from typing import List, Set
from app.schemas.mentors import (
    MentorRecommendationRequest,
    MentorRecommendationResponse,
    MentorMatchResult,
    MentorCandidateInput
)

class MentorMatchingService:

    @staticmethod
    def calculate_recommendations(request: MentorRecommendationRequest) -> MentorRecommendationResponse:
        mentee = request.mentee
        candidates = request.candidates
        limit = max(1, min(request.limit, 20))

        desired_set: Set[str] = {t.strip().lower() for t in mentee.desired_topics if t}
        scored_mentors: List[MentorMatchResult] = []

        for candidate in candidates:
            # Ne pas recommander le mentee à lui-même
            if candidate.user_id == mentee.user_id:
                continue

            score = 25.0  # Base
            reasons = []

            # 1. Alignement des thématiques (mentor_topics + skills)
            cand_topics: Set[str] = {t.strip().lower() for t in candidate.mentor_topics if t}
            cand_skills: Set[str] = {s.strip().lower() for s in candidate.skills if s}
            all_cand_competencies = cand_topics.union(cand_skills)

            common_topics = list(desired_set.intersection(all_cand_competencies))
            if common_topics:
                topic_bonus = min(40.0, len(common_topics) * 15.0)
                score += topic_bonus
                reasons.append(f"Expertise partagée sur {', '.join(common_topics[:3])}")
            elif desired_set:
                # Analyse contextuelle partielle
                if candidate.title:
                    for d in desired_set:
                        if d in candidate.title.lower():
                            score += 15.0
                            reasons.append(f"Titre aligné avec votre recherche ({candidate.title})")
                            break

            # 2. Synergie géographique panafricaine
            if mentee.country and candidate.country and mentee.country.strip().lower() == candidate.country.strip().lower():
                score += 15.0
                reasons.append(f"Même pays ({candidate.country})")

            # 3. Disponibilité du mentor
            if candidate.mentor_hours_per_week >= 4:
                score += 10.0
                reasons.append("Forte disponibilité (>4h/semaine)")
            elif candidate.mentor_hours_per_week >= 2:
                score += 5.0

            # 4. Antécédents de mentorat et XP
            if candidate.mentees_helped_count > 0:
                bonus_helped = min(10.0, candidate.mentees_helped_count * 2.0)
                score += bonus_helped
                reasons.append(f"A déjà guidé {candidate.mentees_helped_count} développeur(s)")

            if candidate.xp_points > 500:
                score += 5.0

            final_score = round(min(99.0, max(30.0, score)), 1)
            reason_text = " • ".join(reasons) if reasons else "Mentor recommandé par la communauté AfriDev"

            scored_mentors.append(MentorMatchResult(
                mentor_id=candidate.mentor_id,
                user_id=candidate.user_id,
                full_name=candidate.full_name,
                match_score=final_score,
                common_topics=common_topics,
                recommendation_reason=reason_text
            ))

        # Tri par score décroissant
        scored_mentors.sort(key=lambda m: m.match_score, reverse=True)

        return MentorRecommendationResponse(
            mentee_id=mentee.user_id,
            recommendations=scored_mentors[:limit]
        )

