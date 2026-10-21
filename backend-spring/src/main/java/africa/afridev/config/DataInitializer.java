package africa.afridev.config;

import africa.afridev.model.entity.*;
import africa.afridev.model.enums.Availability;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.UserStatus;
import africa.afridev.model.enums.*;
import africa.afridev.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectCommentRepository commentRepository;
    private final RecognitionRepository recognitionRepository;
    private final FollowRepository followRepository;
    private final PasswordEncoder passwordEncoder;
    private final TechEventRepository eventRepository;
    private final ProjectTaskRepository taskRepository;
    private final ProjectMemberRepository memberRepository;
    private final africa.afridev.service.XpService xpService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Vérification et initialisation des profils de test...");

        try {
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            jdbcTemplate.execute("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('DEVELOPER', 'RECRUITER', 'ADMIN', 'SUPER_ADMIN'))");
            log.info("Contrainte users_role_check mise à jour avec succès pour inclure SUPER_ADMIN.");
        } catch (Exception e) {
            log.warn("Mise à jour de la contrainte users_role_check : {}", e.getMessage());
        }

        String encodedPassword = passwordEncoder.encode("Password123!");

        // 1. Kwame Osei (DEVELOPER - Ghana)
        UserEntity savedKwame = userRepository.findByEmail("kwame.osei@dev.africa").orElseGet(() -> {
            UserEntity kwameUser = UserEntity.builder()
                    .email("kwame.osei@dev.africa")
                    .passwordHash(encodedPassword)
                    .role(Role.DEVELOPER)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();

            ProfileEntity kwameProfile = ProfileEntity.builder()
                    .user(kwameUser)
                    .fullName("Kwame Osei")
                    .country("Ghana")
                    .city("Accra")
                    .title("Senior Backend & Cloud Engineer")
                    .bio("Développeur passionné par les systèmes distribués haute performance et l'intégration des protocoles Mobile Money.")
                    .skills(List.of("Spring Boot", "PostgreSQL", "Redis", "Docker", "Java 21"))
                    .availability(Availability.OPEN)
                    .completionScore(95)
                    .mobileMoneyVerified(true)
                    .githubUrl("https://github.com/kwame-osei")
                    .linkedinUrl("https://linkedin.com/in/kwame-osei")
                    .build();
            kwameUser.setProfile(kwameProfile);
            return userRepository.save(kwameUser);
        });

        // 2. Fatou Sow (DEVELOPER - Sénégal)
        UserEntity savedFatou = userRepository.findByEmail("fatou.sow@dev.africa").orElseGet(() -> {
            UserEntity fatouUser = UserEntity.builder()
                    .email("fatou.sow@dev.africa")
                    .passwordHash(encodedPassword)
                    .role(Role.DEVELOPER)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();

            ProfileEntity fatouProfile = ProfileEntity.builder()
                    .user(fatouUser)
                    .fullName("Fatou Sow")
                    .country("Sénégal")
                    .city("Dakar")
                    .title("Lead Frontend Architect")
                    .bio("Spécialiste Angular & UI/UX réactive. Engagée pour l'accès aux soins de santé grâce au web hors-ligne (PWA).")
                    .skills(List.of("Angular", "TypeScript", "RxJS", "FastAPI", "CSS Grid"))
                    .availability(Availability.OPEN)
                    .completionScore(90)
                    .mobileMoneyVerified(true)
                    .githubUrl("https://github.com/fatou-sow")
                    .portfolioUrl("https://fatousow.sn")
                    .build();
            fatouUser.setProfile(fatouProfile);
            return userRepository.save(fatouUser);
        });

        // 3. Kofi Mensah (DEVELOPER - Côte d'Ivoire)
        UserEntity savedKofi = userRepository.findByEmail("kofi.mensah@dev.africa").orElseGet(() -> {
            UserEntity kofiUser = UserEntity.builder()
                    .email("kofi.mensah@dev.africa")
                    .passwordHash(encodedPassword)
                    .role(Role.DEVELOPER)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();

            ProfileEntity kofiProfile = ProfileEntity.builder()
                    .user(kofiUser)
                    .fullName("Kofi Mensah")
                    .country("Côte d'Ivoire")
                    .city("Abidjan")
                    .title("Fullstack & Data Engineer")
                    .bio("Concepteur de solutions AgTech et Data Analytics pour l'agriculture connectée en Afrique de l'Ouest.")
                    .skills(List.of("Python", "FastAPI", "Angular", "PyTorch", "PostgreSQL"))
                    .availability(Availability.OPEN)
                    .completionScore(85)
                    .mobileMoneyVerified(true)
                    .githubUrl("https://github.com/kofi-mensah")
                    .zindiUrl("https://zindi.africa/users/kofi-mensah")
                    .build();
            kofiUser.setProfile(kofiProfile);
            return userRepository.save(kofiUser);
        });

        // 4. Sarah Mensah (RECRUITER - Kenya)
        userRepository.findByEmail("sarah.recruiter@tech.africa").orElseGet(() -> {
            UserEntity sarahUser = UserEntity.builder()
                    .email("sarah.recruiter@tech.africa")
                    .passwordHash(encodedPassword)
                    .role(Role.RECRUITER)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();

            ProfileEntity sarahProfile = ProfileEntity.builder()
                    .user(sarahUser)
                    .fullName("Sarah Mensah")
                    .country("Kenya")
                    .city("Nairobi")
                    .title("Head of Tech Talent @ PanAfrica Ventures")
                    .bio("À la recherche constante de talents d'exception en Java, Spring Boot, Angular et Cloud en Afrique.")
                    .skills(List.of("Tech Recruiting", "Java", "Spring Boot", "Angular", "Cloud"))
                    .availability(Availability.OPEN)
                    .completionScore(95)
                    .mobileMoneyVerified(true)
                    .build();
            sarahUser.setProfile(sarahProfile);
            return userRepository.save(sarahUser);
        });

        // 5. Amadou Diallo (RECRUITER - Sénégal)
        userRepository.findByEmail("amadou.diallo@recruit.africa").orElseGet(() -> {
            UserEntity amadouUser = UserEntity.builder()
                    .email("amadou.diallo@recruit.africa")
                    .passwordHash(encodedPassword)
                    .role(Role.RECRUITER)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();

            ProfileEntity amadouProfile = ProfileEntity.builder()
                    .user(amadouUser)
                    .fullName("Amadou Diallo")
                    .country("Sénégal")
                    .city("Dakar")
                    .title("Senior Tech Recruiter @ Wave & Orange")
                    .bio("Spécialiste du recrutement de profils Senior Backend, DevOps et Data Engineers en Afrique de l'Ouest.")
                    .skills(List.of("Recrutement Tech", "Python", "DevOps", "Data Science"))
                    .availability(Availability.OPEN)
                    .completionScore(90)
                    .mobileMoneyVerified(true)
                    .build();
            amadouUser.setProfile(amadouProfile);
            return userRepository.save(amadouUser);
        });

        // 6. Super Admin Cockpit (SUPER_ADMIN - Rwanda / Panafricain)
        String superAdminEmail = "hachimouisidk@groupeisi.com";
        userRepository.findByEmail(superAdminEmail).orElseGet(() -> {
            var existingOld = userRepository.findByEmail("superadmin@afridev.africa");
            if (existingOld.isPresent()) {
                UserEntity oldUser = existingOld.get();
                oldUser.setEmail(superAdminEmail);
                log.info("Migration email Super Admin réussie: superadmin@afridev.africa -> {}", superAdminEmail);
                return userRepository.save(oldUser);
            }
            UserEntity superAdminUser = UserEntity.builder()
                    .email(superAdminEmail)
                    .passwordHash(encodedPassword)
                    .role(Role.SUPER_ADMIN)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();

            ProfileEntity superAdminProfile = ProfileEntity.builder()
                    .user(superAdminUser)
                    .fullName("Super Administrateur AfriDev")
                    .country("Rwanda")
                    .city("Kigali")
                    .title("Directeur des Opérations & Super Admin Panafricain")
                    .bio("Gestion et supervision globale de la plateforme panafricaine AfriDev Hub.")
                    .skills(new java.util.ArrayList<>(List.of("Gouvernance Plateforme", "Sécurité", "Audit", "Panafrican Tech")))
                    .availability(Availability.NOT_AVAILABLE)
                    .completionScore(100)
                    .mobileMoneyVerified(true)
                    .build();
            superAdminUser.setProfile(superAdminProfile);
            return userRepository.save(superAdminUser);
        });

        // 7. Modérateur / Admin (ADMIN - Sénégal)
        userRepository.findByEmail("admin@afridev.africa").orElseGet(() -> {
            UserEntity adminUser = UserEntity.builder()
                    .email("admin@afridev.africa")
                    .passwordHash(encodedPassword)
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();

            ProfileEntity adminProfile = ProfileEntity.builder()
                    .user(adminUser)
                    .fullName("Modérateur AfriDev Hub")
                    .country("Sénégal")
                    .city("Dakar")
                    .title("Responsable Qualité & Modération")
                    .bio("Modération des contenus, traitement des signalements et accompagnement des talents.")
                    .skills(new java.util.ArrayList<>(List.of("Modération", "Relations Communautaires", "Support Développeurs")))
                    .availability(Availability.NOT_AVAILABLE)
                    .completionScore(95)
                    .mobileMoneyVerified(true)
                    .build();
            adminUser.setProfile(adminProfile);
            return userRepository.save(adminUser);
        });

        // Projets et commentaires
        if (projectRepository.count() == 0) {
            ProjectEntity p1 = projectRepository.save(ProjectEntity.builder()
                    .author(savedKwame)
                    .title("AfriPay Escrow Protocol")
                    .description("Solution de paiement sécurisée et de séquestre décentralisée pour les freelancers africains, compatible Mobile Money.")
                    .stack(List.of("Spring Boot", "PostgreSQL", "Redis", "Docker"))
                    .repoUrl("https://github.com/kwame-osei/afripay-escrow")
                    .demoUrl("https://afripay.africa")
                    .isOpenSource(true)
                    .recognitionsCount(2)
                    .status(ContentStatus.PUBLISHED)
                    .build());

            ProjectEntity p2 = projectRepository.save(ProjectEntity.builder()
                    .author(savedFatou)
                    .title("SunuHealth PWA")
                    .description("Application web progressive de suivi de santé communautaire en zone rurale optimisée pour le fonctionnement hors-ligne.")
                    .stack(List.of("Angular", "RxJS", "Service Worker", "FastAPI"))
                    .repoUrl("https://github.com/fatou-sow/sunuhealth-pwa")
                    .demoUrl("https://sunuhealth.sn")
                    .isOpenSource(true)
                    .recognitionsCount(2)
                    .status(ContentStatus.PUBLISHED)
                    .build());

            ProjectEntity p3 = projectRepository.save(ProjectEntity.builder()
                    .author(savedKofi)
                    .title("AgriData AI Hub")
                    .description("Plateforme d'analyse prédictive des rendements agricoles et d'optimisation de l'irrigation.")
                    .stack(List.of("Python", "FastAPI", "Angular", "PyTorch", "PostgreSQL"))
                    .repoUrl("https://github.com/kofi-mensah/agridata-ai")
                    .demoUrl("https://agridata.ci")
                    .isOpenSource(true)
                    .recognitionsCount(1)
                    .status(ContentStatus.PUBLISHED)
                    .build());

            commentRepository.save(ProjectCommentEntity.builder()
                    .project(p1)
                    .author(savedFatou)
                    .content("Superbe architecture backend Kwame ! L'intégration du séquestre Mobile Money résout un vrai problème de confiance.")
                    .build());

            commentRepository.save(ProjectCommentEntity.builder()
                    .project(p2)
                    .author(savedKwame)
                    .content("La gestion du mode offline avec IndexedDB et les Service Workers est d'une grande fluidité. Bravo Fatou !")
                    .build());

            recognitionRepository.save(RecognitionEntity.builder().project(p1).user(savedFatou).build());
            recognitionRepository.save(RecognitionEntity.builder().project(p1).user(savedKofi).build());
            recognitionRepository.save(RecognitionEntity.builder().project(p2).user(savedKwame).build());

            followRepository.save(FollowEntity.builder().follower(savedKwame).following(savedFatou).build());
            followRepository.save(FollowEntity.builder().follower(savedFatou).following(savedKwame).build());
            followRepository.save(FollowEntity.builder().follower(savedKofi).following(savedKwame).build());

            // ── Projet Collaboratif & Tâches Kanban ──
            ProjectEntity collabProject = projectRepository.save(ProjectEntity.builder()
                    .author(savedKwame)
                    .title("AfriPay Gateway — SDK Panafricain Ouvert")
                    .description("Initiative collaborative pour unifier les APIs de paiement Mobile Money (Orange Money, Wave, M-Pesa, MTN MoMo) sous un SDK open source unique.")
                    .stack(List.of("TypeScript", "Node.js", "Spring Boot", "Docker"))
                    .repoUrl("https://github.com/afripay/core-sdk")
                    .isOpenSource(true)
                    .projectType(ProjectType.COLLABORATIVE)
                    .recognitionsCount(5)
                    .status(ContentStatus.PUBLISHED)
                    .build());

            // Membres d'équipe
            memberRepository.save(ProjectMemberEntity.builder()
                    .project(collabProject)
                    .user(savedFatou)
                    .role("Lead Frontend & Dashboard")
                    .message("Passionnée par l'UX des applications financières africaines.")
                    .status(MemberStatus.ACCEPTED)
                    .joinedAt(LocalDateTime.now().minusDays(5))
                    .build());

            memberRepository.save(ProjectMemberEntity.builder()
                    .project(collabProject)
                    .user(savedKofi)
                    .role("Ingénieur Intégration M-Pesa")
                    .message("Expérience de 3 ans avec les passerelles Safaricom Daraja.")
                    .status(MemberStatus.ACCEPTED)
                    .joinedAt(LocalDateTime.now().minusDays(3))
                    .build());

            // Tâches (avec indicateur de retard, en cours, terminé)
            taskRepository.save(ProjectTaskEntity.builder()
                    .project(collabProject)
                    .createdBy(savedKwame)
                    .assignedTo(savedKwame)
                    .title("Spécification OpenAPI & Architecture Modulaire")
                    .description("Définir le contrat d'interface pour les webhooks et les requêtes de débit/crédit.")
                    .status(TaskStatus.DONE)
                    .priority(TaskPriority.HIGH)
                    .dueDate(LocalDate.now().minusDays(2))
                    .completedAt(LocalDateTime.now().minusDays(2))
                    .orderIndex(1)
                    .build());

            taskRepository.save(ProjectTaskEntity.builder()
                    .project(collabProject)
                    .createdBy(savedKwame)
                    .assignedTo(savedFatou)
                    .title("Dashboard de surveillance des transactions en temps réel")
                    .description("Interface Angular pour visualiser les statuts des transactions et les taux de succès par opérateur.")
                    .status(TaskStatus.IN_PROGRESS)
                    .priority(TaskPriority.MEDIUM)
                    .dueDate(LocalDate.now().plusDays(4))
                    .orderIndex(2)
                    .build());

            taskRepository.save(ProjectTaskEntity.builder()
                    .project(collabProject)
                    .createdBy(savedKwame)
                    .assignedTo(savedKofi)
                    .title("Connecteur Safaricom M-Pesa B2C")
                    .description("Gestion de l'authentification OAuth2 et des callbacks asynchrones.")
                    .status(TaskStatus.TODO)
                    .priority(TaskPriority.URGENT)
                    .dueDate(LocalDate.now().minusDays(1)) // EN RETARD !
                    .orderIndex(3)
                    .build());

            taskRepository.save(ProjectTaskEntity.builder()
                    .project(collabProject)
                    .createdBy(savedKwame)
                    .assignedTo(savedKwame)
                    .title("Tests de charge et validation de la conformité sécuritaire")
                    .description("Simulation de 5000 transactions/seconde avec Locust.")
                    .status(TaskStatus.REVIEW)
                    .priority(TaskPriority.HIGH)
                    .dueDate(LocalDate.now().plusDays(7))
                    .orderIndex(4)
                    .build());
        }

        // ── Assurer que l'utilisateur dispose de son projet collaboratif Chef/Lead ──
        List<String> targetEmails = List.of("faruck.tech@gmail.com", "soilihiabdou.tech@gmail.com");
        for (String email : targetEmails) {
            userRepository.findByEmail(email).ifPresent(user -> {
                boolean hasCollab = projectRepository.findAll().stream()
                        .anyMatch(p -> p.getProjectType() == ProjectType.COLLABORATIVE && p.getAuthor().getId().equals(user.getId()));
                if (!hasCollab) {
                    ProjectEntity myCollab = projectRepository.save(ProjectEntity.builder()
                            .author(user)
                            .title("AfriHealth IA — Télémédecine & Santé Rurale")
                            .description("Plateforme collaborative d'assistance médicale par IA connectée aux dispensaires ruraux, avec synchronisation hors-ligne.")
                            .stack(List.of("Angular", "Spring Boot", "FastAPI", "TensorFlow", "PostgreSQL"))
                            .repoUrl("https://github.com/afrihealth/telemed-core")
                            .isOpenSource(true)
                            .projectType(ProjectType.COLLABORATIVE)
                            .recognitionsCount(12)
                            .status(ContentStatus.PUBLISHED)
                            .build());

                    userRepository.findByEmail("fatou.sow@dev.africa").ifPresent(fatou -> 
                        memberRepository.save(ProjectMemberEntity.builder()
                                .project(myCollab)
                                .user(fatou)
                                .role("Ingénieure Mobile & Offline-First")
                                .message("Prête à contribuer sur le module PWA et SQLite local.")
                                .status(MemberStatus.ACCEPTED)
                                .joinedAt(LocalDateTime.now().minusDays(4))
                                .build())
                    );

                    userRepository.findByEmail("kofi.mensah@dev.africa").ifPresent(kofi -> 
                        memberRepository.save(ProjectMemberEntity.builder()
                                .project(myCollab)
                                .user(kofi)
                                .role("Data Scientist IA Médicale")
                                .message("Modèles d'IA légers optimisés pour processeurs mobiles.")
                                .status(MemberStatus.ACCEPTED)
                                .joinedAt(LocalDateTime.now().minusDays(2))
                                .build())
                    );

                    taskRepository.save(ProjectTaskEntity.builder()
                            .project(myCollab)
                            .createdBy(user)
                            .assignedTo(user)
                            .title("Design du schéma de données & API FHIR Médicale")
                            .description("Modéliser les dossiers patients selon le standard HL7 FHIR.")
                            .status(TaskStatus.DONE)
                            .priority(TaskPriority.HIGH)
                            .dueDate(LocalDate.now().minusDays(3))
                            .completedAt(LocalDateTime.now().minusDays(3))
                            .orderIndex(1)
                            .build());

                    taskRepository.save(ProjectTaskEntity.builder()
                            .project(myCollab)
                            .createdBy(user)
                            .title("Synchronisation Hors-ligne des Consultations")
                            .description("Mécanisme local storage / CRDT pour transmission lors de la reconnexion réseau.")
                            .status(TaskStatus.IN_PROGRESS)
                            .priority(TaskPriority.URGENT)
                            .dueDate(LocalDate.now().minusDays(1)) // Date dépassée -> EN RETARD
                            .orderIndex(2)
                            .build());

                    taskRepository.save(ProjectTaskEntity.builder()
                            .project(myCollab)
                            .createdBy(user)
                            .title("Intégration du modèle de diagnostic IA (FastAPI)")
                            .description("Microservice IA d'analyse radiographique et d'alertes cliniques.")
                            .status(TaskStatus.REVIEW)
                            .priority(TaskPriority.HIGH)
                            .dueDate(LocalDate.now().plusDays(5))
                            .orderIndex(3)
                            .build());

                    taskRepository.save(ProjectTaskEntity.builder()
                            .project(myCollab)
                            .createdBy(user)
                            .title("Validation sur le terrain avec 10 agents de santé")
                            .description("Session de tests d'ergonomie et retour d'expérience.")
                            .status(TaskStatus.TODO)
                            .priority(TaskPriority.MEDIUM)
                            .dueDate(LocalDate.now().plusDays(12))
                            .orderIndex(4)
                            .build());

                    log.info("Projet collaboratif de démonstration assigné au compte {} avec succès.", user.getEmail());
                }
            });
        }


        // ── Événements Tech Panafricains (Meetups, Hackathons, Conférences) ──
        if (eventRepository.count() == 0) {
            UserEntity organizer = userRepository.findByEmail("kwame.osei@dev.africa").orElse(null);

            eventRepository.save(TechEventEntity.builder()
                    .title("PyCon Africa 2026")
                    .description("La plus grande conférence de développeurs Python sur le continent africain. 3 jours de keynotes, d'ateliers et de networking panafricain.")
                    .type(TechEventType.CONFERENCE)
                    .startDate(LocalDateTime.now().plusDays(25).withHour(9).withMinute(0))
                    .endDate(LocalDateTime.now().plusDays(28).withHour(18).withMinute(0))
                    .location("Accra International Conference Centre, Ghana")
                    .isOnline(false)
                    .eventUrl("https://africa.pycon.org")
                    .bannerUrl("https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800")
                    .organizer(organizer)
                    .organizerName("Python Africa Community")
                    .tags(List.of("Python", "IA", "Data Science", "Cloud"))
                    .agreeCount(42)
                    .disagreeCount(2)
                    .build());

            eventRepository.save(TechEventEntity.builder()
                    .title("Hackathon FinTech & Inclusion Financière")
                    .description("48h pour prototyper la prochaine génération de services financiers décentralisés et de micro-crédit via Mobile Money.")
                    .type(TechEventType.HACKATHON)
                    .startDate(LocalDateTime.now().plusDays(10).withHour(10).withMinute(0))
                    .endDate(LocalDateTime.now().plusDays(12).withHour(16).withMinute(0))
                    .location("Dakar, Sénégal & Hybride En Ligne")
                    .isOnline(true)
                    .eventUrl("https://afridev.africa/hackathons/fintech-2026")
                    .bannerUrl("https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800")
                    .organizer(organizer)
                    .organizerName("AfriDev Labs & Wave Sénégal")
                    .tags(List.of("Hackathon", "Mobile Money", "FinTech", "Web3"))
                    .agreeCount(87)
                    .disagreeCount(3)
                    .build());

            eventRepository.save(TechEventEntity.builder()
                    .title("DevFest Dakar 2026")
                    .description("Rassemblement annuel des développeurs Google Developer Groups (GDG). Sujets : Flutter, Cloud, Angular et Intelligence Artificielle.")
                    .type(TechEventType.MEETUP)
                    .startDate(LocalDateTime.now().plusDays(18).withHour(8).withMinute(30))
                    .endDate(LocalDateTime.now().plusDays(18).withHour(17).withMinute(30))
                    .location("Musée des Civilisations Noires, Dakar")
                    .isOnline(false)
                    .eventUrl("https://gdg.community.dev/events/details/developer-group-dakar")
                    .bannerUrl("https://images.unsplash.com/photo-1511578314322-379afb476865?w=800")
                    .organizer(organizer)
                    .organizerName("GDG Dakar")
                    .tags(List.of("GDG", "Angular", "Flutter", "GCP"))
                    .agreeCount(64)
                    .disagreeCount(1)
                    .build());

            eventRepository.save(TechEventEntity.builder()
                    .title("Atelier Architecture Microservices & Event-Driven")
                    .description("Masterclass pratique sur Kafka, Spring Cloud et la résilience face aux pannes de connectivité réseau.")
                    .type(TechEventType.WORKSHOP)
                    .startDate(LocalDateTime.now().plusDays(6).withHour(18).withMinute(0))
                    .endDate(LocalDateTime.now().plusDays(6).withHour(20).withMinute(30))
                    .location("En direct sur Google Meet")
                    .isOnline(true)
                    .eventUrl("https://meet.google.com/afridev-workshop")
                    .bannerUrl("https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800")
                    .organizer(organizer)
                    .organizerName("Kwame Osei")
                    .tags(List.of("Kafka", "Spring Boot", "Microservices", "Event-Driven"))
                    .agreeCount(31)
                    .disagreeCount(0)
                    .build());
        }

        // Calcul et initialisation des points XP et des niveaux de chaque développeur
        xpService.initializeAllProfilesXp();

        log.info("Initialisation terminée avec succès ! Nombre d'utilisateurs en base: {}", userRepository.count());
    }
}
