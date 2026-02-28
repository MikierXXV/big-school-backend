/**
 * ============================================
 * VALUE OBJECT: SystemRole
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Platform-level hierarchical role (super_admin > admin > user)
 *
 * CARACTERÍSTICAS:
 * - Inmutable
 * - Self-validating
 * - Value equality (equals by value, not reference)
 *
 * ROLES:
 * - super_admin: Full platform control, immutable permissions
 * - admin: Delegated admin with permissions granted by SUPER_ADMIN
 * - user: Standard user (default)
 */

import { InvalidSystemRoleError } from '../errors/authorization.errors.js';

/**
 * Valid system role values
 */
export type SystemRoleValue = 'super_admin' | 'admin' | 'user';

/**
 * SystemRole Value Object
 */
export class SystemRole {
  private constructor(private readonly _value: SystemRoleValue) {
    Object.freeze(this);
  }

  /**
   * Creates a SystemRole from a string value
   *
   * @param value - Role value ('super_admin', 'admin', 'user')
   * @returns SystemRole instance
   * @throws InvalidSystemRoleError if value is invalid
   */
  public static create(value: string): SystemRole {
    if (!value || typeof value !== 'string') {
      throw new InvalidSystemRoleError(value);
    }

    const normalizedValue = value.toLowerCase().trim();

    if (!this.isValidRole(normalizedValue)) {
      throw new InvalidSystemRoleError(value);
    }

    return new SystemRole(normalizedValue as SystemRoleValue);
  }

  /**
   * Factory method for SUPER_ADMIN role
   */
  public static SUPER_ADMIN(): SystemRole {
    return new SystemRole('super_admin');
  }

  /**
   * Factory method for ADMIN role
   */
  public static ADMIN(): SystemRole {
    return new SystemRole('admin');
  }

  /**
   * Factory method for USER role (default)
   */
  public static USER(): SystemRole {
    return new SystemRole('user');
  }

  /**
   * Validates if a value is a valid system role
   *
   * @param value - Value to validate
   * @returns true if valid, false otherwise
   */
  private static isValidRole(value: string): value is SystemRoleValue {
    const validRoles: SystemRoleValue[] = ['super_admin', 'admin', 'user'];
    return validRoles.includes(value as SystemRoleValue);
  }

  /**
   * Gets the internal role value
   */
  public getValue(): SystemRoleValue {
    return this._value;
  }

  /**
   * Checks if this role is SUPER_ADMIN
   */
  public isSuperAdmin(): boolean {
    return this._value === 'super_admin';
  }

  /**
   * Checks if this role is ADMIN
   */
  public isAdmin(): boolean {
    return this._value === 'admin';
  }

  /**
   * Checks if this role is USER
   */
  public isUser(): boolean {
    return this._value === 'user';
  }

  /**
   * Compares this SystemRole with another for equality
   *
   * @param other - SystemRole to compare with
   * @returns true if values are equal, false otherwise
   */
  public equals(other: SystemRole): boolean {
    if (!(other instanceof SystemRole)) {
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
