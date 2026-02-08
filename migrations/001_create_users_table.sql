-- ============================================
-- Migration: 001_create_users_table
-- ============================================
-- Creates the users table for authentication.
--
-- Table: users
-- - Stores user account information
-- - Email is unique and indexed for login
-- - Status tracks account lifecycle
-- ============================================

-- UP
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE NULL,

    -- Constraint: Valid status values
    CONSTRAINT users_status_check CHECK (
        status IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')
    )
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Comments
COMMENT ON TABLE users IS 'User accounts for authentication';
COMMENT ON COLUMN users.id IS 'UUID primary key';
COMMENT ON COLUMN users.email IS 'Unique email address (max 254 chars per RFC 5321)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt password hash';
COMMENT ON COLUMN users.status IS 'Account status: PENDING_VERIFICATION, ACTIVE, SUSPENDED, DEACTIVATED';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when email was verified';

-- ============================================
-- DOWN (for rollback)
-- ============================================
-- DROP INDEX IF EXISTS idx_users_created_at;
-- DROP INDEX IF EXISTS idx_users_status;
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP TABLE IF EXISTS users;
