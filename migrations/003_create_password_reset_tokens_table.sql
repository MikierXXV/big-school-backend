-- ============================================
-- Migration: 003_create_password_reset_tokens_table
-- ============================================
-- Creates the password_reset_tokens table.
--
-- Table: password_reset_tokens
-- - Stores one-time use password reset tokens
-- - 30 minute expiration
-- - Only one active token per user
-- ============================================

-- UP
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    revoked_at TIMESTAMP WITH TIME ZONE NULL,

    -- Constraint: Token cannot be both used and revoked
    CONSTRAINT password_reset_tokens_single_use CHECK (
        NOT (used_at IS NOT NULL AND revoked_at IS NOT NULL)
    )
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Comments
COMMENT ON TABLE password_reset_tokens IS 'One-time use password reset tokens';
COMMENT ON COLUMN password_reset_tokens.id IS 'UUID primary key (also used as tokenId in JWT)';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'SHA-256 hash of the token value';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration (30 minutes from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when token was used for password reset';
COMMENT ON COLUMN password_reset_tokens.revoked_at IS 'Timestamp when token was revoked (new token requested)';

-- ============================================
-- DOWN (for rollback)
-- ============================================
-- DROP INDEX IF EXISTS idx_password_reset_tokens_expires_at;
-- DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;
-- DROP INDEX IF EXISTS idx_password_reset_tokens_token_hash;
-- DROP TABLE IF EXISTS password_reset_tokens;
