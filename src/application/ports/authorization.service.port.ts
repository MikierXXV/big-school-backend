/**
 * ============================================
 * PORT: IAuthorizationService
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Service interface for authorization checks.
 * This is a PORT in Hexagonal Architecture - the interface is defined in the
 * application layer, but implementation lives in infrastructure layer.
 *
 * RESPONSIBILITIES:
 * - Check user permissions considering systemRole + granted permissions
 * - Check organization access (membership or VIEW_ALL_DATA permission)
 * - Check user's role within an organization
 * - Helper methods for common role checks
 *
 * PERMISSION HIERARCHY:
 * - SUPER_ADMIN: has ALL permissions (always returns true)
 * - ADMIN: only has explicitly granted permissions
 * - USER: only has permissions via organization membership
 */

export interface IAuthorizationService {
  /**
   * Checks if a user has a specific permission.
   * Considers systemRole + granted admin permissions + organization membership.
   *
   * @param userId - User ID to check
   * @param permission - Permission to check (AdminPermissionValue)
   * @param organizationId - Optional organization context
   * @returns Promise resolving to true if user has permission
   */
  hasPermission(
    userId: string,
    permission: string,
    organizationId?: string
  ): Promise<boolean>;

  /**
   * Checks if a user can access a specific organization.
   * User can access if:
   * - Is a member of the organization, OR
   * - Has VIEW_ALL_DATA admin permission, OR
   * - Is SUPER_ADMIN
   *
   * @param userId - User ID to check
   * @param organizationId - Organization ID
   * @returns Promise resolving to true if user can access
   */
  canAccessOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean>;

  /**
   * Gets a user's role within a specific organization.
   * Returns null if user is not a member.
   *
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Promise resolving to role string or null
   */
  getUserOrganizationRole(
    userId: string,
    organizationId: string
  ): Promise<string | null>;

  /**
   * Checks if a user is a SUPER_ADMIN.
   *
   * @param userId - User ID to check
   * @returns Promise resolving to true if user is SUPER_ADMIN
   */
  isSuperAdmin(userId: string): Promise<boolean>;

  /**
   * Checks if a user is an ADMIN (regardless of permissions).
   *
   * @param userId - User ID to check
   * @returns Promise resolving to true if user is ADMIN
   */
  isAdmin(userId: string): Promise<boolean>;

  /**
   * Checks if an ADMIN user has a specific permission.
   * This checks the AdminPermissionGrant table.
   *
   * @param userId - Admin user ID
   * @param permission - Permission to check (AdminPermissionValue)
   * @returns Promise resolving to true if admin has the permission
   */
  hasAdminPermission(userId: string, permission: string): Promise<boolean>;
}
