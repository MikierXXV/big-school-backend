-- Migration 008: Add system_role to users table
-- Feature 012: RBAC + Organizations
-- Date: 2026-02-23

-- System roles: hierarchical platform-level roles
CREATE TYPE system_role AS ENUM (
    'super_admin',  -- Full platform control, immutable permissions
    'admin',        -- Delegated admin with granted permissions only
    'user'          -- Standard user (default)
);

-- Add system_role column to users
ALTER TABLE users ADD COLUMN system_role system_role NOT NULL DEFAULT 'user';

-- Index for querying by system role
CREATE INDEX idx_users_system_role ON users(system_role);

-- Comments
COMMENT ON COLUMN users.system_role IS 'Platform-level role (super_admin > admin > user)';
COMMENT ON TYPE system_role IS 'Hierarchical system roles for platform administration';

-- NOTE: SUPER_ADMIN users are created via seed/manual UPDATE, not via API
-- Example: UPDATE users SET system_role = 'super_admin' WHERE email = 'admin@example.com';
