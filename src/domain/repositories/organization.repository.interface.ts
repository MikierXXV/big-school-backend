/**
 * ============================================
 * REPOSITORY INTERFACE: IOrganizationRepository
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Repository interface for Organization entity following Hexagonal Architecture.
 * The domain defines the interface; infrastructure implements it.
 *
 * OPERATIONS:
 * - save: Create or update organization
 * - findById: Find organization by ID
 * - findByName: Find organization by name
 * - findAll: List all organizations (with pagination)
 * - update: Update existing organization
 * - delete: Remove organization
 */

import { Organization } from '../entities/organization.entity.js';

/**
 * Organization repository interface
 */
export interface IOrganizationRepository {
  /**
   * Saves a new organization or updates existing one
   *
   * @param organization - Organization to save
   * @returns Promise resolving to void
   */
  save(organization: Organization): Promise<void>;

  /**
   * Finds an organization by ID
   *
   * @param id - Organization ID
   * @returns Promise resolving to Organization or null if not found
   */
  findById(id: string): Promise<Organization | null>;

  /**
   * Finds an organization by name
   *
   * @param name - Organization name
   * @returns Promise resolving to Organization or null if not found
   */
  findByName(name: string): Promise<Organization | null>;

  /**
   * Finds all organizations with optional filters
   *
   * @param options - Query options (filters, pagination, etc.)
   * @returns Promise resolving to array of Organizations
   */
  findAll(options?: {
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Organization[]>;

  /**
   * Updates an existing organization
   *
   * @param organization - Organization with updated data
   * @returns Promise resolving to void
   */
  update(organization: Organization): Promise<void>;

  /**
   * Deletes an organization by ID
   *
   * @param id - Organization ID
   * @returns Promise resolving to void
   */
  delete(id: string): Promise<void>;
}
