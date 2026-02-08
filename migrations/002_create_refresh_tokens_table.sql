-- ============================================
-- Migration: 002_create_refresh_tokens_table
-- ============================================
-- Creates the refresh_tokens table for session management.
--
-- Table: refresh_tokens
-- - Stores refresh tokens for JWT authentication
-- - Supports token rotation (parent_token_id)
-- - Enables token family revocation
-- ============================================

-- UP
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    parent_token_id UUID NULL REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    device_info VARCHAR(500) NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraint: Valid status values
    CONSTRAINT refresh_tokens_status_check CHECK (
        status IN ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED')
    )
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_status ON refresh_tokens(status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_parent ON refresh_tokens(parent_token_id);

-- Comments
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
COMMENT ON COLUMN refresh_tokens.id IS 'UUID primary key (also used as tokenId in JWT)';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 hash of the token value';
COMMENT ON COLUMN refresh_tokens.parent_token_id IS 'ID of the token this was rotated from (for family tracking)';
COMMENT ON COLUMN refresh_tokens.status IS 'Token status: ACTIVE, ROTATED, REVOKED, EXPIRED';
COMMENT ON COLUMN refresh_tokens.device_info IS 'User-Agent or device identifier';

-- ============================================
-- DOWN (for rollback)
-- ============================================
-- DROP INDEX IF EXISTS idx_refresh_tokens_parent;
-- DROP INDEX IF EXISTS idx_refresh_tokens_expires_at;
-- DROP INDEX IF EXISTS idx_refresh_tokens_status;
-- DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
-- DROP INDEX IF EXISTS idx_refresh_tokens_token_hash;
-- DROP TABLE IF EXISTS refresh_tokens;
