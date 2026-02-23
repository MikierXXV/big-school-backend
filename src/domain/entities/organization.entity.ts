/**
 * ============================================
 * ENTITY: Organization
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Represents a healthcare organization (hospital, clinic, etc.)
 *
 * RESPONSIBILITIES:
 * - Maintain organization identity and information
 * - Manage active/inactive status
 * - Apply business rules for organization management
 *
 * BUSINESS RULES:
 * - Name cannot be empty
 * - Organization can be activated/deactivated
 * - Information can be updated but identity (id) remains immutable
 */

import { OrganizationType } from '../value-objects/organization-type.value-object.js';

/**
 * Properties for Organization
 */
export interface OrganizationProps {
  readonly id: string;
  readonly name: string;
  readonly type: OrganizationType;
  readonly description: string | null;
  readonly address: string | null;
  readonly contactEmail: string | null;
  readonly contactPhone: string | null;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Data to create a new Organization
 */
export interface CreateOrganizationData {
  readonly id: string;
  readonly name: string;
  readonly type: OrganizationType;
  readonly description?: string | null;
  readonly address?: string | null;
  readonly contactEmail?: string | null;
  readonly contactPhone?: string | null;
}

/**
 * Data to update Organization information
 */
export interface UpdateOrganizationData {
  readonly name?: string;
  readonly description?: string | null;
  readonly address?: string | null;
  readonly contactEmail?: string | null;
  readonly contactPhone?: string | null;
}

/**
 * Entity Organization
 */
export class Organization {
  private readonly _props: OrganizationProps;

  private constructor(props: OrganizationProps) {
    this._props = props;
  }

  /**
   * Creates a new Organization
   *
   * @param data - Data to create the organization
   * @returns New Organization instance
   * @throws Error if validation fails
   */
  public static create(data: CreateOrganizationData): Organization {
    // Validate id
    if (!data.id || data.id.trim() === '') {
      throw new Error('id cannot be empty');
    }

    // Validate name
    if (!data.name || data.name.trim() === '') {
      throw new Error('name cannot be empty');
    }

    const now = new Date();

    const props: OrganizationProps = {
      id: data.id,
      name: data.name,
      type: data.type,
      description: data.description ?? null,
      address: data.address ?? null,
      contactEmail: data.contactEmail ?? null,
      contactPhone: data.contactPhone ?? null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    return new Organization(props);
  }

  /**
   * Reconstructs an Organization from persistence
   *
   * @param props - Properties from database
   * @returns Organization instance
   */
  public static fromPersistence(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  /**
   * Gets the organization ID
   */
  public get id(): string {
    return this._props.id;
  }

  /**
   * Gets the organization name
   */
  public get name(): string {
    return this._props.name;
  }

  /**
   * Gets the organization type
   */
  public get type(): OrganizationType {
    return this._props.type;
  }

  /**
   * Gets the organization description
   */
  public get description(): string | null {
    return this._props.description;
  }

  /**
   * Gets the organization address
   */
  public get address(): string | null {
    return this._props.address;
  }

  /**
   * Gets the contact email
   */
  public get contactEmail(): string | null {
    return this._props.contactEmail;
  }

  /**
   * Gets the contact phone
   */
  public get contactPhone(): string | null {
    return this._props.contactPhone;
  }

  /**
   * Gets the active status
   */
  public get active(): boolean {
    return this._props.active;
  }

  /**
   * Gets the creation date
   */
  public get createdAt(): Date {
    return new Date(this._props.createdAt);
  }

  /**
   * Gets the last update date
   */
  public get updatedAt(): Date {
    return new Date(this._props.updatedAt);
  }

  /**
   * Activates the organization
   *
   * @param activatedAt - Date of activation
   * @returns New Organization instance with active status
   */
  public activate(activatedAt: Date): Organization {
    const newProps: OrganizationProps = {
      ...this._props,
      active: true,
      updatedAt: activatedAt,
    };

    return new Organization(newProps);
  }

  /**
   * Deactivates the organization
   *
   * @param deactivatedAt - Date of deactivation
   * @returns New Organization instance with inactive status
   */
  public deactivate(deactivatedAt: Date): Organization {
    const newProps: OrganizationProps = {
      ...this._props,
      active: false,
      updatedAt: deactivatedAt,
    };

    return new Organization(newProps);
  }

  /**
   * Updates organization information
   *
   * @param data - Data to update
   * @param updatedAt - Date of update
   * @returns New Organization instance with updated information
   * @throws Error if validation fails
   */
  public updateInfo(data: UpdateOrganizationData, updatedAt: Date): Organization {
    // Validate name if provided
    if (data.name !== undefined && (!data.name || data.name.trim() === '')) {
      throw new Error('name cannot be empty');
    }

    const newProps: OrganizationProps = {
      ...this._props,
      name: data.name !== undefined ? data.name : this._props.name,
      description: data.description !== undefined ? data.description : this._props.description,
      address: data.address !== undefined ? data.address : this._props.address,
      contactEmail: data.contactEmail !== undefined ? data.contactEmail : this._props.contactEmail,
      contactPhone: data.contactPhone !== undefined ? data.contactPhone : this._props.contactPhone,
      updatedAt,
    };

    return new Organization(newProps);
  }

  /**
   * Compares two Organizations by ID
   *
   * @param other - Another Organization
   * @returns true if they have the same ID
   */
  public equals(other: Organization): boolean {
    return this._props.id === other._props.id;
  }
}
