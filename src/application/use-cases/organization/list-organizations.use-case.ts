/**
 * USE CASE: ListOrganizations
 * Lists organizations based on user permissions.
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { ListOrganizationsQueryDto, OrganizationResponseDto } from '../../dtos/organization/organization.dto.js';

export interface ListOrganizationsDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly membershipRepository: IOrganizationMembershipRepository;
  readonly authorizationService: IAuthorizationService;
}

export class ListOrganizationsUseCase {
  private readonly deps: ListOrganizationsDependencies;

  constructor(deps: ListOrganizationsDependencies) {
    this.deps = deps;
  }

  public async execute(
    query: ListOrganizationsQueryDto,
    executorId: string
  ): Promise<OrganizationResponseDto[]> {
    // 1. Check if user can see all organizations
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasViewAll = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'view_all_data'
    );

    const canViewAll = isSuperAdmin || hasViewAll;

    // 2. Get organizations
    let organizations;

    if (canViewAll) {
      // Get all with filters
      const limit = query.limit || 10;
      const offset = ((query.page || 1) - 1) * limit;

      organizations = await this.deps.organizationRepository.findAll({
        active: query.active,
        limit,
        offset,
      });
    } else {
      // Get only user's organizations
      const memberships = await this.deps.membershipRepository.findByUserId(executorId, true);
      const orgIds = memberships.map(m => m.organizationId);

      organizations = [];
      for (const orgId of orgIds) {
        const org = await this.deps.organizationRepository.findById(orgId);
        if (org && (query.active === undefined || org.active === query.active)) {
          organizations.push(org);
        }
      }
    }

    // 3. Return response
    return organizations.map(org => ({
      id: org.id,
      name: org.name,
      type: org.type.getValue(),
      description: org.description ?? undefined,
      address: org.address ?? undefined,
      contactEmail: org.contactEmail ?? undefined,
      contactPhone: org.contactPhone ?? undefined,
      active: org.active,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }));
  }
}
