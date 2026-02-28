/**
 * ============================================
 * ENTITY: OrganizationMembership
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Represents a user's membership in an organization with a specific role
 *
 * RESPONSIBILITIES:
 * - Link users to organizations
 * - Define user's role within the organization
 * - Track membership lifecycle (joined, left)
 * - Support role changes
 *
 * BUSINESS RULES:
 * - userId and organizationId cannot be empty
 * - Membership can be active (leftAt = null) or inactive (leftAt set)
 * - Role can be changed while membership is active
 * - Once left, membership is inactive but preserved for audit
 */

import { OrganizationRole } from '../value-objects/organization-role.value-object.js';

/**
 * Properties for OrganizationMembership
 */
export interface OrganizationMembershipProps {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string;
  readonly role: OrganizationRole;
  readonly joinedAt: Date;
  readonly leftAt: Date | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Data to create a new OrganizationMembership
 */
export interface CreateOrganizationMembershipData {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string;
  readonly role: OrganizationRole;
  readonly createdBy: string;
}

/**
 * Entity OrganizationMembership
 */
export class OrganizationMembership {
  private readonly _props: OrganizationMembershipProps;

  private constructor(props: OrganizationMembershipProps) {
    this._props = props;
  }

  /**
   * Creates a new OrganizationMembership
   *
   * @param data - Data to create the membership
   * @returns New OrganizationMembership instance
   * @throws Error if validation fails
   */
  public static create(data: CreateOrganizationMembershipData): OrganizationMembership {
    // Validate id
    if (!data.id || data.id.trim() === '') {
      throw new Error('id cannot be empty');
    }

    // Validate userId
    if (!data.userId || data.userId.trim() === '') {
      throw new Error('userId cannot be empty');
    }

    // Validate organizationId
    if (!data.organizationId || data.organizationId.trim() === '') {
      throw new Error('organizationId cannot be empty');
    }

    // Validate createdBy
    if (!data.createdBy || data.createdBy.trim() === '') {
      throw new Error('createdBy cannot be empty');
    }

    const now = new Date();

    const props: OrganizationMembershipProps = {
      id: data.id,
      userId: data.userId,
      organizationId: data.organizationId,
      role: data.role,
      joinedAt: now,
      leftAt: null,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    return new OrganizationMembership(props);
  }

  /**
   * Reconstructs an OrganizationMembership from persistence
   *
   * @param props - Properties from database
   * @returns OrganizationMembership instance
   */
  public static fromPersistence(props: OrganizationMembershipProps): OrganizationMembership {
    return new OrganizationMembership(props);
  }

  /**
   * Gets the membership ID
   */
  public get id(): string {
    return this._props.id;
  }

  /**
   * Gets the user ID
   */
  public get userId(): string {
    return this._props.userId;
  }

  /**
   * Gets the organization ID
   */
  public get organizationId(): string {
    return this._props.organizationId;
  }

  /**
   * Gets the role within the organization
   */
  public get role(): OrganizationRole {
    return this._props.role;
  }

  /**
   * Gets the date when the user joined the organization
   */
  public get joinedAt(): Date {
    return new Date(this._props.joinedAt);
  }

  /**
   * Gets the date when the user left the organization (null if still active)
   */
  public get leftAt(): Date | null {
    return this._props.leftAt ? new Date(this._props.leftAt) : null;
  }

  /**
   * Gets the ID of the user who created this membership
   */
  public get createdBy(): string {
    return this._props.createdBy;
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
   * Marks the membership as left
   *
   * @param leftAt - Date when the user left
   * @returns New OrganizationMembership instance with leftAt set
   */
  public leave(leftAt: Date): OrganizationMembership {
    const newProps: OrganizationMembershipProps = {
      ...this._props,
      leftAt,
      updatedAt: leftAt,
    };

    return new OrganizationMembership(newProps);
  }

  /**
   * Changes the user's role within the organization
   *
   * @param newRole - New role to assign
   * @param updatedAt - Date of the change
   * @returns New OrganizationMembership instance with updated role
   */
  public changeRole(newRole: OrganizationRole, updatedAt: Date): OrganizationMembership {
    const newProps: OrganizationMembershipProps = {
      ...this._props,
      role: newRole,
      updatedAt,
    };

    return new OrganizationMembership(newProps);
  }

  /**
   * Checks if the membership is currently active
   *
   * @returns true if the user has not left the organization
   */
  public isActive(): boolean {
    return this._props.leftAt === null;
  }

  /**
   * Compares two OrganizationMemberships by ID
   *
   * @param other - Another OrganizationMembership
   * @returns true if they have the same ID
   */
  public equals(other: OrganizationMembership): boolean {
    return this._props.id === other._props.id;
  }
}
