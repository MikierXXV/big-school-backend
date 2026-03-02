-- Migration 010: Create organization_memberships table
-- Feature 012: RBAC + Organizations
-- Date: 2026-02-23

-- Organization roles: roles within a specific organization
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_role') THEN
        CREATE TYPE organization_role AS ENUM (
            'org_admin',
            'doctor',
            'nurse',
            'specialist',
            'staff',
            'guest'
        );
    END IF;
END$$;

-- Organization memberships: users can belong to multiple organizations with different roles
CREATE TABLE IF NOT EXISTS organization_memberships (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role organization_role NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure left_at is after joined_at
    CONSTRAINT membership_dates_check CHECK (left_at IS NULL OR left_at >= joined_at)
);

-- Partial unique index for active memberships (one active per user per org)
CREATE UNIQUE INDEX membership_active_unique
ON organization_memberships(user_id, organization_id)
WHERE left_at IS NULL;

-- Indexes for performance
CREATE INDEX idx_memberships_user_active ON organization_memberships(user_id) WHERE left_at IS NULL;
CREATE INDEX idx_memberships_org_active ON organization_memberships(organization_id) WHERE left_at IS NULL;
CREATE INDEX idx_memberships_role ON organization_memberships(role);
CREATE INDEX idx_memberships_user_org ON organization_memberships(user_id, organization_id);

-- Comments
COMMENT ON TABLE organization_memberships IS 'User memberships in organizations with specific roles';
COMMENT ON COLUMN organization_memberships.role IS 'Role of the user within this organization';
COMMENT ON COLUMN organization_memberships.left_at IS 'NULL if active, timestamp if user left the organization';
COMMENT ON COLUMN organization_memberships.created_by IS 'Admin who assigned this user to the organization';
COMMENT ON TYPE organization_role IS 'Roles within a healthcare organization';
