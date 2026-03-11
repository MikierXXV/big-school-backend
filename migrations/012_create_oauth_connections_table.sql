-- ============================================
-- Migration 012: Create oauth_connections table
-- ============================================
-- Stores the link between a user and their OAuth provider identity.

CREATE TABLE IF NOT EXISTS oauth_connections (
  id              UUID          PRIMARY KEY,
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        VARCHAR(50)   NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email  VARCHAR(255),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_oauth_connections_user_id ON oauth_connections(user_id);

COMMENT ON TABLE oauth_connections IS 'OAuth provider identities linked to user accounts';
