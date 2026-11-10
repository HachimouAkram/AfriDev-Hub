import httpx
import json
import redis
import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.schemas.github import (
    GitHubStatsResponse,
    LanguageStat,
    GitHubVerifyResponse,
    GitHubRateLimitResponse
)

# Connection Redis avec support REDIS_URL ou HOST/PORT/PASSWORD et fallback robuste
REDIS_URL = os.getenv("REDIS_URL", "")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379" if not os.getenv("REDIS_PORT") and not REDIS_URL else os.getenv("REDIS_PORT", "6380")))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "redis_secret")

def get_redis_client():
    try:
        if REDIS_URL:
            client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
        else:
            client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                password=REDIS_PASSWORD if REDIS_PASSWORD else None,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
        client.ping()
        return client
    except Exception:
        return None

LANGUAGE_COLORS = {
    "JavaScript": "#F7DF1E",
    "TypeScript": "#3178C6",
    "Python": "#3572A5",
    "Java": "#B07219",
    "HTML": "#E34F26",
    "CSS": "#563D7C",
    "Go": "#00ADD8",
    "Rust": "#DEA584",
    "C++": "#F34B7D",
    "C": "#555555",
    "PHP": "#4F5D95",
    "Ruby": "#701516",
    "Swift": "#F05138",
    "Kotlin": "#A97BFF",
    "Dart": "#00B4AB",
    "Shell": "#89E051",
    "C#": "#178600"
}

class GitHubService:

    @staticmethod
    def get_headers() -> Dict[str, str]:
        headers = {
            "User-Agent": "AfriDevHub-App",
            "Accept": "application/vnd.github.v3+json"
        }
        token = os.getenv("GITHUB_TOKEN")
        if token and token.strip():
            headers["Authorization"] = f"Bearer {token.strip()}"
        return headers

    @staticmethod
    async def get_rate_limit() -> GitHubRateLimitResponse:
        """Vérifie la connectivité à l'API GitHub et retourne le quota de requêtes restant."""
        headers = GitHubService.get_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get("https://api.github.com/rate_limit", headers=headers)
                if res.status_code == 200:
                    data = res.json().get("resources", {}).get("core", {})
                    limit = data.get("limit", 60)
                    remaining = data.get("remaining", 0)
                    reset_epoch = data.get("reset", 0)
                    reset_dt = datetime.fromtimestamp(reset_epoch, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                    authenticated = "Authorization" in headers
                    status = "OK" if remaining > 0 else "RATE_LIMITED"

                    return GitHubRateLimitResponse(
                        limit=limit,
                        remaining=remaining,
                        reset_epoch=reset_epoch,
                        reset_datetime=reset_dt,
                        authenticated=authenticated,
                        status=status
                    )
                else:
                    raise RuntimeError(f"Erreur GitHub API: code {res.status_code}")
            except httpx.RequestError as e:
                raise RuntimeError(f"Impossible de joindre GitHub API: {str(e)}")

    @staticmethod
    async def verify_user(username: str) -> GitHubVerifyResponse:
        """Vérifie si un compte GitHub existe et renvoie les informations de base."""
        headers = GitHubService.get_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            user_url = f"https://api.github.com/users/{username}"
            try:
                res = await client.get(user_url, headers=headers)
            except httpx.RequestError as e:
                raise RuntimeError(f"Erreur réseau lors de la vérification GitHub: {str(e)}")

            if res.status_code == 404:
                return GitHubVerifyResponse(
                    username=username,
                    exists=False,
                    message=f"Le profil GitHub '{username}' n'existe pas."
                )
            elif res.status_code == 403:
                raise RuntimeError("Limite d'appels GitHub API atteinte (Rate Limit 403).")
            elif res.status_code != 200:
                raise RuntimeError(f"Erreur API GitHub ({res.status_code}).")

            data = res.json()
            return GitHubVerifyResponse(
                username=data.get("login", username),
                exists=True,
                name=data.get("name"),
                avatar_url=data.get("avatar_url"),
                html_url=data.get("html_url"),
                bio=data.get("bio"),
                public_repos=data.get("public_repos", 0),
                followers=data.get("followers", 0),
                message="Compte GitHub validé avec succès."
            )

    @staticmethod
    async def fetch_user_github_stats(username: str, bypass_cache: bool = False) -> GitHubStatsResponse:
        cache_key = f"github:stats:{username.lower()}"
        r_client = get_redis_client()

        # 1. Vérification du cache Redis (24h)
        if r_client and not bypass_cache:
            try:
                cached_data = r_client.get(cache_key)
                if cached_data:
                    parsed = json.loads(cached_data)
                    parsed["cached"] = True
                    return GitHubStatsResponse(**parsed)
            except Exception:
                pass

        # 2. Appel des API GitHub
        headers = GitHubService.get_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            user_url = f"https://api.github.com/users/{username}"
            try:
                user_res = await client.get(user_url, headers=headers)
            except httpx.RequestError as e:
                raise RuntimeError(f"Erreur réseau vers GitHub: {str(e)}")

            if user_res.status_code == 404:
                raise ValueError(f"Utilisateur GitHub '{username}' introuvable.")
            if user_res.status_code == 403:
                raise RuntimeError("Limite de requêtes GitHub API dépassée (Rate limit). Configurez un GITHUB_TOKEN.")
            if user_res.status_code != 200:
                raise RuntimeError(f"Erreur API GitHub ({user_res.status_code}).")

            user_data = user_res.json()
            repos_url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"
            try:
                repos_res = await client.get(repos_url, headers=headers)
                repos_data = repos_res.json() if repos_res.status_code == 200 else []
            except Exception:
                repos_data = []

        # 3. Traitement & Calcul des Statistiques
        total_stars = 0
        language_counts: Dict[str, int] = {}

        for repo in repos_data:
            if isinstance(repo, dict):
                total_stars += repo.get("stargazers_count", 0)
                lang = repo.get("language")
                if lang:
                    language_counts[lang] = language_counts.get(lang, 0) + 1

        total_lang_repos = sum(language_counts.values()) or 1
        top_languages: List[LanguageStat] = []

        sorted_langs = sorted(language_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        for lang_name, count in sorted_langs:
            pct = round((count / total_lang_repos) * 100, 1)
            color = LANGUAGE_COLORS.get(lang_name, "#10B981")
            top_languages.append(LanguageStat(name=lang_name, percentage=pct, color=color))

        # Estimation des contributions annuelles basées sur le nombre de repos et followers
        estimated_contributions = (user_data.get("public_repos", 0) * 12) + (total_stars * 5) + 42

        stats = GitHubStatsResponse(
            username=user_data.get("login", username),
            public_repos=user_data.get("public_repos", 0),
            followers=user_data.get("followers", 0),
            total_stars=total_stars,
            total_contributions_last_year=estimated_contributions,
            top_languages=top_languages,
            cached=False
        )

        # 4. Sauvegarde dans Redis (Cache 24 heures = 86400s)
        if r_client:
            try:
                r_client.setex(cache_key, 86400, stats.model_dump_json())
            except Exception:
                pass

        return stats

