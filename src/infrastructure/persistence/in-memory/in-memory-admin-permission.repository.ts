/**
 * ============================================
 * REPOSITORY: InMemoryAdminPermissionRepository
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * In-memory implementation of IAdminPermissionRepository.
 * ONLY for tests - DO NOT use in production.
 *
 * FEATURES:
 * - Stores permission grants in a Map
 * - Idempotent grant/revoke operations
 * - Fast permission checks
 * - Easy to reset
 */

import { IAdminPermissionRepository } from '../../../domain/repositories/admin-permission.repository.interface.js';
import { AdminPermissionGrant } from '../../../domain/entities/admin-permission-grant.entity.js';
import { AdminPermission } from '../../../domain/value-objects/admin-permission.value-object.js';

/**
 * In-memory implementation of IAdminPermissionRepository.
 * Only for tests.
 */
export class InMemoryAdminPermissionRepository
  implements IAdminPermissionRepository
{
  /**
   * Permission grant storage (Map by grant ID).
   * @private
   */
  private grants: Map<string, AdminPermissionGrant> = new Map();

  /**
   * Index for quick permission checks: "userId-permission" -> grantId
   * @private
   */
  private userPermissionIndex: Map<string, string> = new Map();

  /**
   * Grants a permission to an admin user.
   * Idempotent: if permission already granted, does nothing.
   *
   * @param grant - Permission grant to save
   */
  public async grant(grant: AdminPermissionGrant): Promise<void> {
    const key = this.makeKey(grant.adminUserId, grant.permission);

    // If already granted, do nothing (idempotent)
    if (this.userPermissionIndex.has(key)) {
      return;
    }

    this.grants.set(grant.id, grant);
    this.userPermissionIndex.set(key, grant.id);
  }

  /**
   * Revokes a specific permission grant.
   * Idempotent: if grant doesn't exist, does nothing.
   *
   * @param grantId - Grant ID to revoke
   */
  public async revoke(grantId: string): Promise<void> {
    const grant = this.grants.get(grantId);
    if (!grant) {
      return; // Idempotent: already revoked or never existed
    }

    // Remove from index
    const key = this.makeKey(grant.adminUserId, grant.permission);
    this.userPermissionIndex.delete(key);

    // Remove grant
    this.grants.delete(grantId);
  }

  /**
   * Finds all permission grants for a user.
   *
   * @param adminUserId - Admin user ID
   * @returns Array of AdminPermissionGrants
   */
  public async findByUserId(
    adminUserId: string
  ): Promise<AdminPermissionGrant[]> {
    return Array.from(this.grants.values()).filter(
      (grant) => grant.adminUserId === adminUserId
    );
  }

  /**
   * Checks if a user has a specific permission.
   *
   * @param adminUserId - Admin user ID
   * @param permission - Permission to check
   * @returns true if user has permission
   */
  public async hasPermission(
    adminUserId: string,
    permission: AdminPermission
  ): Promise<boolean> {
    const key = this.makeKey(adminUserId, permission);
    return this.userPermissionIndex.has(key);
  }

  /**
   * Creates a composite key for user+permission lookups.
   * @private
   */
  private makeKey(userId: string, permission: AdminPermission): string {
    return `${userId}-${permission.getValue()}`;
  }

  // ============================================
  // TEST HELPERS (only for tests)
  // ============================================

  /**
   * Resets the repository (clears all data).
   * Only for tests.
   */
  public reset(): void {
    this.grants.clear();
    this.userPermissionIndex.clear();
  }

  /**
   * Gets the number of grants stored.
   * Only for tests.
   */
  public count(): number {
    return this.grants.size;
  }
}
