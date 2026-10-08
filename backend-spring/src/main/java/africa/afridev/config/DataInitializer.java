package africa.afridev.config;

import africa.afridev.model.entity.*;
import africa.afridev.model.enums.Availability;
import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.Role;
import africa.afridev.model.enums.UserStatus;
import africa.afridev.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Vérification et initialisation des profils de test...");

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
        }

        log.info("Initialisation terminée avec succès ! Nombre d'utilisateurs en base: {}", userRepository.count());
    }
}
