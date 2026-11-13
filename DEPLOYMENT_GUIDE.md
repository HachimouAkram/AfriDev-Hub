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
  │   Frontend   │   │  Systalink   │   │  FastAPI     │
  │(Docker/Node) │   │(Spring Boot) │   │ (Microserv.) │
  │ Auto-déployé │   │ Auto-déployé │   │ Auto-déployé │
  │  via Webhook │   │  via Webhook │   │  via Webhook │
  └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 1. 🅰️ Frontend Angular (Conteneur Docker / Node) — Déploiement Automatique

- **Hébergement :** Conteneur Docker (Node 20 Alpine + Angular dist + `server.js` reverse-proxy)
- **Fonctionnement :**
  - Utilise le [Dockerfile](Dockerfile) multi-stage à la racine du projet.
  - Le serveur Node `server.js` sert les fichiers compilés d'Angular et relaie de manière transparente les requêtes `/api/v1` vers le backend Spring Boot via la variable d'environnement `BACKEND_URL`.
- **URL de production :** `https://afridevhub.economestore.com` (ou votre nom de domaine configuré)
- **Déclenchement automatique :**
  - Via auto-déploiement Git sur votre hébergeur (Systalink, VPS Docker, etc.).
  - Ou via webhook dans GitHub Actions avec le secret `SYSTALINK_FRONTEND_WEBHOOK`.

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

## 3. 🐍 Microservice FastAPI (Déployé sur Render) — 100% Automatique

Le microservice FastAPI est hébergé sur **Render**.

### Comment fonctionne l'automatisation avec Render :
1. **Auto-Deploy natif Render (Activé par défaut) :**
   - Comme votre service Render est connecté à la branche `main` du dépôt GitHub `HachimouAkram/AfriDev-Hub`, Render déclenche **automatiquement** le re-build et le redéploiement dès que vous faites un `git push origin main`.
2. **Déclenchement via GitHub Actions (Optionnel mais recommandé) :**
   - Notre workflow GitHub Actions contient déjà le secret `RENDER_FASTAPI_WEBHOOK`.
   - Si vous souhaitez que GitHub Actions déclenche Render uniquement après le succès des tests :
     1. Dans votre tableau de bord **Render** > Votre Service FastAPI > **Settings** > **Deploy Hook**.
     2. Copiez l'URL (format: `https://api.render.com/deploy/srv-xxxx?key=yyyy`).
     3. Dans GitHub : **Settings** > **Secrets and variables** > **Actions** > Ajoutez `RENDER_FASTAPI_WEBHOOK`.

### ⚠️ Point important : Lier Systalink à Render
Pour que le backend Spring Boot (sur Systalink) communique avec FastAPI (sur Render) :
- Dans le tableau de bord **Systalink** (de l'application Spring Boot), assurez-vous d'avoir configuré la variable d'environnement :
  ```env
  FASTAPI_BASE_URL=https://<votre-service-fastapi>.onrender.com
  ```
*(Si Render est en veille ou met quelques secondes à se réveiller, Spring Boot bascule automatiquement sur son algorithme interne Java sans aucune interruption pour l'utilisateur).*

---

## 4. 🔐 Synthèse des Secrets GitHub Actions

Pour tirer parti de 100% de l'automatisation dans `.github/workflows/ci-tests.yml` :

| Nom du Secret | Rôle | Obligatoire ? |
| :--- | :--- | :---: |
| `SYSTALINK_FRONTEND_WEBHOOK` | Déclenche le redéploiement du conteneur Frontend (Docker / Node) après validation des tests | Optionnel si auto-deploy Git est actif |
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
