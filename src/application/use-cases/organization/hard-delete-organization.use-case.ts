/**
 * USE CASE: HardDeleteOrganization
 * Permanently removes an organization (SUPER_ADMIN or ADMIN with MANAGE_ORGANIZATIONS only).
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { OrganizationNotFoundError } from '../../../domain/errors/organization.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface HardDeleteOrganizationDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly authorizationService: IAuthorizationService;
}

export class HardDeleteOrganizationUseCase {
  private readonly deps: HardDeleteOrganizationDependencies;

  constructor(deps: HardDeleteOrganizationDependencies) {
    this.deps = deps;
  }

  public async execute(organizationId: string, executorId: string): Promise<{ id: string; name: string }> {
    const organization = await this.deps.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasManageOrgs = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'manage_organizations'
    );

    if (!isSuperAdmin && !hasManageOrgs) {
      throw new InsufficientPermissionsError('Hard delete organization', executorId);
    }

    await this.deps.organizationRepository.hardDelete(organizationId);

    return { id: organization.id, name: organization.name };
  }
}
