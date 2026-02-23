/**
 * USE CASE: GetOrganization
 * Gets organization details if user has access.
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { OrganizationResponseDto } from '../../dtos/organization/organization.dto.js';
import { OrganizationNotFoundError } from '../../../domain/errors/organization.errors.js';
import { UnauthorizedError } from '../../../domain/errors/authorization.errors.js';

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
    // 1. Find organization
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
    return {
      id: organization.id,
      name: organization.name,
      type: organization.type.getValue(),
      description: organization.description ?? undefined,
      address: organization.address ?? undefined,
      contactEmail: organization.contactEmail ?? undefined,
      contactPhone: organization.contactPhone ?? undefined,
      active: organization.active,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
