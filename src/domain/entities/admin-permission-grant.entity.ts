/**
 * ============================================
 * ENTITY: AdminPermissionGrant
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Represents a permission granted to an ADMIN user by a SUPER_ADMIN
 *
 * RESPONSIBILITIES:
 * - Track which permissions are granted to which admin users
 * - Record who granted the permission and when
 * - Maintain audit trail for permission grants
 *
 * BUSINESS RULES:
 * - Only SUPER_ADMIN can grant permissions
 * - Each grant is immutable once created
 * - adminUserId and grantedBy cannot be empty
 */

import { AdminPermission } from '../value-objects/admin-permission.value-object.js';

/**
 * Properties for AdminPermissionGrant
 */
export interface AdminPermissionGrantProps {
  readonly id: string;
  readonly adminUserId: string;
  readonly permission: AdminPermission;
  readonly grantedBy: string;
  readonly grantedAt: Date;
}

/**
 * Data to create a new AdminPermissionGrant
 */
export interface CreateAdminPermissionGrantData {
  readonly id: string;
  readonly adminUserId: string;
  readonly permission: AdminPermission;
  readonly grantedBy: string;
}

/**
 * Entity AdminPermissionGrant
 */
export class AdminPermissionGrant {
  private readonly _props: AdminPermissionGrantProps;

  private constructor(props: AdminPermissionGrantProps) {
    this._props = props;
  }

  /**
   * Creates a new AdminPermissionGrant
   *
   * @param data - Data to create the grant
   * @returns New AdminPermissionGrant instance
   * @throws Error if validation fails
   */
  public static create(data: CreateAdminPermissionGrantData): AdminPermissionGrant {
    // Validate id
    if (!data.id || data.id.trim() === '') {
      throw new Error('id cannot be empty');
    }

    // Validate adminUserId
    if (!data.adminUserId || data.adminUserId.trim() === '') {
      throw new Error('adminUserId cannot be empty');
    }

    // Validate grantedBy
    if (!data.grantedBy || data.grantedBy.trim() === '') {
      throw new Error('grantedBy cannot be empty');
    }

    const now = new Date();

    const props: AdminPermissionGrantProps = {
      id: data.id,
      adminUserId: data.adminUserId,
      permission: data.permission,
      grantedBy: data.grantedBy,
      grantedAt: now,
    };

    return new AdminPermissionGrant(props);
  }

  /**
   * Reconstructs an AdminPermissionGrant from persistence
   *
   * @param props - Properties from database
   * @returns AdminPermissionGrant instance
   */
  public static fromPersistence(props: AdminPermissionGrantProps): AdminPermissionGrant {
    return new AdminPermissionGrant(props);
  }

  /**
   * Gets the grant ID
   */
  public get id(): string {
    return this._props.id;
  }

  /**
   * Gets the admin user ID who received the permission
   */
  public get adminUserId(): string {
    return this._props.adminUserId;
  }

  /**
   * Gets the permission that was granted
   */
  public get permission(): AdminPermission {
    return this._props.permission;
  }

  /**
   * Gets the ID of the user who granted the permission
   */
  public get grantedBy(): string {
    return this._props.grantedBy;
  }

  /**
   * Gets the date when the permission was granted
   */
  public get grantedAt(): Date {
    return new Date(this._props.grantedAt);
  }

  /**
   * Compares two AdminPermissionGrants by ID
   *
   * @param other - Another AdminPermissionGrant
   * @returns true if they have the same ID
   */
  public equals(other: AdminPermissionGrant): boolean {
    return this._props.id === other._props.id;
  }
}
