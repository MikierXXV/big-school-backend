-- Migration 009: Create admin_permissions table
-- Feature 012: RBAC + Organizations
-- Date: 2026-02-23

-- Admin permissions: granular permissions that can be granted to ADMIN users by SUPER_ADMIN
CREATE TYPE admin_permission AS ENUM (
    'manage_users',           -- Create, edit, delete users; promote/demote admins
    'manage_organizations',   -- Create, edit, delete organizations
    'assign_members',         -- Assign users to organizations and change their roles
    'view_all_data'           -- View data from all organizations (bypass membership requirement)
);

-- Admin permissions grants
CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission admin_permission NOT NULL,
    granted_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure unique permission per admin user
    CONSTRAINT admin_permissions_unique UNIQUE (admin_user_id, permission)
);

-- Indexes for performance
CREATE INDEX idx_admin_permissions_user ON admin_permissions(admin_user_id);
CREATE INDEX idx_admin_permissions_permission ON admin_permissions(permission);

-- Comments
COMMENT ON TABLE admin_permissions IS 'Granular permissions granted to ADMIN users by SUPER_ADMIN';
COMMENT ON COLUMN admin_permissions.admin_user_id IS 'User with system_role = admin who receives the permission';
COMMENT ON COLUMN admin_permissions.granted_by IS 'SUPER_ADMIN who granted this permission';
COMMENT ON TYPE admin_permission IS 'Granular permissions for delegated administration';

-- NOTE: Only users with system_role = 'admin' should have entries in this table
-- SUPER_ADMIN has all permissions implicitly (no need for grants)
-- USER cannot have admin permissions
