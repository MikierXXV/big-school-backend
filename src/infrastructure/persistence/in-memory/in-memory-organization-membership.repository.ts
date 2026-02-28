/**
 * ============================================
 * REPOSITORY: InMemoryOrganizationMembershipRepository
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * In-memory implementation of IOrganizationMembershipRepository.
 * ONLY for tests - DO NOT use in production.
 *
 * FEATURES:
 * - Stores memberships in a Map
 * - Enforces uniqueness: only one active membership per user+organization
 * - Simulates all operations
 * - Easy to reset
 */

import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { OrganizationMembership } from '../../../domain/entities/organization-membership.entity.js';
import { MembershipAlreadyExistsError } from '../../../domain/errors/organization.errors.js';

/**
 * In-memory implementation of IOrganizationMembershipRepository.
 * Only for tests.
 */
export class InMemoryOrganizationMembershipRepository
  implements IOrganizationMembershipRepository
{
  /**
   * Membership storage (Map by ID).
   * @private
   */
  private memberships: Map<string, OrganizationMembership> = new Map();

  /**
   * Saves a new membership.
   *
   * @param membership - Membership to save
   * @throws MembershipAlreadyExistsError if active membership already exists
   */
  public async save(membership: OrganizationMembership): Promise<void> {
    // Check if active membership already exists for this user+organization
    const existingActive = await this.findActiveMembership(
      membership.userId,
      membership.organizationId
    );

    if (existingActive) {
      throw new MembershipAlreadyExistsError(
        membership.userId,
        membership.organizationId
      );
    }

    this.memberships.set(membership.id, membership);
  }

  /**
   * Finds all memberships for a user.
   *
   * @param userId - User ID
   * @param activeOnly - If true, only return active memberships
   * @returns Array of Memberships
   */
  public async findByUserId(
    userId: string,
    activeOnly?: boolean
  ): Promise<OrganizationMembership[]> {
    let memberships = Array.from(this.memberships.values()).filter(
      (m) => m.userId === userId
    );

    if (activeOnly) {
      memberships = memberships.filter((m) => m.isActive());
    }

    return memberships;
  }

  /**
   * Finds all memberships in an organization.
   *
   * @param organizationId - Organization ID
   * @param activeOnly - If true, only return active memberships
   * @returns Array of Memberships
   */
  public async findByOrganizationId(
    organizationId: string,
    activeOnly?: boolean
  ): Promise<OrganizationMembership[]> {
    let memberships = Array.from(this.memberships.values()).filter(
      (m) => m.organizationId === organizationId
    );

    if (activeOnly) {
      memberships = memberships.filter((m) => m.isActive());
    }

    return memberships;
  }

  /**
   * Finds active membership for a user in a specific organization.
   *
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Membership or null
   */
  public async findActiveMembership(
    userId: string,
    organizationId: string
  ): Promise<OrganizationMembership | null> {
    const membership = Array.from(this.memberships.values()).find(
      (m) =>
        m.userId === userId &&
        m.organizationId === organizationId &&
        m.isActive()
    );

    return membership ?? null;
  }

  /**
   * Updates an existing membership.
   *
   * @param membership - Membership with updated data
   * @throws Error if membership not found
   */
  public async update(membership: OrganizationMembership): Promise<void> {
    if (!this.memberships.has(membership.id)) {
      throw new Error(`Membership not found: ${membership.id}`);
    }

    this.memberships.set(membership.id, membership);
  }

  /**
   * Removes a membership by ID.
   *
   * @param id - Membership ID
   * @throws Error if membership not found
   */
  public async remove(id: string): Promise<void> {
    if (!this.memberships.has(id)) {
      throw new Error(`Membership not found: ${id}`);
    }

    this.memberships.delete(id);
  }

  // ============================================
  // TEST HELPERS (only for tests)
  // ============================================

  /**
   * Resets the repository (clears all data).
   * Only for tests.
   */
  public reset(): void {
    this.memberships.clear();
  }

  /**
   * Gets the number of memberships stored.
   * Only for tests.
   */
  public count(): number {
    return this.memberships.size;
  }
}
