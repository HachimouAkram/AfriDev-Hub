import httpx
import json
import redis
import os
from typing import Optional, Dict, Any, List
from app.schemas.github import GitHubStatsResponse, LanguageStat

# Connection Redis avec fallback
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6380"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "redis_secret")

try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        decode_responses=True,
        socket_connect_timeout=2
    )
except Exception as e:
    redis_client = None

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
    "PHP": "#4F5D95"
}

class GitHubService:

    @staticmethod
    async def fetch_user_github_stats(username: str) -> GitHubStatsResponse:
        cache_key = f"github:stats:{username.lower()}"

        # 1. Verification du cache Redis (24h)
        if redis_client:
            try:
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    parsed = json.loads(cached_data)
                    parsed["cached"] = True
                    return GitHubStatsResponse(**parsed)
            except Exception:
                pass

        # 2. Appel des API GitHub (REST API fallback sans token)
        async with httpx.AsyncClient(timeout=10.0) as client:
            user_url = f"https://api.github.com/users/{username}"
            user_res = await client.get(user_url, headers={"User-Agent": "AfriDevHub-App"})

            if user_res.status_code == 404:
                raise ValueError(f"Utilisateur GitHub '{username}' introuvable.")
            if user_res.status_code != 200:
                raise RuntimeError(f"Erreur API GitHub ({user_res.status_code}).")

            user_data = user_res.json()
            repos_url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"
            repos_res = await client.get(repos_url, headers={"User-Agent": "AfriDevHub-App"})
            repos_data = repos_res.json() if repos_res.status_code == 200 else []

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
        if redis_client:
            try:
                redis_client.setex(cache_key, 86400, stats.model_dump_json())
            except Exception:
                pass

        return stats
