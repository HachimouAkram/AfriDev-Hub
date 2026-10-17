# 🚀 Guide Complet d'Automatisation du Déploiement — AfriDev Hub

Ce guide explique comment fonctionne la chaîne d'intégration et de déploiement continus (**CI/CD**) pour l'ensemble de l'architecture AfriDev Hub (Angular, Spring Boot et FastAPI).

---

## 🗺️ Vue d'ensemble de l'Architecture de Déploiement

```text
       Code poussé sur 'main' (git push origin main)
                            │
                            ▼
      ┌──────────────────────────────────────────────┐
      │          GitHub Actions (CI/CD)              │
      │  1. Tests FastAPI (Python 3.12 / Pytest)     │
      │  2. Tests Spring Boot (Java 21 / JUnit 5)    │
      │  3. Tests & Build Angular (Node 22)          │
      └─────────────────────┬────────────────────────┘
                            │ (Si tous les tests réussissent)
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │   Vercel     │   │  Systalink   │   │  FastAPI     │
  │  (Frontend)  │   │(Spring Boot) │   │ (Microserv.) │
  │ Auto-déployé │   │ Auto-déployé │   │ Auto-déployé │
  │  via GitHub  │   │  via Webhook │   │  via Webhook │
  └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 1. 🅰️ Frontend Angular (Vercel) — 100% Automatique

- **Hébergement :** [Vercel](https://vercel.com)
- **Fonctionnement :** Dès qu'un commit est poussé sur la branche `main`, Vercel détecte automatiquement le changement, compile le projet Angular et le met en ligne sans aucune intervention manuelle.
- **URL de production :** `https://afridev-hub.vercel.app`

---

## 2. ☕ Backend Core Spring Boot (Systalink) — Déploiement Automatique

- **Hébergement :** [Systalink Platform](https://platform-systalink.com)
- **Conteneur :** Utilise le `Dockerfile` à la racine du projet (Java 21 / Multi-stage Maven).
- **URL :** `https://afridev-hub-711d9935.platform-systalink.com/api/v1`

### Activer le déclencheur automatique depuis GitHub Actions :
1. Rendez-vous sur votre dashboard **Systalink**.
2. Dans les paramètres de votre application `afridev-hub-711d9935`, cherchez la section **Deploy Hook** ou **Webhook de déploiement**.
3. Copiez l'URL du webhook fournie par Systalink.
4. Rendez-vous sur votre dépôt GitHub : `https://github.com/HachimouAkram/AfriDev-Hub`
5. Allez dans **Settings** > **Secrets and variables** > **Actions**.
6. Cliquez sur **New repository secret** :
   - **Nom :** `SYSTALINK_SPRING_WEBHOOK`
   - **Valeur :** *(Collez l'URL du webhook de déploiement Systalink)*
7. Cliquez sur **Add secret**.

> **Note :** Si votre application Systalink a déjà l'option *"Auto Deploy on Git Push"* activée et liée au dépôt GitHub, elle se met à jour automatiquement dès le `git push`. Le secret GitHub Actions garantit un redéploiement ordonné après validation des tests.

---

## 3. 🐍 Microservice FastAPI (Analytics & GitHub Sync)

Le microservice FastAPI possède son propre `backend-fastapi/Dockerfile`.

### Option A : Déployer en tant que 2ème conteneur sur Systalink (Recommandé)
1. Dans votre espace Systalink, créez une nouvelle application connectée au même dépôt GitHub `HachimouAkram/AfriDev-Hub`.
2. Configurez le chemin du Dockerfile : `backend-fastapi/Dockerfile`.
3. Port d'écoute : `8000`.
4. Copiez son webhook de déploiement et ajoutez-le dans GitHub Secrets sous le nom : `SYSTALINK_FASTAPI_WEBHOOK`.
5. Ajoutez l'URL obtenue dans les variables d'environnement de votre backend Spring Boot :
   - `FASTAPI_BASE_URL=https://<votre-url-fastapi-systalink>`

### Option B : Déployer gratuitement sur Render ou Koyeb
1. Connectez-vous sur [Render.com](https://render.com) ou [Koyeb.com](https://koyeb.com).
2. Créez un **Web Service** lié à votre dépôt GitHub :
   - Root Directory : `backend-fastapi`
   - Runtime : `Python 3` ou `Docker`
   - Build Command : `pip install -r requirements.txt`
   - Start Command : `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Copiez le **Deploy Hook** généré par Render/Koyeb.
4. Ajoutez-le dans GitHub Secrets sous le nom : `FASTAPI_DEPLOY_WEBHOOK`.

---

## 4. 🔐 Synthèse des Secrets GitHub Actions

Pour tirer parti de 100% de l'automatisation dans `.github/workflows/ci-tests.yml` :

| Nom du Secret | Rôle | Obligatoire ? |
| :--- | :--- | :---: |
| `SYSTALINK_SPRING_WEBHOOK` | Déclenche le redéploiement de Spring Boot sur Systalink après validation des tests | Optionnel si auto-deploy Git est actif |
| `FASTAPI_DEPLOY_WEBHOOK` | Déclenche le redéploiement du conteneur FastAPI | Optionnel |
| `GH_API_TOKEN` | Token GitHub perso pour éviter le rate-limit des tests d'API GitHub | Recommandé |

---

## 5. ✅ Tester la chaîne complète

Pour valider le pipeline :
1. Faites vos modifications de code.
2. Committez et poussez :
   ```bash
   git add .
   git commit -m "feat: mon amélioration"
   git push origin main
   ```
3. Rendez-vous dans l'onglet **Actions** de votre dépôt GitHub (`https://github.com/HachimouAkram/AfriDev-Hub/actions`).
4. Vous verrez le workflow s'exécuter en temps réel :
   - 🐍 Tests FastAPI
   - ☕ Tests Spring Boot
   - 🅰️ Tests et Build Angular
   - 🚀 Déclenchement automatique des déploiements
   - 📋 Rapport récapitulatif généré automatiquement !
