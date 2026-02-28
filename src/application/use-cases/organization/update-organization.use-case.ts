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

    if (request.name || request.type !== undefined || request.description !== undefined || request.address !== undefined ||
        request.contactEmail !== undefined || request.contactPhone !== undefined) {
      const updateData: any = {};
      if (request.name !== undefined) updateData.name = request.name;
      if (request.type !== undefined) updateData.type = request.type;
      if (request.description !== undefined) updateData.description = request.description ?? null;
      if (request.address !== undefined) updateData.address = request.address ?? null;
      if (request.contactEmail !== undefined) updateData.contactEmail = request.contactEmail ?? null;
      if (request.contactPhone !== undefined) updateData.contactPhone = request.contactPhone ?? null;

      updatedOrg = organization.updateInfo(updateData, now);
    }

    if (request.active !== undefined) {
      updatedOrg = request.active ? updatedOrg.activate(now) : updatedOrg.deactivate(now);
    }

    await this.deps.organizationRepository.update(updatedOrg);

    // 4. Return response
    const response: any = {
      id: updatedOrg.id,
      name: updatedOrg.name,
      type: updatedOrg.type.getValue(),
      active: updatedOrg.active,
      createdAt: updatedOrg.createdAt,
      updatedAt: updatedOrg.updatedAt,
    };

    // Only add optional fields if they have values
    if (updatedOrg.description !== null) {
      response.description = updatedOrg.description;
    }
    if (updatedOrg.address !== null) {
      response.address = updatedOrg.address;
    }
    if (updatedOrg.contactEmail !== null) {
      response.contactEmail = updatedOrg.contactEmail;
    }
    if (updatedOrg.contactPhone !== null) {
      response.contactPhone = updatedOrg.contactPhone;
    }

    return response;
  }
}
