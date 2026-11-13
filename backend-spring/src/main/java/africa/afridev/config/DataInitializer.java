package africa.afridev.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Initialisation des contraintes SQL critiques au démarrage du backend.
 * Mode Production : la génération automatique de fausses données (seeders) est désactivée.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Vérification des contraintes SQL de base de données...");

        try {
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            jdbcTemplate.execute("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('DEVELOPER', 'RECRUITER', 'ADMIN', 'SUPER_ADMIN'))");
            log.info("Contrainte users_role_check vérifiée (DEVELOPER, RECRUITER, ADMIN, SUPER_ADMIN).");

            jdbcTemplate.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check");
            jdbcTemplate.execute("ALTER TABLE payments ADD CONSTRAINT payments_provider_check CHECK (provider IN ('SASPAY', 'UNITECH_PAY', 'STRIPE'))");
            log.info("Contrainte payments_provider_check vérifiée (SASPAY, UNITECH_PAY, STRIPE).");
        } catch (Exception e) {
            log.warn("Mise à jour des contraintes SQL : {}", e.getMessage());
        }

        log.info("Mode Production actif : aucun compte ou contenu fictif n'est généré.");
    }
}
