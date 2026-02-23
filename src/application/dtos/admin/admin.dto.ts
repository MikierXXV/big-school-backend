/**
 * ============================================
 * DTOs: Admin Management
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Data Transfer Objects for admin role and permission management.
 * These DTOs define the API contract between use cases and controllers.
 */

/**
 * Request to promote a USER to ADMIN role
 */
export interface PromoteToAdminRequestDto {
  /** User ID to promote */
  readonly userId: string;
}

/**
 * Request to demote an ADMIN to USER role
 */
export interface DemoteToUserRequestDto {
  /** User ID to demote */
  readonly userId: string;
}

/**
 * Request to grant one or more permissions to an ADMIN
 */
export interface GrantPermissionRequestDto {
  /** Admin user ID receiving the permissions */
  readonly userId: string;
  /** Array of permissions to grant (AdminPermissionValue) */
  readonly permissions: string[];
}

/**
 * Request to revoke a permission from an ADMIN
 */
export interface RevokePermissionRequestDto {
  /** Admin user ID whose permission to revoke */
  readonly userId: string;
  /** Permission to revoke (AdminPermissionValue) */
  readonly permission: string;
}

/**
 * Response with user information after promotion/demotion
 */
export interface AdminRoleResponseDto {
  /** User ID */
  readonly userId: string;
  /** User email */
  readonly email: string;
  /** User first name */
  readonly firstName: string;
  /** User last name */
  readonly lastName: string;
  /** Current system role ('admin' or 'user') */
  readonly systemRole: string;
  /** Date of last update */
  readonly updatedAt: Date;
}

/**
 * Response with admin user's granted permissions
 */
export interface AdminPermissionsResponseDto {
  /** Admin user ID */
  readonly userId: string;
  /** Current system role */
  readonly systemRole: string;
  /** List of granted permissions with metadata */
  readonly grantedPermissions: {
    /** Permission name (AdminPermissionValue) */
    readonly permission: string;
    /** User ID who granted this permission */
    readonly grantedBy: string;
    /** Date when permission was granted */
    readonly grantedAt: Date;
  }[];
}
