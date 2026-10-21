# 🌍 AfriDev Hub — Infrastructure Panafricaine de Réputation, Collaboration & Carrière pour Développeurs

<div align="center">

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Angular](https://img.shields.io/badge/Angular-18.2+-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**« Construite par les devs africains, pour les devs africains & l'écosystème tech mondial »**

*Plateforme tout-en-un de valorisation du talent tech en Afrique : Réputation vérifiée par les pairs, Moteur de matching IA, Vitrine de projets avec collaboration Kanban, Hub d'opportunités, Événements tech et Leaderboard panafricain.*

</div>

---

## 📑 Sommaire

1. [🌍 Vision & Problématique Résolue](#1--vision--problématique-résolue)
2. [🏛️ Architecture Système Hybride](#2-️-architecture-système-hybride)
3. [✨ Fonctionnalités Clés Détaillées](#3--fonctionnalités-clés-détaillées)
   - [3.1 Authentification Sécurisée & Multi-Méthodes](#31-authentification-sécurisée--multi-méthodes)
   - [3.2 Profils & Synchronisation GitHub Temps Réel](#32-profils--synchronisation-github-temps-réel)
   - [3.3 Système d'Évaluation Factuelle par les Pairs](#33-système-dévaluation-factuelle-par-les-pairs)
   - [3.4 Réseau Panafricain & Algorithme de Matching IA](#34-réseau-panafricain--algorithme-de-matching-ia)
   - [3.5 Vitrine Projets & Espace Collaboration Kanban](#35-vitrine-projets--espace-collaboration-kanban)
   - [3.6 Hub d'Opportunités & Recrutement](#36-hub-dopportunités--recrutement)
   - [3.7 Hub d'Événements Tech & Hackathons](#37-hub-dévénements-tech--hackathons)
   - [3.8 Gamification, Niveaux XP & Leaderboard](#38-gamification-niveaux-xp--leaderboard)
   - [3.9 Messagerie Instantanée & Centre de Notifications](#39-messagerie-instantanée--centre-de-notifications)
   - [3.10 Back-Office d'Administration, Modération & Audit](#310-back-office-dadministration-modération--audit)
4. [🧠 Algorithmes & Modèles d'Intelligence Artificielle (FastAPI)](#4--algorithmes--modèles-dintelligence-artificielle-fastapi)
5. [🛠️ Stack Technologique Complète](#5-️-stack-technologique-complète)
6. [🚀 Guide d'Installation & Lancement Pas-à-Pas](#6--guide-dinstallation--lancement-pas-à-pas)
7. [⚙️ Configuration & Variables d'Environnement](#7-️-configuration--variables-denvironnement)
8. [📡 Spécifications des Endpoints de l'API](#8--spécifications-des-endpoints-de-lapi)
9. [🗄️ Modèle de Données (PostgreSQL)](#9-️-modèle-de-données-postgresql)
10. [🔒 Sécurité, Confidentialité & OWASP](#10--sécurité-confidentialité--owasp)
11. [🎬 Déroulement de Démonstration (Guide Concours)](#11--déroulement-de-démonstration-guide-concours)

---

## 1. 🌍 Vision & Problématique Résolue

L'Afrique connaît la croissance tech la plus rapide au monde (+21% de développeurs par an), mais l'écosystème fait face à des obstacles structurels majeurs :
- **Déficit de confiance & méfiance professionnelle** : Difficulté pour les recruteurs locaux et internationaux de vérifier les compétences réelles au-delà d'un simple CV auto-déclaré.
- **Manque de métriques factuelles** : Les avis sur les réseaux traditionnels reposent souvent sur la complaisance plutôt que sur du travail collaboratif vérifié.
- **Fragmentation de l'écosystème continental** : Les développeurs de Dakar, Nairobi, Lagos, Tunis ou Kigali collaborent peu ensemble faute d'une plateforme dédiée unifiée.

### La Réponse d'AfriDev Hub :
1. **Évaluation par les pairs conditionnée à des faits** : Impossible de noter un collègue sans preuve vérifiable de collaboration partagée (pull request GitHub ou dépôt commun accepté).
2. **Score de réputation multicritères sur 5.0** : Pondéré par la crédibilité de l'évaluateur (vérification d'identité Mobile Money, complétion du profil).
3. **Moteur d'appariement IA** : Rapprochement intelligent entre compétences, opportunités et partenaires basé sur l'indice de Jaccard, la synergie des rôles et la géolocalisation.
4. **Collaboration active sur projets** : Au-delà de la vitrine, une suite collaborative intégrée avec gestion d'équipe et tableau Kanban.
5. **Couverture des 54 pays africains** avec adaptation aux réalités locales (connexions 3G/faible débit, Mobile Money, authentification par code OTP email).

---

## 2. 🏛️ Architecture Système Hybride

AfriDev Hub est conçu sur une architecture microservices hybride découplant l'orchestration métier relationnelle de l'intelligence computationnelle et du scraping asynchrone :

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Frontend Client                                        │
│                 Angular 18+ (Standalone, Signals, RxJS, Responsive PWA)                │
│                 Port: 4200 | Reverse-Proxy vers API Gateway Backend                   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Requêtes HTTP / REST + Bearer JWT
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  Backend Core Gateway                                  │
│                              Spring Boot 3.3.4 (Java 21)                               │
│                         Port: 8081 | Context Path: /api/v1                             │
│                                                                                        │
│  - Spring Security (Filtres Stateless, JWT HS256)                                     │
│  - Gestion Métier : Profils, Réseau, Projets, Kanban, Événements, Offres, Chat        │
│  - Notification Service & Mails HTML (Brevo SMTP via port 587)                        │
│  - Stockage Médias Cloudinary (Avatars, Logos, Captures de projets)                   │
└───────────────────────┬───────────────────────────────┬────────────────────────────────┘
                        │                               │
       Appels HTTP REST │                               │ Accès persistance
       (Moteur IA/Stats)│                               │
                        ▼                               ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────────────────────┐
│  Service IA & Analytics FastAPI │   │         Bases de Données & Caches                │
│      Python 3.12 (Port 8000)    │   │                                                  │
│                                 │   │  🐘 PostgreSQL 16 (Port 15432)                   │
│ - Scraping & Agrégation GitHub  │   │     Entités JPA relationnelles, contraintes,     │
│ - Algorithme Score Réputation   │   │     indexation géographie & compétences          │
│ - Algorithme de Matching Réseau │   │                                                  │
│   (Jaccard + Synergie + Géo)    │   │  ⚡ Redis 7 (Port 6380)                          │
└───────────────┬─────────────────┘   │     Cache contributions GitHub (TTL 24h),        │
                │                     │     Sessions OTP et vérification email           │
                └─────────────────────┼──────────────────────────────────────────────────┘
                                      │ Cache Read / Write
                                      ▼
```

---

## 3. ✨ Fonctionnalités Clés Détaillées

### 3.1 Authentification Sécurisée & Multi-Méthodes
- **Inscription & Connexion Email/Mot de passe** : Chiffrement BCrypt fort avec politique de complexité.
- **Onboarding panafricain complet** : Choix du rôle (`DEVELOPER`, `RECRUITER`), sélection parmi les **54 pays africains**, saisie de la ville, titre professionnel, biographie et compétences initiales.
- **Authentification sans mot de passe par code OTP (Email)** : Génération de codes à usage unique chiffrés, envoyés par template HTML via Brevo SMTP (durée de validité : 10 minutes) et stockés sous Redis.
- **Google OAuth 2.0 / Google Identity** : Connexion fluide en 1 clic grâce au Google Client ID configuré.
- **Gestion des sessions & déconnexion** : Traçabilité des connexions dans `login_sessions` avec détection d'agent utilisateur et IP.

### 3.2 Profils & Synchronisation GitHub Temps Réel
- **Portfolio complet** : Liens réseaux sociaux, niveau de disponibilité (Temps plein, Freelance, En poste, etc.), salaire/TJM souhaité.
- **Synchronisation GitHub automatisée** : Le microservice FastAPI interroge l'API GitHub, calcule le volume de commits, dépôts publics, étoiles cumulées et extrait la distribution des langages de programmation.
- **Mise en cache Redis 24h** pour éviter les limitations de quotas GitHub API.
- **Badge de vérification d'identité Mobile Money** : Validation téléphonique attribuant un badge de confiance certifié aux profils.
- **Score de complétion dynamique** : Jauge incrémentée à mesure que le profil s'enrichit (bio, avatar, GitHub, compétences, etc.).

### 3.3 Système d'Évaluation Factuelle par les Pairs
- **Verrou de sécurité anti-fraude** : Aucune évaluation arbitraire n'est autorisée. Une collaboration (type Open Source, Mission, Projet d'entreprise) doit d'abord être enregistrée et confirmée réciproquement par les deux membres avec un lien de preuve (PR, dépôt GitHub, URL).
- **Notation sur 4 critères d'ingénierie** :
  1. *Qualité du code* (lisibilité, tests, modularité)
  2. *Profondeur technique* (architecture, résolution de bugs complexes)
  3. *Fiabilité & Délais* (respect des engagements, ponctualité)
  4. *Collaboration & Communication* (esprit d'équipe, écoute, clarté)
- **Recalcul automatique du score de réputation** (sur 5.0) via FastAPI avec pondération selon le niveau de confiance de l'évaluateur.

### 3.4 Réseau Panafricain & Algorithme de Matching IA
- **Annuaire interactif des talents** : Filtres avancés par pays africain, rôle, compétences spécifiques, disponibilité et recherche textuelle plein texte.
- **Suggestions personnalisées propulsées par l'IA** : Détection automatique des profils les plus pertinents à connecter selon un score de correspondance calculé en pourcentage (35% à 99%) et des motifs explicites (*ex: "Compétences communes : Python, Docker", "Excellente réputation certifiée 4.9/5", "Synergie Recruteur - Développeur"*).
- **Système Follow / Unfollow** : Suivi des actualités, projets et activités des pairs de son réseau.

### 3.5 Vitrine Projets & Espace Collaboration Kanban
- **Publication de réalisations tech** : Titre, description riche, captures d'écran, tags technologiques, URL du code source et lien de production (SaaS, Mobile, Web).
- **Reconnaissance par les pairs (Upvotes)** : Les développeurs s'attribuent mutuellement des reconnaissances valorisantes.
- **Section Commentaires & Retours** : Discussions techniques et retours de la communauté sous chaque projet.
- **Suite collaborative intégrée** :
  - **Recrutement d'équipiers** : Les créateurs de projets peuvent ouvrir des postes (développeur front, back, designer, testeur) et recevoir des candidatures internes.
  - **Gestion des membres** : Acceptation / Refus des demandes d'adhésion avec attribution de rôles dans l'équipe.
  - **Tableau de tâches Kanban** : Colonnes dynamiques (*À faire*, *En cours*, *Terminé*) avec gestion de priorités (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), assignation à des membres de l'équipe et attribution d'XP à l'achèvement.

### 3.6 Hub d'Opportunités & Recrutement
- **Offres d'emploi & missions panafricaines** : CDI, CDD, Freelance / Télétravail, Projets Open Source rémunérés ou bénévoles, Stages.
- **Filtres de recherche ciblés** : Par type de contrat, compétences requises, pays, niveau d'expérience et fourchette salariale.
- **Candidature en 1 clic** : Le développeur postule instantanément en attachant son profil vérifié AfriDev Hub, sa lettre de motivation et son CV.
- **Suivi candidat & Espace recruteur** : Statuts d'avancement des candidatures (`PENDING`, `REVIEWING`, `ACCEPTED`, `REJECTED`) avec notification automatique par email.

### 3.7 Hub d'Événements Tech & Hackathons
- **Agrégation d'événements technologiques** : Hackathons continentaux, Conférences, Meetups locaux et Webinaires en ligne.
- **Système de vote & engouement populaire** : Système d'upvote pour mettre en valeur les initiatives les plus attendues par la communauté.
- **Gestion des inscriptions** : Enregistrement des participants et redirection vers les plateformes d'accueil ou de billetterie.

### 3.8 Gamification, Niveaux XP & Leaderboard
- **Système de points d'expérience (XP)** récompensant les contributions de valeur :
  - Publication d'un projet : `+50 XP`
  - Complétion de profil : `+30 XP`
  - Réception d'une reconnaissance : `+15 XP`
  - Réalisation d'une évaluation par les pairs : `+30 à +50 XP` (évalué) / `+15 XP` (évaluateur)
  - Acceptation d'une candidature : `+40 XP`
  - Tâche Kanban achevée : `+20 XP`
  - Collaboration de projet finalisée : `+100 XP`
- **Ligues de Développeurs Panafricains** :
  - 🟢 **Junior** : 0 à 250 XP
  - 🔵 **Senior** : 251 à 750 XP
  - 🟣 **Expert** : 751 à 1 800 XP
  - 🟠 **Tech** : 1 801 à 3 500 XP
  - 👑 **Leader** : 3 501+ XP
- **Classement Panafricain (Leaderboard)** : Tableau d'honneur filtrable à l'échelle continentale ou pays par pays (Top Sénégal, Top Côte d'Ivoire, Top Nigéria, Top Maroc, etc.).

### 3.9 Messagerie Instantanée & Centre de Notifications
- **Discussions privées directes** : Échange fluide de messages entre développeurs et avec les recruteurs.
- **Centre de notifications centralisé** : Alertes en temps réel sur les interactions (nouveau message, demande d'évaluation, vote sur un projet, évolution de candidature).

### 3.10 Back-Office d'Administration, Modération & Audit
- **Modération de contenu** : Signalements (Reports) sur les profils, projets ou offres abusives.
- **Audit Logs immuables** : Enregistrement en base de données de toutes les actions sensibles avec horodatage UTC, opérateur, type d'action et adresse IP d'origine.

---

## 4. 🧠 Algorithmes & Modèles d'Intelligence Artificielle (FastAPI)

Le microservice FastAPI (`backend-fastapi`) opère les calculs scientifiques et algorithmiques pour décharger le backend Spring Boot.

### A. Algorithme de Calcul de Réputation par les Pairs
Le score $S_{\text{global}}$ (noté sur 5.0) est calculé par une combinaison linéaire pondérée :

$$S_{\text{global}} = (0.30 \times C_{\text{code}}) + (0.30 \times P_{\text{tech}}) + (0.20 \times F_{\text{fiabilité}}) + (0.20 \times K_{\text{collab}})$$

**Pondération de l'évaluateur ($W_{\text{eval}}$) :**
Pour éviter les attaques par sybille ou comptes fictifs, chaque avis est multiplié par la crédibilité propre de son auteur :

$$W_{\text{eval}} = \left(1.0 + 0.25 \times \mathbb{I}_{\text{MobileMoneyVerified}}\right) \times \max\left(0.5, \frac{\text{ProfileCompletionScore}}{100}\right)$$

### B. Algorithme de Matching Réseau & Recommandation
L'algorithme de suggestion (`/api/v1/suggestions/network`) analyse les profils candidats et attribue un score sur 100 points :

1. **Similarité de Compétences (Indice de Jaccard - Max 40 pts)** :
   $$J(A, B) = \frac{|A \cap B|}{|A \cup B|} \times 40$$
2. **Synergie des Rôles (Max 30 pts)** :
   - Recruteur $\leftrightarrow$ Développeur : `30 pts` (Appariement optimal offre/demande)
   - Développeur $\leftrightarrow$ Recruteur : `25 pts`
   - Développeur $\leftrightarrow$ Développeur : `20 pts` (Synergie de collaboration technique)
3. **Réputation Certifiée par les Pairs (Max 20 pts)** :
   $$\text{Pts}_{\text{rep}} = \frac{\min(Score, 5.0)}{5.0} \times 20$$
4. **Proximité Géographique (Max 10 pts)** :
   - Même pays africain : `+7 pts`
   - Même ville : `+3 pts` supplémentaires
5. **Score final** : Borné entre 35% et 99% avec génération dynamique des explications de matching.

---

## 5. 🛠️ Stack Technologique Complète

| Composant | Technologie | Version | Rôle & Justification |
| :--- | :--- | :--- | :--- |
| **Frontend** | Angular | `18.2+` | Architecture moderne Standalone, Signals réactifs, Routage dynamique, SCSS Design System sans dépendances lourdes. |
| **Backend Core** | Spring Boot | `3.3.4` | Java 21, Spring Security (Stateless JWT), Spring Data JPA, Hibernate, Brevo Mailer, Validation Jakarta. |
| **Microservice IA** | FastAPI | `0.110+` | Python 3.12, Uvicorn asynchrone, Pydantic v2, HTTPX, Moteur de matching et scraping GitHub. |
| **Base Relationnelle** | PostgreSQL | `16-alpine` | Persistance relationnelle ACID, intégrité référentielle, indexation avancée des compétences et pays. |
| **Cache & Sessions** | Redis | `7-alpine` | Cache contributions GitHub (TTL 24h), stockage temporaire des codes OTP email. |
| **Stockage Médias** | Cloudinary | `1.39+` | Hébergement cloud haute disponibilité et optimisation automatique des images (avatars, screenshots). |
| **Service Email** | Brevo SMTP | `Port 587` | Envoi transactionnel des codes de vérification OTP et alertes de candidatures en HTML responsive. |
| **Conteneurs** | Docker & Compose | `v2+` | Déploiement et orchestration locale des services PostgreSQL et Redis en 1 commande. |

---

## 6. 🚀 Guide d'Installation & Lancement Pas-à-Pas

### Prérequis Système
- **Java Development Kit (JDK)** : Version 21 ou supérieure (`java -version`)
- **Maven** : Version 3.8+ (`mvn -version`)
- **Python** : Version 3.11 ou 3.12 (`python --version`)
- **Node.js** : Version 18.x ou 20.x et npm (`node -v` / `npm -v`)
- **Docker & Docker Compose** (`docker compose version`)

---

### Étape 1 : Cloner le Répertoire & Configurer les Variables
```bash
# Cloner le projet
git clone https://github.com/HachimouAkram/AfriDev-Hub.git
cd AfriDev-Hub

# Préparer le fichier d'environnement (si besoin d'ajustements spécifiques)
cp .env.example .env
```

---

### Étape 2 : Démarrer l'Infrastructure de Données (Docker)
Démarrez les conteneurs PostgreSQL et Redis en arrière-plan :
```bash
docker compose up -d
```
*Vérification :*
- PostgreSQL est accessible sur `localhost:15432` (Base : `afridev_db`, User : `afridev`)
- Redis est accessible sur `localhost:6380` (Mot de passe : `redis_secret`)

---

### Étape 3 : Démarrer le Microservice IA & Analytics (FastAPI)
```bash
cd backend-fastapi

# Créer et activer un environnement virtuel (optionnel mais conseillé)
python -m venv venv
# Sur Windows :
.\venv\Scripts\activate
# Sur Linux / Mac :
# source venv/bin/activate

# Installer les dépendances Python
pip install -r requirements.txt

# Lancer le serveur FastAPI avec rechargement automatique
uvicorn app.main:app --reload --port 8000
```
- ✅ **API Root :** `http://localhost:8000/`
- 🩺 **Health Check :** `http://localhost:8000/health`
- 📚 **Documentation Swagger interactive :** `http://localhost:8000/docs`

---

### Étape 4 : Démarrer le Backend Core (Spring Boot)
Ouvrez un nouveau terminal dans la racine du projet :
```bash
cd backend-spring

# Compiler et exécuter l'application Spring Boot
mvn spring-boot:run
```
- ✅ **Context Path API :** `http://localhost:8081/api/v1`
- 🩺 **Point de santé :** `http://localhost:8081/api/v1/health`

---

### Étape 5 : Démarrer l'Application Web (Frontend Angular)
Ouvrez un troisième terminal dans la racine du projet :
```bash
cd frontend-angular

# Installer les packages npm
npm install

# Démarrer le serveur de développement avec reverse-proxy intégré
npm start
```
- 🌐 **Application Web AfriDev Hub :** `http://localhost:4200`

> **Note :** La commande `npm start` utilise la configuration `proxy.conf.json` qui redirige automatiquement toutes les requêtes `/api/v1/*` vers le backend Spring Boot (`http://localhost:8081`).

---

## 7. ⚙️ Configuration & Variables d'Environnement

Le projet est préconfiguré pour fonctionner immédiatement avec les conteneurs Docker locaux ou avec des bases managées Cloud. Vous pouvez surcharger les valeurs dans votre environnement ou dans le fichier `.env` :

| Variable | Description | Valeur par défaut |
| :--- | :--- | :--- |
| `PORT` | Port d'écoute Spring Boot | `8081` |
| `DB_HOST` | Hôte PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `15432` |
| `DB_NAME` | Nom de la base de données | `afridev_db` |
| `DB_USER` / `DB_PASSWORD` | Identifiants PostgreSQL | `afridev` / `afridev_secret` |
| `REDIS_HOST` | Hôte Redis | `localhost` |
| `REDIS_PORT` | Port Redis | `6380` |
| `REDIS_PASSWORD` | Mot de passe Redis | `redis_secret` |
| `FASTAPI_BASE_URL` | URL du microservice FastAPI | `http://localhost:8000` |
| `JWT_SECRET` | Clé secrète de signature des jetons JWT | *Chaîne 256 bits sécurisée* |
| `JWT_EXPIRATION_MS` | Durée de validité du token | `604800000` (7 jours) |
| `SPRING_MAIL_HOST` | Serveur SMTP d'envoi d'emails | `smtp-relay.brevo.com` |
| `SPRING_MAIL_PORT` | Port SMTP Brevo | `587` |
| `CLOUDINARY_CLOUD_NAME` | Identifiant Cloudinary | Préconfiguré pour la démo |

---

## 8. 📡 Spécifications des Endpoints de l'API

Toutes les routes du Backend Core sont préfixées par `/api/v1`.

### 🔑 Authentification (`/api/v1/auth`)
| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Inscription nouvel utilisateur avec pays, rôle et compétences | Public |
| `POST` | `/auth/login` | Connexion classique par email et mot de passe | Public |
| `POST` | `/auth/google` | Connexion ou inscription automatique via Google OAuth ID | Public |
| `POST` | `/auth/email/request-otp` | Demande d'un code OTP à usage unique par email (Brevo) | Public |
| `POST` | `/auth/email/verify-otp` | Validation du code OTP et délivrance du JWT | Public |
| `GET` | `/auth/me` | Informations et profil du compte authentifié | Connecté |

### 👤 Profils & Synchronisation (`/api/v1/profiles`)
| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/profiles` | Annuaire paginé avec filtres (pays, compétences, recherche) | Public |
| `GET` | `/profiles/{id}` | Détail du profil public d'un développeur | Public |
| `PUT` | `/profiles/me` | Mise à jour des informations de son profil | Connecté |
| `POST` | `/profiles/me/sync-github` | Synchronisation temps réel via FastAPI + cache Redis | Connecté |
| `POST` | `/profiles/me/verify-mobile-money` | Attribution du badge d'identité vérifiée Mobile Money | Connecté |

### 🌐 Réseau & Recommandation IA (`/api/v1/network`)
| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/network/users` | Annuaire avec tri suggéré et filtres multi-critères | Public / Connecté |
| `GET` | `/network/suggestions` | Suggestions IA de pairs personnalisées avec motifs | Connecté |
| `POST` | `/network/follow/{userId}` | Suivre un profil de la communauté | Connecté |
| `DELETE` | `/network/follow/{userId}` | Ne plus suivre un profil | Connecté |

### 🚀 Projets & Collaboration Kanban (`/api/v1/projects`)
| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects` | Liste paginée des projets communautaires | Public |
| `POST` | `/projects` | Publication d'un nouveau projet | Connecté |
| `POST` | `/projects/{id}/recognize` | Vote de reconnaissance unique par utilisateur | Connecté |
| `DELETE` | `/projects/{id}/recognize` | Annulation d'un vote de reconnaissance | Connecté |
| `POST` | `/projects/{id}/comments` | Ajout d'un commentaire sur un projet | Connecté |
| `POST` | `/projects/{id}/collaboration/members` | Postuler pour rejoindre l'équipe d'un projet | Connecté |
| `GET` | `/projects/{id}/collaboration/members` | Liste des équipiers et de leurs rôles | Public |
| `PATCH` | `/projects/{id}/collaboration/members/{memberId}` | Valider ou rejeter un membre | Créateur |
| `POST` | `/projects/{id}/collaboration/tasks` | Création d'une tâche Kanban | Équipe |
| `GET` | `/projects/{id}/collaboration/tasks` | Liste des tâches Kanban par colonne | Équipe |
| `PATCH` | `/projects/{id}/collaboration/tasks/{taskId}` | Déplacement d'une tâche (Statut / Priorité) | Équipe |

### 💼 Opportunités & Emploi (`/api/v1/opportunities`)
| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/opportunities` | Recherche d'offres (CDI, Freelance, Open Source, Stage) | Public |
| `POST` | `/opportunities` | Publication d'une nouvelle opportunité d'embauche | Recruteur |
| `POST` | `/opportunities/{id}/apply` | Postuler en 1 clic avec profil AfriDev rattaché | Développeur |
| `GET` | `/opportunities/{id}/applications` | Liste des candidats ayant postulé | Recruteur |
| `PATCH` | `/opportunities/applications/{appId}/status` | Mise à jour du statut d'une candidature | Recruteur |

### ⭐️ Évaluations & Réputation (`/api/v1/evaluations` & `/collaborations`)
| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/collaborations` | Déclaration d'une collaboration avec preuve vérifiable | Connecté |
| `POST` | `/collaborations/{id}/verify` | Validation réciproque de la collaboration par le pair | Pair |
| `POST` | `/evaluations` | Soumission de la notation 4 critères (si collaboration vérifiée) | Pair validé |
| `GET` | `/evaluations/score/{userId}` | Calcul du score de réputation consolidé | Public |

### 📅 Événements Tech (`/api/v1/events`)
| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/events` | Catalogue des hackathons, conférences et meetups | Public |
| `POST` | `/events` | Déclaration d'un événement tech | Connecté |
| `POST` | `/events/{id}/vote` | Voter / manifester son intérêt pour un événement | Connecté |

### 🏆 Leaderboard & XP (`/api/v1/leaderboard`)
| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/leaderboard` | Top développeurs panafricains par XP et réputation | Public |
| `GET` | `/leaderboard/country/{country}` | Classement spécifique à un pays africain | Public |

### 💬 Messagerie & Notifications (`/api/v1/messages` & `/notifications`)
| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/messages/conversations` | Liste des conversations actives | Connecté |
| `POST` | `/messages/send` | Envoi d'un message direct à un utilisateur | Connecté |
| `GET` | `/notifications` | Liste des notifications et alertes reçues | Connecté |
| `PATCH` | `/notifications/{id}/read` | Marquer une notification comme lue | Connecté |

---

## 9. 🗄️ Modèle de Données (PostgreSQL)

Le schéma de base de données comprend 20 entités relationnelles maillées assurant l'intégrité de l'écosystème :

```text
┌─────────────────┐       1:1       ┌──────────────────┐
│   users         ├─────────────────┤  profiles        │
│  - email        │                 │ - country (54)   │
│  - password     │                 │ - skills, github │
│  - role, level  │                 │ - xp, rep_score  │
└────────┬────────┘                 └────────┬─────────┘
         │                                   │
         ├───────────────────────────────────┼────────────────────────────────────┐
         │ 1:N                               │ 1:N                                │ 1:N
         ▼                                   ▼                                    ▼
┌──────────────────┐               ┌───────────────────┐                ┌──────────────────┐
│  projects        │               │  collaborations   │                │  evaluations     │
│ - title, tags    │               │ - proof_url       │◄───────────────┤ - 4 critères     │
│ - recognitions   │               │ - is_verified     │  (Verrou)      │ - score_total    │
└────────┬─────────┘               └───────────────────┘                └──────────────────┘
         │
         ├───────────────────────────────────┐
         │ 1:N                               │ 1:N
         ▼                                   ▼
┌──────────────────┐               ┌───────────────────┐
│ project_members  │               │ project_tasks     │
│ - member_status  │               │ - kanban_column   │
│ - role_in_team   │               │ - priority, xp    │
└──────────────────┘               └───────────────────┘
```

---

## 10. 🔒 Sécurité, Confidentialité & OWASP

1. **Architecture "Deny by Default"** : Toutes les routes nécessitent un token JWT valide, à l'exception explicite des points d'accès publics (`/auth/**`, lecture seule de l'annuaire et des projets).
2. **Protection CSRF & Stateless JWT** : Authentification Bearer token avec signature cryptographique HS256 stockée de manière sécurisée côté client.
3. **Validation rigoureuse des DTOs** :
   - Côté Spring Boot : Annotations `@Valid`, `@NotBlank`, `@Size`, `@Email` empêchant les injections.
   - Côté FastAPI : Schémas stricts Pydantic v2 typés et validés à l'entrée.
4. **Intégrité de l'évaluation par les pairs** : Impossible d'injecter une notation sans collaboration validée en base de données.
5. **Registre d'Audit Immuable (`audit_logs`)** : Chaque opération administrative sensible est tracée avec horodatage UTC, opérateur, description et adresse IP.

---

## 11. 🎬 Déroulement de Démonstration (Guide Concours)

Voici le scénario idéal en 5 minutes pour présenter la puissance du projet devant un jury :

| Temps | Écran / Action | Ce que le jury voit & retient |
| :--- | :--- | :--- |
| **0:00 - 1:00** | **Landing Page & Inscription** (`/register`) | Design System sombre moderne adapté aux débits africains. Sélection d'un pays parmi les 54 nations africaines. Jauge de complétion de profil interactive. |
| **1:00 - 2:00** | **Synchronisation GitHub (FastAPI)** | Clique sur "Synchroniser GitHub". Le microservice FastAPI scrape et agrège les dépôts, étoiles et distribution des langages en temps réel avec cache Redis. |
| **2:00 - 3:00** | **Vitrine Projets & Collaboration Kanban** | Consultation des projets panafricains. Vote de reconnaissance par les pairs. Espace équipe avec gestion des membres et tableau Kanban de tâches récompensées en XP. |
| **3:00 - 4:00** | **Évaluation par les Pairs & Règle de Confiance** | Tentative de noter un collègue sans preuve : l'API bloque la notation. Déclaration d'une collaboration avec lien de PR, validation croisée puis calcul du score de réputation sur 5.0. |
| **4:00 - 5:00** | **Matching IA & Leaderboard** | Page `/network` : l'algorithme IA affiche les développeurs recommandés avec les motifs de matching en %. Consultation du `/leaderboard` avec les ligues (Junior à Leader 👑). |

---

<div align="center">

**AfriDev Hub — Fait avec passion pour l'avenir numérique du continent africain 🌍🚀**  
*Document soumis dans le cadre du concours panafricain de développement (Version 1.0 - 2026).*

</div>
