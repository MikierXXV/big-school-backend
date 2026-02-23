/**
 * ============================================
 * DOMAIN ERRORS: Authorization
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Authorization and permission-related domain errors
 */

import { DomainError } from './domain.error.js';

/**
 * Error when an invalid system role value is provided
 */
export class InvalidSystemRoleError extends DomainError {
  public readonly code = 'INVALID_SYSTEM_ROLE';

  constructor(value: unknown) {
    super(
      `Invalid system role: "${value}". Must be one of: super_admin, admin, user`,
      { value }
    );
  }
}

/**
 * Error when an invalid admin permission value is provided
 */
export class InvalidAdminPermissionError extends DomainError {
  public readonly code = 'INVALID_ADMIN_PERMISSION';

  constructor(value: unknown) {
    super(
      `Invalid admin permission: "${value}". Must be one of: manage_users, manage_organizations, assign_members, view_all_data`,
      { value }
    );
  }
}

/**
 * Error when user lacks required permissions for an action
 */
export class InsufficientPermissionsError extends DomainError {
  public readonly code = 'INSUFFICIENT_PERMISSIONS';

  constructor(requiredPermission: string, userId: string) {
    super(
      `User ${userId} lacks permission: ${requiredPermission}`,
      { requiredPermission, userId }
    );
  }
}

/**
 * Error when attempting to modify or delete a SUPER_ADMIN user
 */
export class CannotModifySuperAdminError extends DomainError {
  public readonly code = 'CANNOT_MODIFY_SUPER_ADMIN';

  constructor() {
    super(
      'Cannot modify SUPER_ADMIN users. SUPER_ADMIN role is immutable and protected.'
    );
  }
}

/**
 * Error when user is not authenticated
 */
export class UnauthenticatedError extends DomainError {
  public readonly code = 'UNAUTHENTICATED';

  constructor() {
    super('Authentication required');
  }
}

/**
 * Error when user is authenticated but lacks authorization
 */
export class UnauthorizedError extends DomainError {
  public readonly code = 'UNAUTHORIZED';

  constructor(resource?: string) {
    const message = resource
      ? `Not authorized to access resource: ${resource}`
      : 'Not authorized to perform this action';
    super(message, resource ? { resource } : undefined);
  }
}

/**
 * Error when an invalid organization role value is provided
 */
export class InvalidOrganizationRoleError extends DomainError {
  public readonly code = 'INVALID_ORGANIZATION_ROLE';

  constructor(value: unknown) {
    super(
      `Invalid organization role: "${value}". Must be one of: org_admin, doctor, nurse, specialist, staff, guest`,
      { value }
    );
  }
}
