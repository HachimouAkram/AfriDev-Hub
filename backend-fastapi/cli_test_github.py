#!/usr/bin/env python3
"""
AfriDev Hub - Script de Test CLI d'intégration GitHub pour FastAPI.
Permet de tester en direct la connectivité, les quotas, la vérification de compte
et l'extraction des statistiques GitHub avant déploiement.

Usage:
    python cli_test_github.py [nom_utilisateur_github]
Exemple:
    python cli_test_github.py octocat
    python cli_test_github.py torvalds
"""

import sys
import asyncio
import time
from datetime import datetime

# Assurer l'encodage UTF-8 sous Windows console
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.services.github_service import GitHubService, get_redis_client


# Couleurs ANSI pour la console
GREEN = "\033[92m"
BLUE = "\033[94m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

async def run_diagnostics(username: str):
    print(f"\n{BOLD}{CYAN}=================================================================={RESET}")
    print(f"{BOLD}{GREEN}  🌍 AFRIDEV HUB - TEST DE VALIDATION GITHUB & FASTAPI{RESET}")
    print(f"{BOLD}{CYAN}=================================================================={RESET}\n")

    # 1. Test de l'état de l'environnement & Token
    headers = GitHubService.get_headers()
    has_token = "Authorization" in headers
    auth_status = f"{GREEN}Défini (5000 req/h){RESET}" if has_token else f"{YELLOW}Non configuré (60 req/h - Mode public){RESET}"
    print(f"{BOLD}[1/4] Configuration & Sécurité :{RESET}")
    print(f"  • GITHUB_TOKEN : {auth_status}")

    # 2. Test Redis
    r_client = get_redis_client()
    if r_client:
        print(f"  • Cache Redis   : {GREEN}Connecté et opérationnel (TTL: 24h){RESET}")
    else:
        print(f"  • Cache Redis   : {YELLOW}Non accessible (mode direct sans cache){RESET}")

    # 3. Test de connectivité API GitHub & Quota
    print(f"\n{BOLD}[2/4] Connectivité API GitHub (Rate Limit) :{RESET}")
    try:
        t0 = time.time()
        rate_info = await GitHubService.get_rate_limit()
        elapsed = round((time.time() - t0) * 1000, 1)
        print(f"  • Statut API      : {GREEN}EN LIGNE ({elapsed}ms){RESET}")
        print(f"  • Requêtes restantes : {BOLD}{rate_info.remaining} / {rate_info.limit}{RESET}")
        print(f"  • Réinitialisation  : {rate_info.reset_datetime}")
        if rate_info.remaining < 10:
            print(f"  {YELLOW}⚠️ Attention: Quota presque épuisé ! Ajoutez GITHUB_TOKEN dans vos variables.{RESET}")
    except Exception as e:
        print(f"  • Statut API      : {RED}ÉCHEC ({str(e)}){RESET}")
        return

    # 4. Vérification du compte GitHub demandé
    print(f"\n{BOLD}[3/4] Vérification du compte GitHub '{username}' :{RESET}")
    try:
        t0 = time.time()
        verify_res = await GitHubService.verify_user(username)
        elapsed = round((time.time() - t0) * 1000, 1)
        if verify_res.exists:
            print(f"  • Existence      : {GREEN}Trouvé ({elapsed}ms){RESET}")
            print(f"  • Nom complet    : {verify_res.name or 'N/A'}")
            print(f"  • Dépôts publics : {verify_res.public_repos}")
            print(f"  • Abonnés        : {verify_res.followers}")
            print(f"  • Profil URL     : {verify_res.html_url}")
            if verify_res.bio:
                print(f"  • Bio            : {verify_res.bio.strip()}")
        else:
            print(f"  • Existence      : {RED}Introuvable{RESET} ({verify_res.message})")
            return
    except Exception as e:
        print(f"  • Erreur         : {RED}{str(e)}{RESET}")
        return

    # 5. Extraction complète des statistiques & test de cache
    print(f"\n{BOLD}[4/4] Extraction des Statistiques & Test Cache :{RESET}")
    try:
        # Premier appel (calcul direct)
        t0 = time.time()
        stats = await GitHubService.fetch_user_github_stats(username, bypass_cache=True)
        t_direct = round((time.time() - t0) * 1000, 1)
        print(f"  • Extraction directe : {GREEN}Succès ({t_direct}ms){RESET}")
        print(f"    - Étoiles cumulées  : {BOLD}{stats.total_stars} ⭐{RESET}")
        print(f"    - Contributions (an): {BOLD}{stats.total_contributions_last_year}{RESET}")
        print(f"    - Langages analysés :")
        for lang in stats.top_languages:
            bar = "█" * int(lang.percentage / 5)
            print(f"      • {lang.name:<12} {lang.percentage:>5.1f}%  {lang.color} {bar}{RESET}")

        # Deuxième appel (test du cache Redis)
        t1 = time.time()
        cached_stats = await GitHubService.fetch_user_github_stats(username, bypass_cache=False)
        t_cached = round((time.time() - t1) * 1000, 1)
        if cached_stats.cached:
            print(f"  • Lecture Cache Redis: {GREEN}ACTIVE ({t_cached}ms, gain: {round(t_direct - t_cached, 1)}ms){RESET}")
        else:
            print(f"  • Lecture Cache Redis: {YELLOW}Non servi depuis le cache{RESET}")

    except Exception as e:
        print(f"  • Erreur extraction  : {RED}{str(e)}{RESET}")
        return

    print(f"\n{BOLD}{GREEN}=================================================================={RESET}")
    print(f"{BOLD}{GREEN}  ✅ TOUS LES TESTS GITHUB FASTAPI SONT VALIDÉS AVEC SUCCÈS !{RESET}")
    print(f"{BOLD}{GREEN}  Votre microservice FastAPI est prêt pour le déploiement.{RESET}")
    print(f"{BOLD}{GREEN}=================================================================={RESET}\n")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "octocat"
    asyncio.run(run_diagnostics(target))
