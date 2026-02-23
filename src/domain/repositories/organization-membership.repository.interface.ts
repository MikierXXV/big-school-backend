/**
 * ============================================
 * REPOSITORY INTERFACE: IOrganizationMembershipRepository
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Repository interface for OrganizationMembership entity following Hexagonal Architecture.
 * The domain defines the interface; infrastructure implements it.
 *
 * OPERATIONS:
 * - save: Create new membership
 * - findByUserId: Find all memberships for a user
 * - findByOrganizationId: Find all memberships in an organization
 * - findActiveMembership: Find active membership for user in organization
 * - update: Update existing membership
 * - remove: Delete membership
 */

import { OrganizationMembership } from '../entities/organization-membership.entity.js';

/**
 * Organization membership repository interface
 */
export interface IOrganizationMembershipRepository {
  /**
   * Saves a new membership
   *
   * @param membership - Membership to save
   * @returns Promise resolving to void
   */
  save(membership: OrganizationMembership): Promise<void>;

  /**
   * Finds all memberships for a user
   *
   * @param userId - User ID
   * @param activeOnly - If true, only return active memberships (default: false)
   * @returns Promise resolving to array of Memberships
   */
  findByUserId(userId: string, activeOnly?: boolean): Promise<OrganizationMembership[]>;

  /**
   * Finds all memberships in an organization
   *
   * @param organizationId - Organization ID
   * @param activeOnly - If true, only return active memberships (default: false)
   * @returns Promise resolving to array of Memberships
   */
  findByOrganizationId(
    organizationId: string,
    activeOnly?: boolean
  ): Promise<OrganizationMembership[]>;

  /**
   * Finds active membership for a user in a specific organization
   *
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Promise resolving to Membership or null if not found
   */
  findActiveMembership(
    userId: string,
    organizationId: string
  ): Promise<OrganizationMembership | null>;

  /**
   * Updates an existing membership
   *
   * @param membership - Membership with updated data
   * @returns Promise resolving to void
   */
  update(membership: OrganizationMembership): Promise<void>;

  /**
   * Removes a membership by ID
   *
   * @param id - Membership ID
   * @returns Promise resolving to void
   */
  remove(id: string): Promise<void>;
}
