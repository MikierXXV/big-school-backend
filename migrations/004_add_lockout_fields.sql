-- migrations/004_add_lockout_fields.sql
-- Add account lockout fields to users table

-- UP
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS lockout_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP WITH TIME ZONE NULL;

-- Index for querying locked accounts (only non-null lockout_until)
CREATE INDEX IF NOT EXISTS idx_users_lockout_until
  ON users(lockout_until)
  WHERE lockout_until IS NOT NULL;

-- Index for cleanup queries (accounts with failed attempts)
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts
  ON users(failed_login_attempts)
  WHERE failed_login_attempts > 0;

-- DOWN
-- DROP INDEX IF EXISTS idx_users_failed_attempts;
-- DROP INDEX IF EXISTS idx_users_lockout_until;
-- ALTER TABLE users
--   DROP COLUMN IF EXISTS last_failed_login_at,
--   DROP COLUMN IF EXISTS lockout_count,
--   DROP COLUMN IF EXISTS lockout_until,
--   DROP COLUMN IF EXISTS failed_login_attempts;
