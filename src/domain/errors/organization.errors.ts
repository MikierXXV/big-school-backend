/**
 * ============================================
 * DOMAIN ERRORS: Organization
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Organization-related domain errors
 */

import { DomainError } from './domain.error.js';

/**
 * Error when an invalid organization type value is provided
 */
export class InvalidOrganizationTypeError extends DomainError {
  public readonly code = 'INVALID_ORGANIZATION_TYPE';

  constructor(value: unknown) {
    super(
      `Invalid organization type: "${value}". Must be one of: hospital, clinic, health_center, laboratory, pharmacy, other`,
      { value }
    );
  }
}

/**
 * Error when an organization is not found
 */
export class OrganizationNotFoundError extends DomainError {
  public readonly code = 'ORGANIZATION_NOT_FOUND';

  constructor(identifier: string, identifierType: 'id' | 'name' = 'id') {
    super(
      `Organization not found with ${identifierType}: ${identifier}`,
      { identifier, identifierType }
    );
  }
}

/**
 * Error when an organization already exists
 */
export class OrganizationAlreadyExistsError extends DomainError {
  public readonly code = 'ORGANIZATION_ALREADY_EXISTS';

  constructor(name: string) {
    super(
      `An organization with name "${name}" already exists`,
      { name }
    );
  }
}

/**
 * Error when a user is not a member of an organization
 */
export class UserNotMemberError extends DomainError {
  public readonly code = 'USER_NOT_MEMBER';

  constructor(userId: string, organizationId: string) {
    super(
      `User ${userId} is not a member of organization ${organizationId}`,
      { userId, organizationId }
    );
  }
}

/**
 * Error when a membership already exists
 */
export class MembershipAlreadyExistsError extends DomainError {
  public readonly code = 'MEMBERSHIP_ALREADY_EXISTS';

  constructor(userId: string, organizationId: string) {
    super(
      `User ${userId} is already a member of organization ${organizationId}`,
      { userId, organizationId }
    );
  }
}
