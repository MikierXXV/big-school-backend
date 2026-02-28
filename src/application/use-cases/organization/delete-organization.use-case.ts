/**
 * USE CASE: DeleteOrganization
 * Deletes an organization (SUPER_ADMIN or ADMIN with MANAGE_ORGANIZATIONS only).
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { OrganizationNotFoundError } from '../../../domain/errors/organization.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';
import { OrganizationResponseDto } from '../../dtos/organization/organization.dto.js';

export interface DeleteOrganizationDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly authorizationService: IAuthorizationService;
}

export class DeleteOrganizationUseCase {
  private readonly deps: DeleteOrganizationDependencies;

  constructor(deps: DeleteOrganizationDependencies) {
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

    // 2. Check permissions (only SUPER_ADMIN or ADMIN with MANAGE_ORGANIZATIONS)
    // ORG_ADMIN cannot delete organizations
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasManageOrgs = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'manage_organizations'
    );

    if (!isSuperAdmin && !hasManageOrgs) {
      throw new InsufficientPermissionsError('Delete organization', executorId);
    }

    // 3. Delete organization (soft delete - sets active=false)
    await this.deps.organizationRepository.delete(organizationId);

    // 4. Fetch updated organization to get current state
    const deletedOrganization = await this.deps.organizationRepository.findById(organizationId);

    // 5. Return deleted organization data
    return {
      id: organization.id,
      name: organization.name,
      type: organization.type.getValue(),
      active: deletedOrganization?.active ?? false,
      contactInfo: {
        email: organization.contactEmail || null,
        phone: organization.contactPhone || null,
        address: organization.address || null,
      },
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
