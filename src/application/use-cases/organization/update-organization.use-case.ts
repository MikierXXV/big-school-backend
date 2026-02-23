/**
 * USE CASE: UpdateOrganization
 * Updates organization information.
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { UpdateOrganizationRequestDto, OrganizationResponseDto } from '../../dtos/organization/organization.dto.js';
import { OrganizationNotFoundError } from '../../../domain/errors/organization.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface UpdateOrganizationDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly authorizationService: IAuthorizationService;
  readonly dateTimeService: IDateTimeService;
}

export class UpdateOrganizationUseCase {
  private readonly deps: UpdateOrganizationDependencies;

  constructor(deps: UpdateOrganizationDependencies) {
    this.deps = deps;
  }

  public async execute(
    organizationId: string,
    request: UpdateOrganizationRequestDto,
    executorId: string
  ): Promise<OrganizationResponseDto> {
    // 1. Find organization
    const organization = await this.deps.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    // 2. Check permissions (ORG_ADMIN, ADMIN with MANAGE_ORGANIZATIONS, or SUPER_ADMIN)
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasManageOrgs = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'manage_organizations'
    );
    const userRole = await this.deps.authorizationService.getUserOrganizationRole(
      executorId,
      organizationId
    );

    const canUpdate = isSuperAdmin || hasManageOrgs || userRole === 'org_admin';

    if (!canUpdate) {
      throw new InsufficientPermissionsError('Update organization', executorId);
    }

    // 3. Update organization
    const now = this.deps.dateTimeService.now();

    let updatedOrg = organization;

    if (request.name || request.description !== undefined || request.address !== undefined ||
        request.contactEmail !== undefined || request.contactPhone !== undefined) {
      updatedOrg = organization.updateInfo({
        name: request.name,
        description: request.description,
        address: request.address,
        contactEmail: request.contactEmail,
        contactPhone: request.contactPhone,
      }, now);
    }

    if (request.active !== undefined) {
      updatedOrg = request.active ? updatedOrg.activate(now) : updatedOrg.deactivate(now);
    }

    await this.deps.organizationRepository.update(updatedOrg);

    // 4. Return response
    return {
      id: updatedOrg.id,
      name: updatedOrg.name,
      type: updatedOrg.type.getValue(),
      description: updatedOrg.description ?? undefined,
      address: updatedOrg.address ?? undefined,
      contactEmail: updatedOrg.contactEmail ?? undefined,
      contactPhone: updatedOrg.contactPhone ?? undefined,
      active: updatedOrg.active,
      createdAt: updatedOrg.createdAt,
      updatedAt: updatedOrg.updatedAt,
    };
  }
}
