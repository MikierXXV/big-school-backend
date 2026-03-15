/**
 * ============================================
 * REPOSITORY: PostgresOrganizationMembershipRepository
 * ============================================
 *
 * Implementación de IOrganizationMembershipRepository para PostgreSQL.
 *
 * TABLA: organization_memberships
 * - id: UUID PRIMARY KEY
 * - user_id: UUID NOT NULL REFERENCES users(id)
 * - organization_id: UUID NOT NULL REFERENCES organizations(id)
 * - role: organization_role NOT NULL
 * - joined_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * - left_at: TIMESTAMPTZ NULL
 * - created_by: UUID NULL REFERENCES users(id)
 * - created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * - updated_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *
 * ÍNDICE ÚNICO PARCIAL: (user_id, organization_id) WHERE left_at IS NULL
 */

import { Pool } from 'pg';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { OrganizationMembership } from '../../../domain/entities/organization-membership.entity.js';
import { OrganizationRole } from '../../../domain/value-objects/organization-role.value-object.js';

interface MembershipRow {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  joined_at: Date;
  left_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

const SELECT_FIELDS = `
  id, user_id, organization_id, role, joined_at, left_at, created_by, created_at, updated_at
`;

export class PostgresOrganizationMembershipRepository
  implements IOrganizationMembershipRepository
{
  constructor(private readonly pool: Pool) {}

  public async save(membership: OrganizationMembership): Promise<void> {
    await this.pool.query(
      `INSERT INTO organization_memberships
         (id, user_id, organization_id, role, joined_at, left_at, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        membership.id,
        membership.userId,
        membership.organizationId,
        membership.role.getValue(),
        membership.joinedAt,
        membership.leftAt,
        membership.createdBy,
        membership.createdAt,
        membership.updatedAt,
      ]
    );
  }

  public async findByUserId(
    userId: string,
    activeOnly = false
  ): Promise<OrganizationMembership[]> {
    const query = activeOnly
      ? `SELECT ${SELECT_FIELDS} FROM organization_memberships WHERE user_id = $1 AND left_at IS NULL`
      : `SELECT ${SELECT_FIELDS} FROM organization_memberships WHERE user_id = $1`;
    const result = await this.pool.query<MembershipRow>(query, [userId]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  public async findByOrganizationId(
    organizationId: string,
    activeOnly = false
  ): Promise<OrganizationMembership[]> {
    const query = activeOnly
      ? `SELECT ${SELECT_FIELDS} FROM organization_memberships WHERE organization_id = $1 AND left_at IS NULL`
      : `SELECT ${SELECT_FIELDS} FROM organization_memberships WHERE organization_id = $1`;
    const result = await this.pool.query<MembershipRow>(query, [organizationId]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  public async findActiveMembership(
    userId: string,
    organizationId: string
  ): Promise<OrganizationMembership | null> {
    const result = await this.pool.query<MembershipRow>(
      `SELECT ${SELECT_FIELDS} FROM organization_memberships
       WHERE user_id = $1 AND organization_id = $2 AND left_at IS NULL
       LIMIT 1`,
      [userId, organizationId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return this.rowToEntity(row);
  }

  public async update(membership: OrganizationMembership): Promise<void> {
    await this.pool.query(
      `UPDATE organization_memberships SET
         role = $2, left_at = $3, updated_at = $4
       WHERE id = $1`,
      [
        membership.id,
        membership.role.getValue(),
        membership.leftAt,
        membership.updatedAt,
      ]
    );
  }

  public async remove(id: string): Promise<void> {
    await this.pool.query('DELETE FROM organization_memberships WHERE id = $1', [id]);
  }

  private rowToEntity(row: MembershipRow): OrganizationMembership {
    return OrganizationMembership.fromPersistence({
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      role: OrganizationRole.create(row.role),
      joinedAt: new Date(row.joined_at),
      leftAt: row.left_at ? new Date(row.left_at) : null,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
