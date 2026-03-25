/**
 * ============================================
 * REPOSITORY: PostgresAdminPermissionRepository
 * ============================================
 *
 * PostgreSQL implementation of IAdminPermissionRepository.
 *
 * TABLE: admin_permissions
 * - id: UUID PRIMARY KEY
 * - admin_user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
 * - permission: admin_permission NOT NULL
 * - granted_by: UUID NOT NULL REFERENCES users(id)
 * - granted_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * UNIQUE: (admin_user_id, permission)
 */

import { Pool } from 'pg';
import { IAdminPermissionRepository } from '../../../domain/repositories/admin-permission.repository.interface.js';
import { AdminPermissionGrant } from '../../../domain/entities/admin-permission-grant.entity.js';
import { AdminPermission } from '../../../domain/value-objects/admin-permission.value-object.js';

interface PermissionRow {
  id: string;
  admin_user_id: string;
  permission: string;
  granted_by: string;
  granted_at: Date;
}

export class PostgresAdminPermissionRepository
  implements IAdminPermissionRepository
{
  constructor(private readonly pool: Pool) {}

  async grant(grant: AdminPermissionGrant): Promise<void> {
    await this.pool.query(
      `INSERT INTO admin_permissions (id, admin_user_id, permission, granted_by, granted_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (admin_user_id, permission) DO NOTHING`,
      [
        grant.id,
        grant.adminUserId,
        grant.permission.getValue(),
        grant.grantedBy,
        grant.grantedAt,
      ],
    );
  }

  async revoke(grantId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM admin_permissions WHERE id = $1`,
      [grantId],
    );
  }

  async findByUserId(adminUserId: string): Promise<AdminPermissionGrant[]> {
    const result = await this.pool.query<PermissionRow>(
      `SELECT id, admin_user_id, permission, granted_by, granted_at
       FROM admin_permissions
       WHERE admin_user_id = $1`,
      [adminUserId],
    );
    return result.rows.map((row) => this.rowToEntity(row));
  }

  async hasPermission(
    adminUserId: string,
    permission: AdminPermission,
  ): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM admin_permissions
         WHERE admin_user_id = $1 AND permission = $2
       ) AS exists`,
      [adminUserId, permission.getValue()],
    );
    return result.rows[0]?.exists ?? false;
  }

  private rowToEntity(row: PermissionRow): AdminPermissionGrant {
    return AdminPermissionGrant.fromPersistence({
      id: row.id,
      adminUserId: row.admin_user_id,
      permission: AdminPermission.create(row.permission),
      grantedBy: row.granted_by,
      grantedAt: row.granted_at,
    });
  }
}
