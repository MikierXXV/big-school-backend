/**
 * ============================================
 * REPOSITORY INTERFACE: IAdminPermissionRepository
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Repository interface for AdminPermissionGrant entity following Hexagonal Architecture.
 * The domain defines the interface; infrastructure implements it.
 *
 * OPERATIONS:
 * - grant: Create new permission grant
 * - revoke: Remove permission grant
 * - findByUserId: Find all permissions granted to a user
 * - hasPermission: Check if user has specific permission
 */

import { AdminPermissionGrant } from '../entities/admin-permission-grant.entity.js';
import { AdminPermission } from '../value-objects/admin-permission.value-object.js';

/**
 * Admin permission repository interface
 */
export interface IAdminPermissionRepository {
  /**
   * Grants a permission to an admin user
   *
   * @param grant - Permission grant to save
   * @returns Promise resolving to void
   */
  grant(grant: AdminPermissionGrant): Promise<void>;

  /**
   * Revokes a specific permission grant
   *
   * @param grantId - Grant ID to revoke
   * @returns Promise resolving to void
   */
  revoke(grantId: string): Promise<void>;

  /**
   * Finds all permission grants for a user
   *
   * @param adminUserId - Admin user ID
   * @returns Promise resolving to array of AdminPermissionGrants
   */
  findByUserId(adminUserId: string): Promise<AdminPermissionGrant[]>;

  /**
   * Checks if a user has a specific permission
   *
   * @param adminUserId - Admin user ID
   * @param permission - Permission to check
   * @returns Promise resolving to true if user has permission
   */
  hasPermission(adminUserId: string, permission: AdminPermission): Promise<boolean>;
}
