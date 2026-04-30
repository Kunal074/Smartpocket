-- SmartPocket: Clear all data but keep schema intact
-- Run: psql -U postgres -d smartpocket -f sql/clear_data.sql

BEGIN;

-- Disable triggers temporarily for clean truncation
SET session_replication_role = replica;

-- Clear in reverse dependency order (child tables first)
TRUNCATE TABLE settlements        RESTART IDENTITY CASCADE;
TRUNCATE TABLE expense_splits     RESTART IDENTITY CASCADE;
TRUNCATE TABLE group_expenses     RESTART IDENTITY CASCADE;
TRUNCATE TABLE group_members      RESTART IDENTITY CASCADE;
TRUNCATE TABLE groups             RESTART IDENTITY CASCADE;
TRUNCATE TABLE budgets            RESTART IDENTITY CASCADE;
TRUNCATE TABLE expenses           RESTART IDENTITY CASCADE;
TRUNCATE TABLE friends            RESTART IDENTITY CASCADE;
TRUNCATE TABLE users              RESTART IDENTITY CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;

\echo '✅ All data cleared! Schema is intact. Ready for fresh testing.'
