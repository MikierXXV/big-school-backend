/**
 * ============================================
 * REPOSITORY: InMemoryOrganizationRepository
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * In-memory implementation of IOrganizationRepository.
 * ONLY for tests - DO NOT use in production.
 *
 * FEATURES:
 * - Stores organizations in a Map
 * - Simulates all operations
 * - Allows preset of data
 * - Easy to reset
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { Organization } from '../../../domain/entities/organization.entity.js';
import {
  OrganizationAlreadyExistsError,
  OrganizationNotFoundError,
} from '../../../domain/errors/organization.errors.js';

/**
 * In-memory implementation of IOrganizationRepository.
 * Only for tests.
 */
export class InMemoryOrganizationRepository implements IOrganizationRepository {
  /**
   * Organization storage (Map by ID).
   * @private
   */
  private organizations: Map<string, Organization> = new Map();

  /**
   * Index by name for fast lookups and uniqueness checks.
   * @private
   */
  private nameIndex: Map<string, string> = new Map(); // name -> orgId

  /**
   * Saves a new organization.
   *
   * @param organization - Organization to save
   * @throws OrganizationAlreadyExistsError if name already exists
   */
  public async save(organization: Organization): Promise<void> {
    // Verify name uniqueness
    if (this.nameIndex.has(organization.name)) {
      throw new OrganizationAlreadyExistsError(organization.name);
    }

    // Save organization
    this.organizations.set(organization.id, organization);
    this.nameIndex.set(organization.name, organization.id);
  }

  /**
   * Updates an existing organization.
   *
   * @param organization - Organization with changes
   * @throws OrganizationNotFoundError if not found
   */
  public async update(organization: Organization): Promise<void> {
    if (!this.organizations.has(organization.id)) {
      throw new OrganizationNotFoundError(organization.id);
    }

    // Get existing organization to update name index if name changed
    const existingOrg = this.organizations.get(organization.id)!;
    if (existingOrg.name !== organization.name) {
      // Check if new name already exists (but not from this org)
      const existingIdWithNewName = this.nameIndex.get(organization.name);
      if (existingIdWithNewName && existingIdWithNewName !== organization.id) {
        throw new OrganizationAlreadyExistsError(organization.name);
      }

      // Update name index
      this.nameIndex.delete(existingOrg.name);
      this.nameIndex.set(organization.name, organization.id);
    }

    this.organizations.set(organization.id, organization);
  }

  /**
   * Deletes an organization.
   *
   * @param id - Organization ID
   * @throws OrganizationNotFoundError if not found
   */
  public async delete(id: string): Promise<void> {
    const org = this.organizations.get(id);
    if (!org) {
      throw new OrganizationNotFoundError(id);
    }

    this.nameIndex.delete(org.name);
    this.organizations.delete(id);
  }

  /**
   * Finds an organization by ID.
   *
   * @param id - Organization ID
   * @returns Organization or null
   */
  public async findById(id: string): Promise<Organization | null> {
    return this.organizations.get(id) ?? null;
  }

  /**
   * Finds an organization by name.
   *
   * @param name - Organization name
   * @returns Organization or null
   */
  public async findByName(name: string): Promise<Organization | null> {
    const orgId = this.nameIndex.get(name);
    if (!orgId) {
      return null;
    }
    return this.organizations.get(orgId) ?? null;
  }

  /**
   * Finds all organizations with optional filters.
   *
   * @param options - Query options (filters, pagination)
   * @returns Array of Organizations
   */
  public async findAll(
    options?: {
      active?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Organization[]> {
    let orgs = Array.from(this.organizations.values());

    // Filter by active status
    // The key 'active' can be: undefined (not present), true, or false
    // - If active is not present in options OR is true: show active only (default behavior)
    // - If active is false: show inactive only
    // - If active is undefined but present as a key: show all
    const activeFilter = options?.active;
    const hasActiveKey = options !== undefined && 'active' in options;

    if (activeFilter === false) {
      // Explicitly show inactive only
      orgs = orgs.filter((org) => org.active === false);
    } else if (activeFilter === undefined && hasActiveKey) {
      // Key exists but value is undefined - show all
      // This allows: findAll({ active: undefined }) to return all
    } else {
      // Default: show active only (when active is true or not specified)
      orgs = orgs.filter((org) => org.active === true);
    }

    // Apply pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit;

    if (limit !== undefined) {
      return orgs.slice(offset, offset + limit);
    }

    return orgs.slice(offset);
  }

  // ============================================
  // TEST HELPERS (only for tests)
  // ============================================

  /**
   * Resets the repository (clears all data).
   * Only for tests.
   */
  public reset(): void {
    this.organizations.clear();
    this.nameIndex.clear();
  }

  /**
   * Gets the number of organizations stored.
   * Only for tests.
   */
  public count(): number {
    return this.organizations.size;
  }
}
