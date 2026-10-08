-- =============================================================
-- SCRIPT DE DONNÉES DE TEST : 3 DÉVELOPPEURS COMPLETS (AFRIDEV HUB)
-- =============================================================

-- Clean existing seed data if present
DELETE FROM user_follows WHERE follower_id IN (SELECT id FROM users WHERE email LIKE '%@dev.africa');
DELETE FROM recognitions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@dev.africa');
DELETE FROM project_comments WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@dev.africa');
DELETE FROM project_stack WHERE project_id IN (SELECT id FROM projects WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@dev.africa'));
DELETE FROM projects WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@dev.africa');
DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@dev.africa');
DELETE FROM users WHERE email LIKE '%@dev.africa';

-- 1. INSERTION DES UTILISATEURS (Mot de passe BCrypt par défaut: 'Password123!')
-- Hash BCrypt valide: $2b$10$sbYhm8.9BLk4/k397Txfm..v/NsXJIFn3xf9eD1pogVW8lpLVgXVG
INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
VALUES 
('dev-user-001', 'kwame.osei@dev.africa', '$2b$10$sbYhm8.9BLk4/k397Txfm..v/NsXJIFn3xf9eD1pogVW8lpLVgXVG', 'DEVELOPER', 'ACTIVE', true, NOW(), NOW()),
('dev-user-002', 'fatou.sow@dev.africa', '$2b$10$sbYhm8.9BLk4/k397Txfm..v/NsXJIFn3xf9eD1pogVW8lpLVgXVG', 'DEVELOPER', 'ACTIVE', true, NOW(), NOW()),
('dev-user-003', 'kofi.mensah@dev.africa', '$2b$10$sbYhm8.9BLk4/k397Txfm..v/NsXJIFn3xf9eD1pogVW8lpLVgXVG', 'DEVELOPER', 'ACTIVE', true, NOW(), NOW());

-- 2. INSERTION DES PROFILS DÉVELOPPEURS
INSERT INTO profiles (id, user_id, full_name, country, city, title, bio, availability, completion_score, mobile_money_verified, github_url, linkedin_url, created_at, updated_at)
VALUES
('prof-001', 'dev-user-001', 'Kwame Osei', 'Ghana', 'Accra', 'Senior Backend & Cloud Engineer', 'Développeur passionné par les systèmes distribués haute performance et l''intégration des protocoles Mobile Money.', 'OPEN', 95, true, 'https://github.com/kwame-osei', 'https://linkedin.com/in/kwame-osei', NOW(), NOW()),
('prof-002', 'dev-user-002', 'Fatou Sow', 'Sénégal', 'Dakar', 'Lead Frontend Architect', 'Spécialiste Angular & UI/UX réactive. Engagée pour l''accès aux soins de santé grâce au web hors-ligne (PWA).', 'OPEN', 90, true, 'https://github.com/fatou-sow', 'https://linkedin.com/in/fatou-sow', NOW(), NOW()),
('prof-003', 'dev-user-003', 'Kofi Mensah', 'Côte d''Ivoire', 'Abidjan', 'Fullstack & Data Engineer', 'Concepteur de solutions AgTech et Data Analytics pour l''agriculture connectée en Afrique de l''Ouest.', 'OPEN', 85, true, 'https://github.com/kofi-mensah', 'https://linkedin.com/in/kofi-mensah', NOW(), NOW());

-- 3. INSERTION DES PROJETS
INSERT INTO projects (id, author_id, title, description, repo_url, demo_url, is_open_source, recognitions_count, status, created_at, updated_at)
VALUES
('proj-001', 'dev-user-001', 'AfriPay Escrow Protocol', 'Solution de paiement sécurisée et de séquestre décentralisée pour les freelancers africains, compatible Mobile Money (MTN, Orange Money, Wave).', 'https://github.com/kwame-osei/afripay-escrow', 'https://afripay.africa', true, 2, 'PUBLISHED', NOW(), NOW()),
('proj-002', 'dev-user-002', 'SunuHealth PWA', 'Application web progressive de suivi de santé communautaire en zone rurale optimisée pour le réseau 3G et le fonctionnement hors-ligne.', 'https://github.com/fatou-sow/sunuhealth-pwa', 'https://sunuhealth.sn', true, 2, 'PUBLISHED', NOW(), NOW()),
('proj-003', 'dev-user-003', 'AgriData AI Hub', 'Plateforme d''analyse prédictive des rendements agricoles et d''optimisation de l''irrigation basée sur l''imagerie satellite Sentinel.', 'https://github.com/kofi-mensah/agridata-ai', 'https://agridata.ci', true, 1, 'PUBLISHED', NOW(), NOW());

-- 4. INSERTION DE LA STACK TECHNIQUE DES PROJETS
INSERT INTO project_stack (project_id, technology) VALUES
('proj-001', 'Spring Boot'), ('proj-001', 'PostgreSQL'), ('proj-001', 'Redis'), ('proj-001', 'Docker'),
('proj-002', 'Angular'), ('proj-002', 'RxJS'), ('proj-002', 'Service Worker'), ('proj-002', 'FastAPI'),
('proj-003', 'Python'), ('proj-003', 'FastAPI'), ('proj-003', 'Angular'), ('proj-003', 'PyTorch');

-- 5. INSERTION DES COMMENTAIRES DE PROJETS
INSERT INTO project_comments (id, project_id, author_id, content, created_at, updated_at)
VALUES
('comm-001', 'proj-001', 'dev-user-002', 'Superbe architecture backend Kwame ! L''intégration du séquestre Mobile Money résout un vrai problème de confiance pour les contrats freelances.', NOW(), NOW()),
('comm-002', 'proj-001', 'dev-user-003', 'Impressionnant ! Est-ce que l''API expose des webhooks pour les notifications de règlement automatique ?', NOW(), NOW()),
('comm-003', 'proj-002', 'dev-user-001', 'La gestion du mode offline avec IndexedDB et les Service Workers est d''une grande fluidité. Bravo Fatou !', NOW(), NOW());

-- 6. INSERTION DES RECONNAISSANCES (LIKES)
INSERT INTO recognitions (id, project_id, user_id, created_at)
VALUES
('rec-001', 'proj-001', 'dev-user-002', NOW()),
('rec-002', 'proj-001', 'dev-user-003', NOW()),
('rec-003', 'proj-002', 'dev-user-001', NOW()),
('rec-004', 'proj-002', 'dev-user-003', NOW()),
('rec-005', 'proj-003', 'dev-user-001', NOW());

-- 7. INSERTION DES ABONNEMENTS (FOLLOWS)
INSERT INTO user_follows (id, follower_id, following_id, created_at)
VALUES
('fol-001', 'dev-user-001', 'dev-user-002', NOW()),
('fol-002', 'dev-user-002', 'dev-user-001', NOW()),
('fol-003', 'dev-user-003', 'dev-user-001', NOW());
