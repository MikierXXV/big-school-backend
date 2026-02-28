/**
 * ============================================
 * VALUE OBJECT: OrganizationRole
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Role within a specific organization (org_admin > doctor/nurse/specialist > staff > guest)
 *
 * CARACTERÍSTICAS:
 * - Inmutable
 * - Self-validating
 * - Value equality (equals by value, not reference)
 *
 * ROLES:
 * - org_admin: Organization administrator with full control within the org
 * - doctor: Medical doctor with full patient access
 * - nurse: Nursing staff with patient care access
 * - specialist: Medical specialist with specific access
 * - staff: Administrative or support staff
 * - guest: Read-only guest access
 */

import { InvalidOrganizationRoleError } from '../errors/authorization.errors.js';

/**
 * Valid organization role values
 */
export type OrganizationRoleValue =
  | 'org_admin'
  | 'doctor'
  | 'nurse'
  | 'specialist'
  | 'staff'
  | 'guest';

/**
 * OrganizationRole Value Object
 */
export class OrganizationRole {
  private constructor(private readonly _value: OrganizationRoleValue) {
    Object.freeze(this);
  }

  /**
   * Creates an OrganizationRole from a string value
   *
   * @param value - Role value ('org_admin', 'doctor', 'nurse', 'specialist', 'staff', 'guest')
   * @returns OrganizationRole instance
   * @throws InvalidOrganizationRoleError if value is invalid
   */
  public static create(value: string): OrganizationRole {
    if (!value || typeof value !== 'string') {
      throw new InvalidOrganizationRoleError(value);
    }

    const normalizedValue = value.toLowerCase().trim();

    if (!this.isValidRole(normalizedValue)) {
      throw new InvalidOrganizationRoleError(value);
    }

    return new OrganizationRole(normalizedValue as OrganizationRoleValue);
  }

  /**
   * Factory method for ORG_ADMIN role
   */
  public static ORG_ADMIN(): OrganizationRole {
    return new OrganizationRole('org_admin');
  }

  /**
   * Factory method for DOCTOR role
   */
  public static DOCTOR(): OrganizationRole {
    return new OrganizationRole('doctor');
  }

  /**
   * Factory method for NURSE role
   */
  public static NURSE(): OrganizationRole {
    return new OrganizationRole('nurse');
  }

  /**
   * Factory method for SPECIALIST role
   */
  public static SPECIALIST(): OrganizationRole {
    return new OrganizationRole('specialist');
  }

  /**
   * Factory method for STAFF role
   */
  public static STAFF(): OrganizationRole {
    return new OrganizationRole('staff');
  }

  /**
   * Factory method for GUEST role
   */
  public static GUEST(): OrganizationRole {
    return new OrganizationRole('guest');
  }

  /**
   * Validates if a value is a valid organization role
   *
   * @param value - Value to validate
   * @returns true if valid, false otherwise
   */
  private static isValidRole(value: string): value is OrganizationRoleValue {
    const validRoles: OrganizationRoleValue[] = [
      'org_admin',
      'doctor',
      'nurse',
      'specialist',
      'staff',
      'guest',
    ];
    return validRoles.includes(value as OrganizationRoleValue);
  }

  /**
   * Gets the internal role value
   */
  public getValue(): OrganizationRoleValue {
    return this._value;
  }

  /**
   * Compares this OrganizationRole with another for equality
   *
   * @param other - OrganizationRole to compare with
   * @returns true if values are equal, false otherwise
   */
  public equals(other: OrganizationRole): boolean {
    if (!(other instanceof OrganizationRole)) {
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
