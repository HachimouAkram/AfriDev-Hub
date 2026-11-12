# 🌍 AfriDev Hub — Infrastructure Panafricaine de Réputation, Collaboration & Carrière pour Développeurs

<div align="center">

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Angular](https://img.shields.io/badge/Angular-18.2+-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![SasPay](https://img.shields.io/badge/SasPay-Mobile_Money-10B981?style=for-the-badge)](https://saspay.me/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**« Construite par les devs africains, pour les devs africains & l'écosystème tech mondial »**

*Plateforme complète de valorisation du talent tech en Afrique : Réputation vérifiée par les pairs, Moteur de matching IA, Communautés & Groupes avec chat direct, Entraide Tech collaborative, Ressources & Formations monétisées via SasPay, Vitrine de projets avec collaboration Kanban, Hub d'opportunités, Événements tech et Leaderboard panafricain.*

</div>

---

## 📑 Sommaire

1. [🌍 Vision & Ce qu'est AfriDev Hub](#1--vision--ce-quest-afridev-hub)
2. [🏛️ Architecture Système Hybride & Comment c'est Fait](#2-️-architecture-système-hybride--comment-cest-fait)
3. [✨ Ce qui Marche : Panorama Exhaustif des Fonctionnalités](#3--ce-qui-marche--panorama-exhaustif-des-fonctionnalités)
   - [3.1 Authentification Sécurisée & Onboarding Panafricain](#31-authentification-sécurisée--onboarding-panafricain)
   - [3.2 Profils Développeurs & CV Numérique Intégré](#32-profils-développeurs--cv-numérique-intégré)
   - [3.3 Gamification, Niveaux Rééquilibrés & Leaderboard Panafricain](#33-gamification-niveaux-rééquilibrés--leaderboard-panafricain)
   - [3.4 Évaluation Factuelle par les Pairs (Score de Réputation sur 5.0)](#34-évaluation-factuelle-par-les-pairs-score-de-réputation-sur-50)
   - [3.5 Communautés & Groupes Tech avec Chat en Direct](#35-communautés--groupes-tech-avec-chat-en-direct)
   - [3.6 Entraide Tech & Q&A Collaboratif avec Résolution](#36-entraide-tech--qa-collaboratif-avec-résolution)
   - [3.7 Ressources & Formations (Vidéos, Cours & Monétisation SasPay)](#37-ressources--formations-vidéos-cours--monétisation-saspay)
   - [3.8 Vitrine de Projets & Suite Collaborative Kanban](#38-vitrine-de-projets--suite-collaborative-kanban)
   - [3.9 Hub d'Opportunités, Emploi & Gestion des Candidatures](#39-hub-dopportunités-emploi--gestion-des-candidatures)
   - [3.10 Espace Mentorat & Recommandation IA](#310-espace-mentorat--recommandation-ia)
   - [3.11 Portefeuille Numérique (Wallet) & Paiements Multi-Passerelles](#311-portefeuille-numérique-wallet--paiements-multi-passerelles)
   - [3.12 Messagerie Privée & Centre de Notifications](#312-messagerie-privée--centre-de-notifications)
   - [3.13 Cockpit d'Administration, Modération & Audit Immuable](#313-cockpit-dadministration-modération--audit-immuable)
4. [🧠 Algorithmes & Modèles d'Intelligence Artificielle (FastAPI)](#4--algorithmes--modèles-dintelligence-artificielle-fastapi)
5. [⚙️ Comment ça Marche Sous le Capot (Flux Techniques)](#5-️-comment-ça-marche-sous-le-capot-flux-techniques)
6. [🛠️ Stack Technologique Complète & Matrice des Versions](#6-️-stack-technologique-complète--matrice-des-versions)
7. [🗄️ Modèle de Données Relationnel (PostgreSQL 20+ Entités)](#7-️-modèle-de-données-relationnel-postgresql-20-entités)
8. [🚀 Guide d'Installation & Lancement Pas-à-Pas](#8--guide-dinstallation--lancement-pas-à-pas)
9. [⚙️ Configuration & Variables d'Environnement](#9-️-configuration--variables-denvironnement)
10. [📡 Spécifications des Endpoints de l'API REST (`/api/v1`)](#10--spécifications-des-endpoints-de-lapi-rest-apiv1)
11. [🔒 Sécurité, Confidentialité & OWASP](#11--sécurité-confidentialité--owasp)
12. [🎬 Déroulement de Démonstration (Scénario Concours & Jury)](#12--déroulement-de-démonstration-scénario-concours--jury)

---

## 1. 🌍 Vision & Ce qu'est AfriDev Hub

L'Afrique connaît une dynamique tech exceptionnelle (+21% de développeurs par an), mais les talents du continent se heurtent à plusieurs freins structurels :
1. **Déficit de confiance & méfiance des recruteurs** : les CVs traditionnels sont purement déclaratifs et difficilement vérifiables.
2. **Évaluations de complaisance** : sur les réseaux sociaux classiques, les recommandations reposent sur des affinités personnelles plutôt que sur des collaborations techniques réelles.
3. **Fragmentation continentale** : les communautés de développeurs à Dakar, Lagos, Casablanca, Moroni, Nairobi ou Kigali restent cloisonnées.
4. **Monétisation complexe** : les créateurs de contenu et formateurs éprouvent de réelles difficultés à vendre leurs cours via les moyens de paiement locaux (Mobile Money).

### La Solution AfriDev Hub :
* **Preuve de travail irréfutable** : notation par les pairs verrouillée par une preuve bilatérale (pull request GitHub ou dépôt partagé confirmé).
* **Indice de réputation factuel sur 5.0** pondéré par la crédibilité réelle de l'évaluateur (vérification Mobile Money, complétion de profil).
* **Gamification équilibrée** : ligues de développeurs structurées jusqu'au niveau Expert (fixé à **2 000 XP**).
* **Écosystème communautaire vivant** : groupes avec photos de couverture, modération (bannissement avec motif), chat direct, entraide technique avec attribution automatique de récompenses.
* **Plateforme de formations et monétisation locale** : cours vidéos et articles techniques monétisables via Mobile Money grâce à **SasPay**.
* **Visionneuse de CV PDF native in-app** : consultation instantanée via flux Blob sécurisé sans téléchargement intempestif.
* **Couverture des 54 pays africains** avec adaptation au multilinguisme (Français, Anglais, etc.) et aux modes sombre/clair.

---

## 2. 🏛️ Architecture Système Hybride & Comment c'est Fait

AfriDev Hub repose sur une architecture microservices hybride découplée, alliant la robustesse transactionnelle d'entreprise de **Java / Spring Boot** aux capacités analytiques asynchrones de **Python / FastAPI** et à la réactivité d'un frontend moderne **Angular 18 Standalone** :

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Frontend Client                                        │
│             Angular 18+ (Standalone Components, Signals, RxJS, Responsive PWA)         │
│                 Port: 4200 (Dev) / Port: 3000 (SSR Express Reverse-Proxy)              │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Requêtes HTTP REST + Bearer JWT + WebSocket (STOMP)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  Backend Core Gateway                                  │
│                              Spring Boot 3.3.4 (Java 21)                               │
│                         Port: 8081 | Context Path: /api/v1                             │
│                                                                                        │
│  - Spring Security (Stateless JWT HS256, Filtres, RBAC)                                │
│  - Modules Métier : Auth, Profils, Groupes, Entraide, Ressources, Projets, Offres, Chat │
│  - WebSocket STOMP Broker : Salons de Chat Groupes & Messagerie Directe                 │
│  - Moteur de Notification & Mails HTML : Brevo SMTP (Port 587)                         │
│  - Passerelle de Paiement & Portefeuille : SasPay Mobile Money, Stripe, UnitechPay     │
│  - Stockage Médias Cloud : Cloudinary API (Avatars, Couvertures, CV PDF, Preuves)     │
└───────────────────────┬───────────────────────────────┬────────────────────────────────┘
                        │                               │
       Appels HTTP REST │                               │ Requêtes JPA / Hibernate
       (Analytique & IA)│                               │ (Pool HikariCP)
                        ▼                               ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────────────────────┐
│  Service IA & Analytics FastAPI │   │         Bases de Données & Caches                │
│      Python 3.12 (Port 8000)    │   │                                                  │
│                                 │   │  🐘 PostgreSQL 16 (Port 15432)                   │
│ - Scraping & Agrégation GitHub  │   │     Persistance relationnelle ACID (20+ entités) │
│ - Algorithme Score Réputation   │   │     Indexation full-text, géolocalisation & tags │
│ - Algorithme de Matching Réseau │   │                                                  │
│   (Jaccard + Synergie + Géo)    │   │  ⚡ Redis 7 (Port 6380)                          │
│ - Assistant IA Communautaire    │   │     Cache contributions GitHub (TTL 24h),        │
└───────────────┬─────────────────┘   │     Codes OTP de connexion (TTL 10 min)          │
                │                     └──────────────────────────────────────────────────┘
                │ Cache Read / Write                    ▲
                └───────────────────────────────────────┘
```

---

## 3. ✨ Ce qui Marche : Panorama Exhaustif des Fonctionnalités

### 3.1 Authentification Sécurisée & Onboarding Panafricain
* **Inscription & Connexion Email/Mot de passe** : hachage BCrypt fort avec politique de complexité.
* **Prise en charge des 54 pays africains** : sélection par drapeau et nom de pays avec indicatif téléphonique et géolocalisation.
* **Choix du Rôle dès l'inscription** : `DEVELOPER` (développeur / apprenant) ou `RECRUITER` (recruteur / entreprise).
* **Authentification sans mot de passe par code OTP (Email)** : génération de codes temporaires à 6 chiffres envoyés par email via **Brevo SMTP**, sécurisés en cache **Redis** avec TTL de 10 minutes.
* **Connexion en 1 clic Google OAuth 2.0** : intégration du SDK Google Identity Services.
* **Traçabilité des connexions** : journalisation de chaque session dans `login_sessions` (adresse IP, User-Agent, horodatage).

### 3.2 Profils Développeurs & CV Numérique Intégré
* **Profil Technique Riche** : biographie, compétences sous forme de tags interactifs, disponibilité (Temps plein, Freelance, En poste), salaire/TJM souhaité et liens sociaux (GitHub, LinkedIn, Portfolio).
* **Synchronisation GitHub Temps Réel** : interrogation automatique des dépôts publics, extraction du volume de commits, cumul des étoiles et analyse de la répartition des langages via FastAPI avec mise en cache Redis 24h.
* **Gestion & Téléversement de CV PDF** :
  * Upload sécurisé sur Cloudinary en tant que document brut (`resource_type: raw`).
  * Stockage persistant de l'URL du document dans le profil du développeur.
* **Visionneuse de CV Native In-App** :
  * Clic sur **« Voir mon CV »** ou sur la carte CV : affichage immédiat dans un **modal responsive in-app** sans quitter la plateforme.
  * Exploitation d'un flux **Blob natif** (`application/pdf`) évitant les téléchargements intempestifs et contournant les restrictions de serveurs distants.
  * Commandes intégrées : **Plein écran** dans un nouvel onglet et bouton de **Téléchargement direct**.
  * Affichage clair pour les tiers et recruteurs lorsque le candidat n'a pas encore téléversé son CV.
* **Badge de Vérification Mobile Money** : certification de confiance attestant de l'identité vérifiée du développeur.
* **Jauge Dynamique de Complétion de Profil** : calcul réactif du taux de complétion (0 à 100%) encourageant l'enrichissement des données.

### 3.3 Gamification, Niveaux Rééquilibrés & Leaderboard Panafricain
* **Nouveau Barème d'XP Rééquilibré** :

| Échelon | Niveau | Badge | Intervalle XP | Rôle & Réputation |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Junior** | 🟢 | **0 – 499 XP** | Apprenant & Développeur junior en montée en compétences |
| **2** | **Senior** | 🔵 | **500 – 1 999 XP** | Développeur confirmé, contributions actives et collaborations régulières |
| **3** | **Expert** | 🟣 | **2 000 – 3 999 XP** | Développeur d'élite, haute réputation, mentorat et projets majeurs |
| **4** | **Tech Lead** | 🟠 | **4 000 – 6 999 XP** | Pilier technique, leadership d'équipe et formations reconnues |
| **5** | **Leader** | 👑 | **7 000+ XP** | Figure incontournable de l'écosystème tech continental |

* **Règles d'Attribution d'XP Précises & Factuelles** :
  * Publication d'un projet tech : `+50 XP`
  * Publication d'une ressource ou vidéo de formation : `+20 XP` (automatique, non manipulable par l'utilisateur)
  * Consultation unique d'une formation par un développeur : `+1 XP` attribué au créateur
  * Réalisation d'une tâche Kanban dans un projet : `+20 XP`
  * Réception d'une reconnaissance (upvote) sur un projet : `+15 XP`
  * Évaluation certifiée par les pairs : `+30 à +50 XP` pour la personne évaluée / `+15 XP` pour l'évaluateur
  * Collaboration complète finalisée : `+100 XP`
* **Classement Panafricain (Leaderboard)** :
  * Filtre à l'échelle du continent ou filtrable individuellement par pays (Top Sénégal, Top Côte d'Ivoire, Top Comores, Top Nigéria, Top Maroc, etc.).
  * Synchronisation d'état réactive : aucune nécessité de se déconnecter/reconnecter pour constater l'actualisation de ses points d'XP.

### 3.4 Évaluation Factuelle par les Pairs (Score de Réputation sur 5.0)
* **Verrou de Sécurité Anti-Fraude** : impossible de noter un développeur sans preuve d'une collaboration préalable.
* **Processus en 3 étapes** :
  1. *Déclaration de collaboration* : indication du type (Open Source, Freelance, Entreprise) et lien de preuve (PR GitHub, commit, dépôt commun).
  2. *Validation bilatérale* : le pair reçoit une notification et doit obligatoirement valider l'existence de la collaboration.
  3. *Notation multicritères* : notation de 1 à 5 étoiles sur 4 dimensions d'ingénierie :
     * Qualité du code (lisibilité, tests, architecture)
     * Profondeur technique (résolution de problèmes complexes)
     * Fiabilité & Respect des délais
     * Communication & Esprit d'équipe
* **Calcul automatique du Score de Réputation** consolidé par FastAPI et pondéré par la crédibilité propre de l'évaluateur.

### 3.5 Communautés & Groupes Tech avec Chat en Direct
* **Création & Gestion de Groupes** : espaces dédiés par techno (ex: *DevOps Africa*, *Flutter Comores*, *Spring & Angular Africa*) ou par pôle régional.
* **Personnalisation Visuelle Complète** : téléversement d'une **photo de couverture de groupe** et d'un logo hébergés sur Cloudinary.
* **Modération Avancée pour l'Administrateur** :
  * Approbation et refus des demandes d'adhésion.
  * Gestion des rôles : `OWNER`, `ADMIN`, `MEMBER`.
  * **Option de bannissement avec motif obligatoire** pour écarter les comportements inappropriés.
  * Possibilité de lever un bannissement ultérieurement.
  * Modification des métadonnées du groupe ou suppression définitive par l'administrateur.
* **Salons de Chat Textuels en Direct** : communication instantanée via WebSocket STOMP avec historique de messages persisté en base de données.
* **Fils de Discussion & Publications** : partage de messages, d'articles et d'annonces au sein du groupe avec système de commentaires.

### 3.6 Entraide Tech & Q&A Collaboratif avec Résolution
* **Publication de Demandes d'Aide** : formulaire optimisé avec saisie libre multi-technologies (tags interactifs / chips sans liste déroulante restrictive).
* **Cycle de Vie Automatisé** :
  * `Ouverte` : demande publiée en attente de conseils.
  * `En cours` : échanges et réponses en cours par les membres.
  * `Résolue` : l'auteur valide la meilleure réponse et clôture la demande.
* **Discussion Directe Instantanée** : bouton permettant d'ouvrir un modal de messagerie directe avec l'auteur pour lui apporter une solution personnalisée.
* **Reconnaissance de l'Aidant** : attribution de points d'XP et valorisation publique de l'entraide communautaire.

### 3.7 Ressources & Formations (Vidéos, Cours & Monétisation SasPay)
* **Catalogue de Ressources d'Apprentissage** : tutoriels, cours vidéos (intégration YouTube native sans rupture d'iframe), articles techniques et documentations PDF.
* **Modal de Publication Responsive** :
  * Saisie multi-technologies par tags.
  * Choix du type de contenu, de la langue et du niveau requis.
  * Calcul automatique et sécurisé des XP : `+20 XP` à la création et `+1 XP` par consultation unique (champ arbitraire masqué à l'utilisateur pour garantir l'intégrité).
* **Espace Dédié « Mes Ressources & Formations »** :
  * Interface dédiée aux formateurs pour gérer leur catalogue.
  * Possibilité de créer, éditer les détails ou supprimer leurs publications.
* **Monétisation via SasPay Mobile Money** : vente de formations avec paiement direct en monnaie locale et crédit automatique sur le portefeuille (Wallet) du formateur.

### 3.8 Vitrine de Projets & Suite Collaborative Kanban
* **Showcase de Réalisations Tech** : présentation de solutions complètes (SaaS, applications mobiles, plateformes web, librairies open source).
* **Reconnaissances Uniques (Upvotes)** : système de vote valorisant le travail bien fait avec protection contre les votes multiples.
* **Espace d'Équipe & Recrutement d'Équipiers** : les fondateurs de projets peuvent ouvrir des rôles et accepter des candidatures.
* **Tableau Kanban Intégré** :
  * Gestion des colonnes *À faire*, *En cours*, *Terminé*.
  * Attribution de priorités (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  * Assignation des tâches aux membres de l'équipe et gain d'XP à la livraison.

### 3.9 Hub d'Opportunités, Emploi & Gestion des Candidatures
* **Offres Panafricaines & Internationales** : CDI, CDD, Freelance / Télétravail, Stages et Missions Open Source rémunérées.
* **Publication In-App d'Opportunités** : modal accessible directement depuis le tableau de bord recruteur sans redirection forcée vers le site public.
* **Candidature en 1 Clic** : le candidat postule instantanément en rattachant son profil AfriDev Hub, sa lettre et son CV PDF.
* **Espace Recruteur Dédié** :
  * Consultation de la liste des candidats par offre.
  * Visionnage direct du CV et du score de réputation certifié.
  * Gestion du statut de candidature (`PENDING`, `REVIEWING`, `ACCEPTED`, `REJECTED`) avec notification automatique par email.

### 3.10 Espace Mentorat & Recommandation IA
* **Annuaire des Mentors Tech** : développeurs expérimentés et Tech Leads prêts à accompagner des juniors.
* **Appariement Intelligent par IA** : algorithme d'affinité croisant technologies maîtrisées, pays et objectifs de carrière.
* **Demandes de Mentorat & Évaluations** : suivi des séances d'accompagnement et validation des progrès.

### 3.11 Portefeuille Numérique (Wallet) & Paiements Multi-Passerelles
* **Système de Solde Développeur / Formateur** : gestion des devises africaines (KMF, XOF, etc.) pour stocker les revenus générés par les formations ou la vente de projets.
* **Passerelle SasPay Mobile Money** : initiation de paiement via USSD / Push Mobile Money adapté aux Comores et aux pays de la zone CEMAC / UEMOA.
* **Passerelles Alternatives** : Stripe (cartes internationales) et UnitechPay.
* **Demandes de Retrait (Payouts / Withdrawals)** : virement vers compte bancaire ou numéro Mobile Money avec validation par l'administration.

### 3.12 Messagerie Privée & Centre de Notifications
* **Discussions Directes (1-to-1)** : canal de communication fluide entre développeurs et avec les recruteurs.
* **Centre de Notifications Global** : alertes en temps réel sur les interactions clés (nouveau message, demande d'évaluation, vote sur un projet, statut de candidature).

### 3.13 Cockpit d'Administration, Modération & Audit Immuable
* **Gestion Globale des Utilisateurs** : consultation des comptes, rôles, statuts et niveaux.
* **Modération des Signalements (Reports)** : traitement des signalements abusifs sur les profils, offres, projets ou messages de groupe.
* **Suspension & Bannissement de Comptes** : gel immédiat des accès en cas d'infraction aux conditions d'utilisation.
* **Journal d'Audit Immuable (`audit_logs`)** : historique horodaté en base de données de toutes les actions administratives sensibles avec traçabilité de l'opérateur et de l'adresse IP.

---

## 4. 🧠 Algorithmes & Modèles d'Intelligence Artificielle (FastAPI)

Le microservice FastAPI (`backend-fastapi`) prend en charge la totalité des calculs mathématiques et heuristiques afin de garantir des temps de réponse inférieurs à 50ms sur le backend principal.

### A. Algorithme du Score de Réputation Factuel (Sur 5.0)
Le score de réputation $S_{\text{global}}$ est calculé par une combinaison linéaire pondérée des 4 dimensions d'ingénierie :

$$S_{\text{global}} = (0.30 \times C_{\text{code}}) + (0.30 \times P_{\text{tech}}) + (0.20 \times F_{\text{fiabilité}}) + (0.20 \times K_{\text{collab}})$$

**Pondération de l'Évaluateur ($W_{\text{eval}}$) :**
Pour neutraliser les fermes à clics et comptes fictifs, chaque avis est multiplié par le coefficient de crédibilité de son évaluateur :

$$W_{\text{eval}} = \left(1.0 + 0.25 \times \mathbb{I}_{\text{MobileMoneyVerified}}\right) \times \max\left(0.5, \frac{\text{ProfileCompletionScore}}{100}\right)$$

### B. Algorithme de Matching Réseau & Recommandation
Le moteur d'appariement (`/api/v1/suggestions/network`) analyse les profils candidats et attribue un score sur 100 points :

1. **Similarité de Compétences (Indice de Jaccard - Max 40 pts)** :
   $$J(A, B) = \frac{|A \cap B|}{|A \cup B|} \times 40$$
2. **Synergie des Rôles (Max 30 pts)** :
   * Recruteur $\leftrightarrow$ Développeur : `30 pts` (Appariement optimal offre/demande)
   * Développeur $\leftrightarrow$ Recruteur : `25 pts`
   * Développeur $\leftrightarrow$ Développeur : `20 pts` (Synergie de collaboration technique)
3. **Réputation Certifiée par les Pairs (Max 20 pts)** :
   $$\text{Pts}_{\text{rep}} = \frac{\min(Score, 5.0)}{5.0} \times 20$$
4. **Proximité Géographique Panafricaine (Max 10 pts)** :
   * Même pays africain : `+7 pts`
   * Même ville : `+3 pts` supplémentaires
5. **Score final** : Borné entre 35% et 99% avec explications dynamiques fournies à l'utilisateur (*ex: "Compétences communes : Spring Boot, Angular", "Réputation certifiée 4.9/5", "Synergie Recruteur - Développeur"*).

---

## 5. ⚙️ Comment ça Marche Sous le Capot (Flux Techniques)

### Flux 1 : Consultation Sécurisée du CV en Visionneuse Native
```text
Utilisateur / Recruteur ──[ Clic sur "Voir mon CV" ]──► ProfileDetailComponent
                                                              │
                                            Appel getCvBlob() │ HTTP GET (CORS *)
                                                              ▼
                                                   Cloudinary CDN Storage
                                                              │
                                     Flux binaire %PDF-1.7    ▼
ProfileDetailComponent ◄──[ URL.createObjectURL(blob) ]── ProfileService
        │
        ├──► Affichage instantané dans l'iframe modale in-app
        ├──► Bouton "Plein écran" (ouvre l'URL blob dans un onglet dédié)
        └──► Bouton "Télécharger" (téléchargement direct avec nom propre)
```

### Flux 2 : Publication d'une Ressource & Attribution Logique d'XP
```text
Développeur ──[ Formulaire Publication Ressource ]──► ResourceController (Spring Boot)
                                                              │
                     Validation DTO (Type, Lien, Tags)        ▼
                                                       ResourceService
                                                              │
                                    ┌─────────────────────────┴─────────────────────────┐
                                    ▼                                                   ▼
                         Sauvegarde ResourceEntity                              Appel XpService
                         (BDD PostgreSQL)                                       (+20 XP immédiats)
                                                                                        │
                                                                                        ▼
                                                                             Création XpTransaction
                                                                             Mise à jour DeveloperLevel
```

### Flux 3 : Chat en Direct dans un Groupe Tech (WebSocket STOMP)
```text
Membre du Groupe ──[ Message textuel ]──► WebSocket Endpoint /ws/group-chat
                                                    │
                                     Broker STOMP   ▼
                                         GroupChatController
                                                    │
                     ┌──────────────────────────────┴──────────────────────────────┐
                     ▼                                                             ▼
         Persistance en BDD                                    Diffusion temps réel
         (GroupChatMessageEntity)                              Topic /topic/group.{groupId}
                                                                                   │
                                                                                   ▼
                                                                    Tous les membres connectés
                                                                    au salon reçoivent le message
```

---

## 6. 🛠️ Stack Technologique Complète & Matrice des Versions

| Rôle | Composant | Version | Justification Technique |
| :--- | :--- | :---: | :--- |
| **Frontend Web** | Angular | `18.2+` | Architecture moderne Standalone, Signals réactifs, RxJS, PWA-ready, zéro dépendance UI externe lourde. |
| **Serveur SSR / Proxy** | Node.js / Express | `20+` | Reverse-proxy des requêtes `/api/*` et routage optimisé. |
| **Backend Core** | Spring Boot | `3.3.4` | Java 21, Spring Security Stateless, Spring Data JPA, Hibernate, WebSocket STOMP. |
| **Microservice IA** | FastAPI | `0.110+` | Python 3.12, Uvicorn asynchrone, Pydantic v2, HTTPX, algorithmes de Jaccard et réputation. |
| **Base Relationnelle** | PostgreSQL | `16-alpine` | Intégrité ACID, 20+ tables relationnelles, indexation full-text et géolocalisation. |
| **Cache & Sessions** | Redis | `7-alpine` | Cache contributions GitHub (TTL 24h), stockage sécurisé des codes OTP email. |
| **Stockage Médias & Documents** | Cloudinary | `1.39+` | Hébergement sécurisé des avatars, couvertures de groupes et documents PDF bruts. |
| **Service Email Transactionnel** | Brevo SMTP | `Port 587` | Envoi d'emails transactionnels HTML (codes OTP, alertes de candidatures). |
| **Passerelles de Paiement** | SasPay / Stripe | `v1` | SasPay pour Mobile Money (Comores / Afrique), Stripe pour cartes bancaires internationales. |
| **Conteneurs & Déploiement** | Docker & Compose | `v2+` | Déploiement automatisé en une seule commande de l'infrastructure de données. |

---

## 7. 🗄️ Modèle de Données Relationnel (PostgreSQL 20+ Entités)

Le schéma relationnel garantit une stricte intégrité référentielle :

```text
┌─────────────────┐       1:1       ┌──────────────────┐       1:1       ┌──────────────────┐
│   users         ├─────────────────┤  profiles        ├─────────────────┤  wallets         │
│  - email        │                 │ - country (54)   │                 │ - balance        │
│  - password     │                 │ - cv_url, github │                 │ - currency (KMF) │
│  - role, level  │                 │ - xp, rep_score  │                 └────────┬─────────┘
└────────┬────────┘                 └────────┬─────────┘                          │ 1:N
         │                                   │                                    ▼
         ├─────────────────┐                 ├──────────────────────────┐  ┌──────────────────┐
         │ 1:N             │ 1:N             │ 1:N                      │  │ wallet_tx        │
         ▼                 ▼                 ▼                          │  │ - type, amount   │
┌──────────────────┐ ┌─────────────┐ ┌───────────────────┐              │  └──────────────────┘
│  projects        │ │ login_sess  │ │  collaborations   │              │
│ - title, tags    │ └─────────────┘ │ - proof_url       │◄────────┐    │ 1:N
│ - repo, demo     │                 │ - is_verified     │         │    ▼
└────────┬─────────┘                 └───────────────────┘         │  ┌──────────────────┐
         │                                                         │  │ xp_transactions  │
         ├───────────────────┬───────────────────┐                 │  │ - amount, source │
         │ 1:N               │ 1:N               │ 1:N             │  └──────────────────┘
         ▼                   ▼                   ▼                 │
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐      │
│ project_members  │ │ project_tasks   │ │  evaluations     ├──────┘ (Verrou anti-fraude)
│ - member_status  │ │ - kanban_column │ │ - 4 critères     │
│ - role_in_team   │ │ - priority, xp  │ │ - score_total    │
└──────────────────┘ └─────────────────┘ └──────────────────┘

┌──────────────────┐ 1:N             ┌──────────────────┐ 1:N       ┌──────────────────┐
│  groups          ├─────────────────┤ group_members    ├───────────┤ group_bans       │
│ - name, cover_url│                 │ - role, status   │           │ - reason, date   │
└────────┬─────────┘                 └──────────────────┘           └──────────────────┘
         │ 1:N
         ├───────────────────────────────────────┐
         ▼                                       ▼
┌──────────────────┐                   ┌──────────────────┐
│ group_posts      │                   │ group_channels   │──► group_chat_messages (1:N)
│ - text, media_url│                   │ - type (GENERAL) │
└──────────────────┘                   └──────────────────┘

┌──────────────────┐ 1:N             ┌──────────────────┐ 1:N       ┌──────────────────┐
│ opportunities    ├─────────────────┤ applications     ├───────────┤ resources        │
│ - title, type    │                 │ - cv_url, status │           │ - title, xp, url │
└──────────────────┘                 └──────────────────┘           └──────────────────┘

┌──────────────────┐ 1:N             ┌──────────────────┐
│ help_posts       ├─────────────────┤ help_comments    │
│ - tech_tags, stat│                 │ - is_solution    │
└──────────────────┘                 └──────────────────┘
```

---

## 8. 🚀 Guide d'Installation & Lancement Pas-à-Pas

### Prérequis Système
* **Java Development Kit (JDK)** : Version 21 (`java -version`)
* **Apache Maven** : Version 3.8+ (`mvn -version`)
* **Python** : Version 3.11 ou 3.12 (`python --version`)
* **Node.js** : Version 18.x ou 20.x et npm (`node -v` / `npm -v`)
* **Docker & Docker Compose** (`docker compose version`)

---

### Étape 1 : Cloner le Répertoire
```bash
git clone https://github.com/HachimouAkram/AfriDev-Hub.git
cd AfriDev-Hub
```

---

### Étape 2 : Démarrer PostgreSQL & Redis (Docker)
Lancez les conteneurs de données en arrière-plan :
```bash
docker compose up -d
```
*Vérification des services :*
* **PostgreSQL 16** accessible sur `localhost:15432` (Base : `afridev_db`, User : `afridev`)
* **Redis 7** accessible sur `localhost:6380` (Mot de passe : `redis_secret`)

---

### Étape 3 : Démarrer le Microservice IA & Analytics (FastAPI)
Dans un premier terminal :
```bash
cd backend-fastapi

# Création et activation de l'environnement virtuel
python -m venv venv

# Sur Windows (PowerShell) :
.\venv\Scripts\Activate.ps1
# Sur Linux / macOS :
# source venv/bin/activate

# Installation des dépendances
pip install -r requirements.txt

# Lancement du serveur FastAPI
uvicorn app.main:app --reload --port 8000
```
* **API Root :** `http://localhost:8000/`
* **Health Check :** `http://localhost:8000/health`
* **Swagger OpenAPI :** `http://localhost:8000/docs`

---

### Étape 4 : Démarrer le Backend Core (Spring Boot)
Dans un deuxième terminal :
```bash
cd backend-spring

# Compilation et exécution
mvn spring-boot:run
```
* **API Gateway :** `http://localhost:8081/api/v1`
* **Health Check :** `http://localhost:8081/api/v1/health`

---

### Étape 5 : Démarrer l'Application Web (Frontend Angular)
Dans un troisième terminal :
```bash
cd frontend-angular

# Installation des modules npm
npm install

# Lancement du serveur de développement
npm start
```
* **Application Web AfriDev Hub :** `http://localhost:4200`
*(Les requêtes `/api/v1/*` sont redirigées automatiquement vers le backend `http://localhost:8081`).*

---

## 9. ⚙️ Configuration & Variables d'Environnement

| Variable | Description | Valeur par Défaut |
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
| `JWT_SECRET` | Clé de signature des jetons JWT | *Chaîne cryptographique 256 bits* |
| `JWT_EXPIRATION_MS` | Validité du jeton JWT | `604800000` (7 jours) |
| `SPRING_MAIL_HOST` | Serveur SMTP Brevo | `smtp-relay.brevo.com` |
| `SPRING_MAIL_PORT` | Port SMTP | `587` |
| `CLOUDINARY_CLOUD_NAME` | Identifiant Cloudinary | Configuré pour le projet |
| `SASPAY_API_KEY` | Clé API de paiement SasPay | Clé marchand SasPay |

---

## 10. 📡 Spécifications des Endpoints de l'API REST (`/api/v1`)

Toutes les routes sont préfixées par `/api/v1`.

### 🔑 Authentification (`/auth`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Inscription nouvel utilisateur avec pays (54), rôle et compétences | Public |
| `POST` | `/auth/login` | Connexion classique email & mot de passe | Public |
| `POST` | `/auth/google` | Connexion / Inscription rapide avec Google Identity | Public |
| `POST` | `/auth/email/request-otp` | Demande d'un code OTP à usage unique par email (Brevo) | Public |
| `POST` | `/auth/email/verify-otp` | Validation du code OTP et délivrance du JWT | Public |
| `GET` | `/auth/me` | Profil et rôle du compte connecté | Authentifié |

### 👤 Profils & CV (`/profiles`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/profiles` | Annuaire des développeurs avec filtres (pays, compétences, dispo) | Public |
| `GET` | `/profiles/{id}` | Détail du profil public d'un développeur | Public |
| `PUT` | `/profiles/me` | Mise à jour des informations personnelles et liens | Authentifié |
| `POST` | `/profiles/me/sync-github` | Synchronisation des dépôts et langages GitHub via FastAPI | Authentifié |
| `POST` | `/profiles/me/verify-mobile-money` | Attribution du badge d'identité vérifiée Mobile Money | Authentifié |

### 👥 Communautés & Groupes (`/groups`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/groups` | Liste des communautés tech panafricaines | Public |
| `POST` | `/groups` | Création d'une nouvelle communauté avec couverture | Authentifié |
| `GET` | `/groups/{id}` | Détail d'une communauté et de ses salons | Public |
| `PUT` | `/groups/{id}` | Modification de la communauté et de sa couverture | Admin Groupe |
| `DELETE` | `/groups/{id}` | Suppression définitive de la communauté | Admin Groupe |
| `POST` | `/groups/{id}/join` | Rejoindre un groupe tech | Authentifié |
| `POST` | `/groups/{id}/members/{userId}/ban` | **Bannir un membre du groupe avec motif** | Admin Groupe |
| `DELETE` | `/groups/{id}/members/{userId}/ban` | Dé-bannir un membre | Admin Groupe |
| `GET` | `/groups/{id}/posts` | Publications et actualités du groupe | Membres |
| `POST` | `/groups/{id}/posts` | Publier un message ou une ressource dans le groupe | Membres |

### 💡 Entraide Tech & Q&A (`/help`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/help` | Liste des questions d'entraide avec filtres technologiques | Public |
| `POST` | `/help` | Poser une question technique avec tags multi-technologies | Authentifié |
| `GET` | `/help/{id}` | Détail de la demande et réponses des pairs | Public |
| `POST` | `/help/{id}/comments` | Proposer une solution ou un conseil | Authentifié |
| `PATCH` | `/help/{id}/resolve` | Marquer la question comme résolue et récompenser l'aidant | Auteur |

### 📚 Ressources & Formations (`/resources`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/resources` | Catalogue des cours, tutoriels vidéos et articles | Public |
| `POST` | `/resources` | Publier une formation (+20 XP automatique, monétisable SasPay) | Formateur |
| `GET` | `/resources/my` | Liste des ressources et formations créées par l'utilisateur | Formateur |
| `PUT` | `/resources/{id}` | Modifier les détails d'une ressource existante | Créateur |
| `DELETE` | `/resources/{id}` | Supprimer une ressource ou formation | Créateur |
| `POST` | `/resources/{id}/view` | Enregistrer une vue unique (+1 XP pour le créateur) | Authentifié |

### 🚀 Projets & Collaboration Kanban (`/projects`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects` | Showcase des projets panafricains | Public |
| `POST` | `/projects` | Publication d'un nouveau projet tech (+50 XP) | Authentifié |
| `POST` | `/projects/{id}/recognize` | Vote de reconnaissance unique par utilisateur (+15 XP) | Authentifié |
| `POST` | `/projects/{id}/comments` | Discussion technique sous le projet | Authentifié |
| `POST` | `/projects/{id}/collaboration/members` | Postuler pour rejoindre l'équipe d'un projet | Authentifié |
| `POST` | `/projects/{id}/collaboration/tasks` | Création d'une tâche Kanban dans le projet | Équipe |
| `PATCH` | `/projects/{id}/collaboration/tasks/{taskId}` | Déplacer une tâche Kanban (+20 XP si terminée) | Équipe |

### 💼 Opportunités & Recrutement (`/opportunities`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/opportunities` | Recherche d'offres (CDI, Freelance, Stages, Open Source) | Public |
| `POST` | `/opportunities` | Publication d'une offre d'emploi (depuis le dashboard) | Recruteur |
| `POST` | `/opportunities/{id}/apply` | Postuler en 1 clic avec profil et CV rattachés | Développeur |
| `GET` | `/opportunities/{id}/applications` | Liste des candidats reçus pour une offre | Recruteur |
| `PATCH` | `/opportunities/applications/{appId}/status` | Actualiser le statut d'un candidat (`ACCEPTED`, etc.) | Recruteur |

### ⭐️ Évaluations & Réputation (`/evaluations` & `/collaborations`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/collaborations` | Déclarer une collaboration avec URL de preuve (PR/commit) | Authentifié |
| `POST` | `/collaborations/{id}/verify` | Validation réciproque de la collaboration par le pair | Pair |
| `POST` | `/evaluations` | Soumission de la notation 4 critères (verrouillée si non validée) | Pair vérifié |
| `GET` | `/evaluations/score/{userId}` | Calcul du score de réputation consolidé sur 5.0 | Public |

### 🏆 Leaderboard & XP (`/leaderboard`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/leaderboard` | Top développeurs panafricains par XP et réputation | Public |
| `GET` | `/leaderboard/country/{country}` | Classement spécifique à l'un des 54 pays africains | Public |

### 💳 Portefeuille & Paiements (`/wallet` & `/payments`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/wallet` | Solde actuel et historique des transactions de l'utilisateur | Authentifié |
| `POST` | `/payments/saspay/initiate` | Initialisation d'un paiement Mobile Money via SasPay | Authentifié |
| `POST` | `/payments/saspay/webhook` | Webhook de confirmation de transaction SasPay | Passerelle |
| `POST` | `/wallet/withdraw` | Demande de retrait des gains vers Mobile Money ou Banque | Authentifié |

---

## 11. 🔒 Sécurité, Confidentialité & OWASP

1. **Architecture « Deny by Default »** : tout point d'API requiert un jeton JWT valide sauf exception publique explicite (`/auth/**`, lecture seule de l'annuaire et des projets).
2. **Stateless JWT HS256** : aucun stockage d'état de session sur le serveur, scalabilité horizontale garantie.
3. **Validation Rigoureuse des Données Entrantes** :
   * Côté Spring Boot : annotations Jakarta `@Valid`, `@NotBlank`, `@Size`, `@Email` empêchant les failles XSS et injections SQL.
   * Côté FastAPI : modèles stricts Pydantic v2 assurant le typage et l'intégrité des payloads.
4. **Verrouillage Cryptographique des Évaluations** : impossible de fausser le score de réputation sans preuve vérifiable de collaboration commune.
5. **Journal d'Audit Immuable (`audit_logs`)** : traçabilité complète de chaque action sensible avec horodatage UTC, identifiant de l'opérateur et adresse IP d'origine.

---

## 12. 🎬 Déroulement de Démonstration (Scénario Concours & Jury)

Voici le scénario recommandé en **5 à 7 minutes** pour une soutenance devant un jury :

| Temps | Écran / Action | Ce que le jury voit & retient |
| :--- | :--- | :--- |
| **0:00 - 1:00** | **Landing Page & Inscription Panafricaine** | Sélection d'un pays parmi les 54 nations. Choix du rôle (`DEVELOPER`). Connexion instantanée via OTP email Brevo ou Google OAuth. |
| **1:00 - 2:00** | **Profil Développeur & Visionneuse CV Native** | Synchronisation GitHub temps réel opérée par FastAPI. Clic sur **« Voir mon CV »** : ouverture fluide de la visionneuse PDF in-app sans téléchargement forcé. Affichage du badge de confiance Mobile Money. |
| **2:00 - 3:00** | **Niveaux XP Rééquilibrés & Leaderboard** | Démonstration du palier **Expert à 2 000 XP** et barre de progression réactive. Consultation du Leaderboard avec filtre par pays africain. |
| **3:00 - 4:00** | **Évaluation Factuelle par les Pairs** | Tentative de noter un développeur sans preuve : l'API bloque l'action. Déclaration d'une collaboration avec lien de PR, validation croisée bilatérale et calcul du score de réputation sur 5.0. |
| **4:00 - 5:00** | **Communautés, Chat Direct & Bannissement avec Motif** | Exploration d'un groupe tech avec photo de couverture. Salon de chat textuel en direct. Démonstration de l'option d'exclusion / bannissement de membre avec motif. |
| **5:00 - 6:00** | **Entraide Tech & Formations Monétisées SasPay** | Publication d'une question d'entraide avec tags technologiques et discussion directe avec l'auteur. Espace « Mes Ressources & Formations » avec attribution logique des XP (+20 / +1 par vue) et intégration de paiement SasPay. |
| **6:00 - 7:00** | **Vitrine Projets, Kanban & Hub d'Offres** | Collaboration Kanban d'équipe. Publication d'offre in-app depuis le tableau de bord recruteur et examen des candidatures. |

---

<div align="center">

**AfriDev Hub — Bâti avec rigueur et passion pour l'avenir numérique du continent africain 🌍🚀**  
*Document soumis dans le cadre du concours panafricain de développement (Version Finale - 2026).*

</div>
