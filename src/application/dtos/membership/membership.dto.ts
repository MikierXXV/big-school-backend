/**
 * ============================================
 * DTOs: Membership Management
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Data Transfer Objects for organization membership management.
 * These DTOs define the API contract between use cases and controllers.
 */

/**
 * Request to assign a user to an organization
 */
export interface AssignMemberRequestDto {
  /** User ID to assign */
  readonly userId: string;
  /** Organization ID */
  readonly organizationId: string;
  /** Role within the organization (OrganizationRoleValue) */
  readonly role: string;
}

/**
 * Request to change a user's role within an organization
 */
export interface ChangeMemberRoleRequestDto {
  /** User ID */
  readonly userId: string;
  /** Organization ID */
  readonly organizationId: string;
  /** New role (OrganizationRoleValue) */
  readonly newRole: string;
}

/**
 * Request to remove a user from an organization
 */
export interface RemoveMemberRequestDto {
  /** User ID to remove */
  readonly userId: string;
  /** Organization ID */
  readonly organizationId: string;
}

/**
 * Response with membership data
 */
export interface MembershipResponseDto {
  /** Membership ID */
  readonly id: string;
  /** User ID */
  readonly userId: string;
  /** Organization ID */
  readonly organizationId: string;
  /** Role within the organization */
  readonly role: string;
  /** Date when user joined */
  readonly joinedAt: Date;
  /** Date when user left (null if still active) */
  readonly leftAt?: Date;
  /** Whether membership is currently active */
  readonly isActive: boolean;
  /** Optional user details */
  readonly user?: {
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
  };
}

/**
 * Response with organization's member list
 */
export interface OrganizationMembersResponseDto {
  /** Organization ID */
  readonly organizationId: string;
  /** List of memberships */
  readonly members: MembershipResponseDto[];
  /** Total number of members */
  readonly totalMembers: number;
}

/**
 * Response with user's organizations
 */
export interface UserOrganizationsResponseDto {
  /** User ID */
  readonly userId: string;
  /** List of organizations where user is a member */
  readonly organizations: {
    readonly organizationId: string;
    readonly organizationName: string;
    readonly role: string;
    readonly joinedAt: Date;
  }[];
  /** Total number of organizations */
  readonly totalOrganizations: number;
}
