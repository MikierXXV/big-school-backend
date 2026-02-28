/**
 * USE CASE: GetOrganization
 * Gets organization details if user has access.
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { OrganizationResponseDto } from '../../dtos/organization/organization.dto.js';
import { OrganizationNotFoundError, InvalidOrganizationIdError } from '../../../domain/errors/organization.errors.js';
import { UnauthorizedError } from '../../../domain/errors/authorization.errors.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GetOrganizationDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly authorizationService: IAuthorizationService;
}

export class GetOrganizationUseCase {
  private readonly deps: GetOrganizationDependencies;

  constructor(deps: GetOrganizationDependencies) {
    this.deps = deps;
  }

  public async execute(
    organizationId: string,
    executorId: string
  ): Promise<OrganizationResponseDto> {
    // 1. Validate UUID format
    if (!UUID_REGEX.test(organizationId)) {
      throw new InvalidOrganizationIdError(organizationId);
    }

    // 2. Find organization
    const organization = await this.deps.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    // 2. Check access
    const canAccess = await this.deps.authorizationService.canAccessOrganization(
      executorId,
      organizationId
    );

    if (!canAccess) {
      throw new UnauthorizedError('organization');
    }

    // 3. Return response
    const response: any = {
      id: organization.id,
      name: organization.name,
      type: organization.type.getValue(),
      active: organization.active,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };

    // Only add optional fields if they have values
    if (organization.description !== null) {
      response.description = organization.description;
    }
    if (organization.address !== null) {
      response.address = organization.address;
    }
    if (organization.contactEmail !== null) {
      response.contactEmail = organization.contactEmail;
    }
    if (organization.contactPhone !== null) {
      response.contactPhone = organization.contactPhone;
    }

    return response;
  }
}
