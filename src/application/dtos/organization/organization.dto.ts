/**
 * ============================================
 * DTOs: Organization Management
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Data Transfer Objects for organization management.
 * These DTOs define the API contract between use cases and controllers.
 */

/**
 * Request to create a new organization
 */
export interface CreateOrganizationRequestDto {
  /** Organization name (required) */
  readonly name: string;
  /** Organization type (OrganizationTypeValue) */
  readonly type: string;
  /** Optional description */
  readonly description?: string;
  /** Optional physical address */
  readonly address?: string;
  /** Optional contact email */
  readonly contactEmail?: string;
  /** Optional contact phone */
  readonly contactPhone?: string;
}

/**
 * Request to update an existing organization
 */
export interface UpdateOrganizationRequestDto {
  /** New name (optional) */
  readonly name?: string;
  /** New type (optional) */
  readonly type?: string;
  /** New description (optional) */
  readonly description?: string;
  /** New address (optional) */
  readonly address?: string;
  /** New contact email (optional) */
  readonly contactEmail?: string;
  /** New contact phone (optional) */
  readonly contactPhone?: string;
  /** Active status (optional) */
  readonly active?: boolean;
}

/**
 * Response with organization data
 */
export interface OrganizationResponseDto {
  /** Organization ID */
  readonly id: string;
  /** Organization name */
  readonly name: string;
  /** Organization type */
  readonly type: string;
  /** Description (may be null) */
  readonly description?: string;
  /** Physical address (may be null) */
  readonly address?: string;
  /** Contact email (may be null) */
  readonly contactEmail?: string;
  /** Contact phone (may be null) */
  readonly contactPhone?: string;
  /** Active status */
  readonly active: boolean;
  /** Creation date */
  readonly createdAt: Date;
  /** Last update date */
  readonly updatedAt: Date;
}

/**
 * Query parameters for listing organizations
 */
export interface ListOrganizationsQueryDto {
  /** Filter by organization type (optional) */
  readonly type?: string;
  /** Filter by active status (optional) */
  readonly active?: boolean;
  /** Page number for pagination (optional, default: 1) */
  readonly page?: number;
  /** Number of results per page (optional, default: 10) */
  readonly limit?: number;
}

/**
 * Response for listing organizations
 */
export interface ListOrganizationsResponseDto {
  /** Array of organizations */
  readonly organizations: OrganizationResponseDto[];
  /** Total number of organizations matching the query */
  readonly total: number;
  /** Current page number */
  readonly page: number;
  /** Number of items per page */
  readonly limit: number;
}
