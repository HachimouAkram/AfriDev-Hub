# 🌍 AfriDev Hub — Infrastructure de Réputation Panafricaine pour Développeurs

> **« Construite par les devs, pour les devs »**  
> Document officiel de soumission et guide de déploiement pour le concours (Version 1.0 - 2026).

---

## 📋 Table des Matières
- [1. Présentation & Problème Résolu](#1-présentation--problème-résolu)
- [2. Architecture Technique Hybride](#2-architecture-technique-hybride)
- [3. Technologies Utilisées](#3-technologies-utilisées)
- [4. Instructions de Lancement Rapide (Guide des Juges)](#4-instructions-de-lancement-rapide-guide-des-juges)
- [5. Spécifications des APIs](#5-spécifications-des-apis)
- [6. Algorithme de Réputation par les Pairs (FastAPI)](#6-algorithme-de-réputation-par-les-pairs-fastapi)
- [7. Sécurité & Conformité OWASP](#7-sécurité--conformité-owasp)

---

## 1. Présentation & Problème Résolu

L'Afrique compte plus de 4,7 millions de développeurs de logiciels avec une croissance annuelle de 21 %. Cependant, la méfiance professionnelle et l'absence de mécanisme d'évaluation vérifiable créent une barrière majeure à la collaboration continentale et internationale.

**AfriDev Hub** apporte une réponse concrète :
- 👤 **Profil unifié** agrégeant les contributions GitHub (scraping temps réel via FastAPI + cache Redis 24h).
- 🤝 **Évaluation par les pairs fondée sur des faits** : Une évaluation ne peut être soumise que si la collaboration (PR, repo commun) a été préalablement confirmée par le partenaire.
- ⭐️ **Score de réputation pondéré sur 4 dimensions** (*Qualité du code, Profondeur technique, Fiabilité & Délais, Collaboration*).
- 💼 **Vitrine de projets et tableau d'opportunités** (CDI, CDD, Freelance, Collaboration Open Source).

---

## 2. Architecture Technique Hybride

```text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Angular 18+                     │
│  - Standalone Components, RxJS / Signals, CSS Moderne       │
│  - Design System sombre, PWA & Optimisé réseaux 3G          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST (JWT Bearer)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend Core - Spring Boot 3                │
│  - Security JWT (HS256) & Inscription Email/OTP             │
│  - Entités JPA : Users, Profiles, Projects, Opportunities,   │
│    Collaborations, Evaluations, AuditLogs, Reports          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐┌──────────────────────────────┐
│ Analytics - FastAPI (Python)││    Redis 7 (Conteneur Docker) │
│ - Sync GitHub GraphQL/REST  ││ - Cache contributions (24h)  │
│ - Algorithme Score Réputation││ - Sessions OTP & PubSub WS  │
└──────────────┬──────────────┘└──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│             PostgreSQL 16 (Conteneur Docker)                │
│  Base de données relationnelle principale                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technologies Utilisées

| Layer | Technologie | Version / Détails |
| :--- | :--- | :--- |
| **Frontend** | Angular | `18.2+` (Standalone components, RxJS, CSS Tokens, HTML5 Semantic) |
| **Backend Core** | Spring Boot | `3.3+` (Java 21, Spring Security, JPA/Hibernate, Lombok, JWT) |
| **Microservice Analytics** | FastAPI | `Python 3.12` (Uvicorn, Pydantic v2, HTTPX, Redis) |
| **Database** | PostgreSQL | `16-alpine` (Docker) |
| **Cache & Sessions** | Redis | `7-alpine` (Docker) |
| **Conteneurisation** | Docker | `docker-compose.yml` |

---

## 4. Instructions de Lancement Rapide (Guide des Juges)

### Étape 1 : Démarrer les bases de données conteneurisées (PostgreSQL & Redis)
```bash
docker compose up -d
```

### Étape 2 : Démarrer le Microservice Analytics FastAPI (Port 8000)
```bash
cd backend-fastapi
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- *Point de santé FastAPI :* `http://localhost:8000/health`

### Étape 3 : Démarrer l'API Core Spring Boot (Port 8080)
```bash
cd backend-spring
mvn spring-boot:run
```
- *Point de santé Spring Boot :* `http://localhost:8080/api/v1/health`

### Étape 4 : Démarrer le Frontend Angular (Port 4200)
```bash
cd frontend-angular
npm start
```
- *Application Web :* `http://localhost:4200`

---

## 5. Spécifications des APIs

### Authentification & Sécurité (`/api/v1/auth`)
- `POST /auth/register` : Inscription d'un développeur (Onboarding 3 min avec sélection des 54 pays africains).
- `POST /auth/login` : Connexion classique par email / mot de passe.
- `POST /auth/email/request-otp` & `/verify-otp` : Connexion/Inscription rapide par code OTP (10 mins TTL).
- `GET /auth/me` : Profil de l'utilisateur authentifié.

### Profils & Synchronisation GitHub (`/api/v1/profiles`)
- `GET /profiles` : Recherche paginée de profils avec filtres par pays/compétences.
- `POST /profiles/me/sync-github` : Déclenche la synchronisation avec le microservice FastAPI et enregistre les contributions GitHub.
- `POST /profiles/me/verify-mobile-money` : Attribue le badge d'identité vérifiée.

### Projets (`/api/v1/projects`)
- `GET /projects` & `POST /projects` : Consultation et publication de projets réels.
- `POST /projects/{id}/recognize` & `DELETE` : Système de vote et de reconnaissance par les pairs.

### Opportunités (`/api/v1/opportunities`)
- `GET /opportunities` & `POST /opportunities` : Offres d'emploi, freelance et collaborations.
- `POST /opportunities/{id}/apply` : Candidature rapide avec profil AfriDev Hub rattaché.

### Évaluations par les Pairs (`/api/v1/evaluations`)
- `POST /collaborations` & `POST /collaborations/{id}/verify` : Déclaration et vérification croisée de preuves de collaboration.
- `POST /evaluations` : Soumission de la notation 4 critères (Code, Technique, Fiabilité, Collaboration).
- `GET /evaluations/score/{userId}` : Calcul et récupération du score global de réputation.

---

## 6. Algorithme de Réputation par les Pairs (FastAPI)

Le microservice FastAPI calcule le score sur 5.0 à partir des 4 dimensions pondérées :
$$\text{Score Global} = (0.30 \times \text{Code}) + (0.30 \times \text{Technique}) + (0.20 \times \text{Fiabilité}) + (0.20 \times \text{Collaboration})$$

**Multiplicateur d'évaluateur :**
$$\text{Poids} = (1.0 + 0.25 \times \text{IsMobileMoneyVerified}) \times \max\left(0.5, \frac{\text{CompletionScore}}{100}\right)$$

---

## 7. Sécurité & Conformité OWASP

1. **Deny by Default** : Filtres Spring Security et jetons JWT signés en HS256.
2. **Protection des entrées** : Validations DTO avec Jakarta `@Valid`, `@NotBlank`, `@Email` et Pydantic v2.
3. **Journal d'Audit** : Toutes les opérations d'administration et de modération sont conservées en base dans `audit_logs` (IP, action, opérateur, timestamp).

---

*Projet développé pour le concours AfriDev Hub 2026.*
