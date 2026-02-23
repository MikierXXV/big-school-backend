/**
 * ============================================
 * VALUE OBJECT: OrganizationType
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Type/category of healthcare organization
 *
 * CARACTERÍSTICAS:
 * - Inmutable
 * - Self-validating
 * - Value equality (equals by value, not reference)
 *
 * TYPES:
 * - hospital: Full-service hospital
 * - clinic: Medical clinic
 * - health_center: Community health center
 * - laboratory: Medical laboratory
 * - pharmacy: Pharmacy/drugstore
 * - other: Other healthcare organization
 */

import { InvalidOrganizationTypeError } from '../errors/organization.errors.js';

/**
 * Valid organization type values
 */
export type OrganizationTypeValue =
  | 'hospital'
  | 'clinic'
  | 'health_center'
  | 'laboratory'
  | 'pharmacy'
  | 'other';

/**
 * OrganizationType Value Object
 */
export class OrganizationType {
  private constructor(private readonly _value: OrganizationTypeValue) {
    Object.freeze(this);
  }

  /**
   * Creates an OrganizationType from a string value
   *
   * @param value - Type value ('hospital', 'clinic', 'health_center', 'laboratory', 'pharmacy', 'other')
   * @returns OrganizationType instance
   * @throws InvalidOrganizationTypeError if value is invalid
   */
  public static create(value: string): OrganizationType {
    if (!value || typeof value !== 'string') {
      throw new InvalidOrganizationTypeError(value);
    }

    const normalizedValue = value.toLowerCase().trim();

    if (!this.isValidType(normalizedValue)) {
      throw new InvalidOrganizationTypeError(value);
    }

    return new OrganizationType(normalizedValue as OrganizationTypeValue);
  }

  /**
   * Factory method for HOSPITAL type
   */
  public static HOSPITAL(): OrganizationType {
    return new OrganizationType('hospital');
  }

  /**
   * Factory method for CLINIC type
   */
  public static CLINIC(): OrganizationType {
    return new OrganizationType('clinic');
  }

  /**
   * Factory method for HEALTH_CENTER type
   */
  public static HEALTH_CENTER(): OrganizationType {
    return new OrganizationType('health_center');
  }

  /**
   * Factory method for LABORATORY type
   */
  public static LABORATORY(): OrganizationType {
    return new OrganizationType('laboratory');
  }

  /**
   * Factory method for PHARMACY type
   */
  public static PHARMACY(): OrganizationType {
    return new OrganizationType('pharmacy');
  }

  /**
   * Factory method for OTHER type
   */
  public static OTHER(): OrganizationType {
    return new OrganizationType('other');
  }

  /**
   * Validates if a value is a valid organization type
   *
   * @param value - Value to validate
   * @returns true if valid, false otherwise
   */
  private static isValidType(value: string): value is OrganizationTypeValue {
    const validTypes: OrganizationTypeValue[] = [
      'hospital',
      'clinic',
      'health_center',
      'laboratory',
      'pharmacy',
      'other',
    ];
    return validTypes.includes(value as OrganizationTypeValue);
  }

  /**
   * Gets the internal type value
   */
  public getValue(): OrganizationTypeValue {
    return this._value;
  }

  /**
   * Compares this OrganizationType with another for equality
   *
   * @param other - OrganizationType to compare with
   * @returns true if values are equal, false otherwise
   */
  public equals(other: OrganizationType): boolean {
    if (!(other instanceof OrganizationType)) {
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
