-- Migration 007: Create organizations table
-- Feature 012: RBAC + Organizations
-- Date: 2026-02-23

-- Organization types for healthcare context
CREATE TYPE organization_type AS ENUM (
    'hospital',
    'clinic',
    'health_center',
    'laboratory',
    'pharmacy',
    'other'
);

-- Organizations table (hospitals, clinics, health centers, etc.)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type organization_type NOT NULL,
    description TEXT NULL,
    address VARCHAR(500) NULL,
    contact_email VARCHAR(254) NULL,
    contact_phone VARCHAR(50) NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT organizations_name_unique UNIQUE (name)
);

-- Indexes for performance
CREATE INDEX idx_organizations_active ON organizations(active);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_name ON organizations(name);

-- Comments
COMMENT ON TABLE organizations IS 'Healthcare organizations (hospitals, clinics, etc.)';
COMMENT ON COLUMN organizations.type IS 'Type of healthcare organization';
COMMENT ON COLUMN organizations.active IS 'Whether the organization is currently active';
