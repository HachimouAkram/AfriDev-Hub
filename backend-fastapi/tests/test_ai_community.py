import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ai_summarize_post():
    payload = {
        "title": "Problème d'architecture microservices Spring et FastAPI",
        "content": (
            "Bonjour à tous les développeurs. Je travaille actuellement sur une application distribuée. "
            "Nous utilisons Spring Boot pour la gestion des utilisateurs et des transactions principales. "
            "En parallèle, un microservice Python FastAPI est utilisé pour l'intelligence artificielle et le matching. "
            "Nous aimerions optimiser les échanges HTTP et réduire la latence entre les deux services. "
            "Quelles sont les meilleures pratiques pour sécuriser et accélérer ces communications inter-services ?"
        ),
        "max_sentences": 2
    }
    response = client.post("/api/v1/ai/summarize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "key_points" in data
    assert len(data["key_points"]) <= 2
    assert data["original_words_count"] > 10

def test_ai_group_recommendation():
    payload = {
        "user": {
            "user_id": "u-123",
            "skills": ["Python", "FastAPI", "Docker"],
            "interests": ["Machine Learning", "Intelligence Artificielle"],
            "country": "Sénégal",
            "joined_group_ids": ["grp-already-joined"]
        },
        "candidate_groups": [
            {
                "group_id": "grp-already-joined",
                "name": "Groupe Déjà Rejoint",
                "tags": ["Python"],
                "member_count": 20
            },
            {
                "group_id": "grp-ai-senegal",
                "name": "IA & Data Sénégal",
                "description": "Communauté des passionnés d'IA à Dakar",
                "tags": ["Python", "Machine Learning", "IA"],
                "country": "Sénégal",
                "member_count": 80,
                "access_type": "PUBLIC"
            },
            {
                "group_id": "grp-mobile",
                "name": "Flutter Devs Côte d'Ivoire",
                "tags": ["Flutter", "Mobile"],
                "country": "Côte d'Ivoire",
                "member_count": 15,
                "access_type": "PUBLIC"
            }
        ],
        "limit": 2
    }
    response = client.post("/api/v1/ai/recommend-groups", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "u-123"
    assert len(data["recommendations"]) > 0
    # grp-ai-senegal should be the top match
    top = data["recommendations"][0]
    assert top["group_id"] == "grp-ai-senegal"
    assert top["match_score"] > 50

def test_ai_content_moderation_safe():
    payload = {
        "title": "Comment débuter avec Spring Boot ?",
        "content": "Je suis un jeune étudiant en informatique et je cherche des ressources pour apprendre Java et Spring.",
        "context": "HELP_POST"
    }
    response = client.post("/api/v1/ai/moderate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_safe"] is True
    assert data["risk_level"] == "SAFE"
    assert data["suggested_action"] == "ALLOW"

def test_ai_content_moderation_spam():
    payload = {
        "title": "Crypto Giveaway free money",
        "content": "Click here to claim your casino tokens and get rich quick! Contact whatsapp +123456789",
        "context": "HELP_POST"
    }
    response = client.post("/api/v1/ai/moderate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_safe"] is False
    assert data["risk_level"] == "HIGH"
    assert data["suggested_action"] == "BLOCK"

def test_ai_tag_extraction():
    payload = {
        "title": "Besoin d'aide sur Angular et Docker",
        "content": "Mon conteneur ne compile pas le projet frontend TypeScript avec Nginx et Docker.",
        "max_tags": 3
    }
    response = client.post("/api/v1/ai/extract-tags", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "suggested_tags" in data
    assert any(t in ["angular", "docker", "typescript"] for t in data["suggested_tags"])

def test_mentor_recommendation_endpoint():
    payload = {
        "mentee": {
            "user_id": "mentee-1",
            "country": "Cameroun",
            "level": "JUNIOR",
            "desired_topics": ["Angular", "TypeScript"],
            "question_context": "Je débute en développement frontend"
        },
        "candidates": [
            {
                "mentor_id": "m-1",
                "user_id": "u-mentor-1",
                "full_name": "Senior FullStack",
                "country": "Cameroun",
                "skills": ["Angular", "TypeScript", "Java"],
                "mentor_topics": ["Angular", "Frontend"],
                "mentor_hours_per_week": 4,
                "mentees_helped_count": 12,
                "xp_points": 500
            }
        ],
        "limit": 3
    }
    response = client.post("/api/v1/recommendations/mentors", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mentee_id"] == "mentee-1"
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["match_score"] > 50

