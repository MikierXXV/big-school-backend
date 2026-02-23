/**
 * ============================================
 * VALUE OBJECT: AdminPermission
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Granular permissions that can be granted to ADMIN users by SUPER_ADMIN
 *
 * CARACTERÍSTICAS:
 * - Inmutable
 * - Self-validating
 * - Value equality
 *
 * PERMISSIONS:
 * - manage_users: Create, edit, delete users; promote/demote admins
 * - manage_organizations: Create, edit, delete organizations
 * - assign_members: Assign users to organizations and change their roles
 * - view_all_data: View data from all organizations (bypass membership requirement)
 */

import { InvalidAdminPermissionError } from '../errors/authorization.errors.js';

/**
 * Valid admin permission values
 */
export type AdminPermissionValue =
  | 'manage_users'
  | 'manage_organizations'
  | 'assign_members'
  | 'view_all_data';

/**
 * AdminPermission Value Object
 */
export class AdminPermission {
  private constructor(private readonly _value: AdminPermissionValue) {
    Object.freeze(this);
  }

  /**
   * Creates an AdminPermission from a string value
   *
   * @param value - Permission value
   * @returns AdminPermission instance
   * @throws InvalidAdminPermissionError if value is invalid
   */
  public static create(value: string): AdminPermission {
    if (!value || typeof value !== 'string') {
      throw new InvalidAdminPermissionError(value);
    }

    const normalizedValue = value.toLowerCase().trim();

    if (!this.isValidPermission(normalizedValue)) {
      throw new InvalidAdminPermissionError(value);
    }

    return new AdminPermission(normalizedValue as AdminPermissionValue);
  }

  /**
   * Factory method for MANAGE_USERS permission
   */
  public static MANAGE_USERS(): AdminPermission {
    return new AdminPermission('manage_users');
  }

  /**
   * Factory method for MANAGE_ORGANIZATIONS permission
   */
  public static MANAGE_ORGANIZATIONS(): AdminPermission {
    return new AdminPermission('manage_organizations');
  }

  /**
   * Factory method for ASSIGN_MEMBERS permission
   */
  public static ASSIGN_MEMBERS(): AdminPermission {
    return new AdminPermission('assign_members');
  }

  /**
   * Factory method for VIEW_ALL_DATA permission
   */
  public static VIEW_ALL_DATA(): AdminPermission {
    return new AdminPermission('view_all_data');
  }

  /**
   * Validates if a value is a valid admin permission
   *
   * @param value - Value to validate
   * @returns true if valid, false otherwise
   */
  private static isValidPermission(
    value: string
  ): value is AdminPermissionValue {
    const validPermissions: AdminPermissionValue[] = [
      'manage_users',
      'manage_organizations',
      'assign_members',
      'view_all_data',
    ];
    return validPermissions.includes(value as AdminPermissionValue);
  }

  /**
   * Gets the internal permission value
   */
  public getValue(): AdminPermissionValue {
    return this._value;
  }

  /**
   * Compares this AdminPermission with another for equality
   *
   * @param other - AdminPermission to compare with
   * @returns true if values are equal, false otherwise
   */
  public equals(other: AdminPermission): boolean {
    if (!(other instanceof AdminPermission)) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * Returns string representation
   */
  public toString(): string {
    return this._value;
  }
}
