-- Initialisation de la base de données AfriDev Hub
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verification
SELECT 'AfriDev Hub Database Initialized Successfully' AS status;
