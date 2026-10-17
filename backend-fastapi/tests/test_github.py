import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.github_service import GitHubService

client = TestClient(app)

def test_health_endpoint():
    """Vérifie que l'endpoint health fonctionne."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "backend-fastapi"

def test_root_endpoint():
    """Vérifie que la racine du service répond."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"

def test_github_rate_limit():
    """Vérifie que l'endpoint rate-limit retourne un quota valide."""
    response = client.get("/api/v1/github/rate-limit")
    assert response.status_code == 200
    data = response.json()
    assert "limit" in data
    assert "remaining" in data
    assert "status" in data
    assert data["limit"] > 0

def test_github_verify_existing_user():
    """Vérifie l'existence d'un compte public GitHub officiel (octocat)."""
    response = client.get("/api/v1/github/verify/octocat")
    assert response.status_code == 200
    data = response.json()
    assert data["exists"] is True
    assert data["username"].lower() == "octocat"
    assert data["html_url"] == "https://github.com/octocat"

def test_github_verify_non_existing_user():
    """Vérifie la détection d'un compte inexistant."""
    response = client.get("/api/v1/github/verify/non_existent_user_afridev_xyz_9999")
    assert response.status_code == 200
    data = response.json()
    assert data["exists"] is False
    assert "n'existe pas" in data["message"]

def test_github_stats_existing_user():
    """Vérifie l'extraction des statistiques GitHub réelles."""
    response = client.get("/api/v1/github/stats/octocat")
    assert response.status_code == 200
    data = response.json()
    assert data["username"].lower() == "octocat"
    assert "public_repos" in data
    assert "total_stars" in data
    assert "top_languages" in data
    assert isinstance(data["top_languages"], list)

def test_github_stats_non_existing_user():
    """Vérifie qu'un utilisateur inconnu retourne un code 404."""
    response = client.get("/api/v1/github/stats/non_existent_user_afridev_xyz_9999")
    assert response.status_code == 404
    assert "introuvable" in response.json()["detail"]

def test_github_stats_empty_username():
    """Vérifie le rejet d'un username vide."""
    response = client.get("/api/v1/github/stats/%20")
    assert response.status_code == 400

from unittest.mock import patch, MagicMock

@pytest.mark.asyncio
async def test_github_service_mock_calculation():
    """Teste le calcul des langages et étoiles avec des données simulées (unitaire)."""
    mock_user_data = {
        "login": "testuser",
        "public_repos": 3,
        "followers": 10
    }
    mock_repos_data = [
        {"name": "repo1", "stargazers_count": 5, "language": "Python"},
        {"name": "repo2", "stargazers_count": 10, "language": "Python"},
        {"name": "repo3", "stargazers_count": 15, "language": "TypeScript"}
    ]

    with patch("httpx.AsyncClient.get") as mock_get:
        # Premier appel: /users/testuser
        # Deuxième appel: /users/testuser/repos
        mock_res_user = MagicMock()
        mock_res_user.status_code = 200
        mock_res_user.json.return_value = mock_user_data

        mock_res_repos = MagicMock()
        mock_res_repos.status_code = 200
        mock_res_repos.json.return_value = mock_repos_data

        mock_get.side_effect = [mock_res_user, mock_res_repos]

        stats = await GitHubService.fetch_user_github_stats("testuser", bypass_cache=True)
        assert stats.username == "testuser"
        assert stats.total_stars == 30  # 5 + 10 + 15
        assert len(stats.top_languages) == 2
        # Python: 2/3 = 66.7%
        python_stat = next(l for l in stats.top_languages if l.name == "Python")
        assert python_stat.percentage == 66.7

