-- ============================================
-- Migration 011: Make password_hash nullable
-- ============================================
-- OAuth users are created without a password hash.
-- This constraint must be relaxed to support social login.

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

COMMENT ON COLUMN users.password_hash IS 'Bcrypt password hash. NULL for OAuth-only accounts.';
