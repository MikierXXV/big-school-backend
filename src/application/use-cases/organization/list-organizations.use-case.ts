/**
 * USE CASE: ListOrganizations
 * Lists organizations based on user permissions.
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { ListOrganizationsQueryDto, ListOrganizationsResponseDto } from '../../dtos/organization/organization.dto.js';
import { OrganizationType } from '../../../domain/value-objects/organization-type.value-object.js';

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
  ): Promise<ListOrganizationsResponseDto> {
    // 1. Check if user can see all organizations
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasViewAll = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'view_all_data'
    );

    const canViewAll = isSuperAdmin || hasViewAll;

    // Set pagination defaults
    const limit = query.limit || 10;
    const page = query.page || 1;

    // 2. Get organizations and total count
    let organizations;
    let total: number;

    if (canViewAll) {
      // Get all with filters for counting
      const countParams: any = {};
      if (query.active !== undefined) {
        countParams.active = query.active;
      }
      const allOrgs = await this.deps.organizationRepository.findAll(countParams);
      total = allOrgs.length;

      // Get paginated results
      const offset = (page - 1) * limit;
      const findAllParams: any = { limit, offset };
      if (query.active !== undefined) {
        findAllParams.active = query.active;
      }

      organizations = await this.deps.organizationRepository.findAll(findAllParams);
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
      total = organizations.length;
    }

    // 2.5. Filter by type if specified
    if (query.type) {
      // Validate type is valid (will throw InvalidOrganizationTypeError if not)
      OrganizationType.create(query.type);

      // Filter organizations by type
      organizations = organizations.filter(org => org.type.getValue() === query.type);
      total = organizations.length;
    }

    // 3. Map to DTOs
    const organizationDtos = organizations.map(org => {
      const response: any = {
        id: org.id,
        name: org.name,
        type: org.type.getValue(),
        active: org.active,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      };

      // Only add optional fields if they have values
      if (org.description !== null) {
        response.description = org.description;
      }
      if (org.address !== null) {
        response.address = org.address;
      }
      if (org.contactEmail !== null) {
        response.contactEmail = org.contactEmail;
      }
      if (org.contactPhone !== null) {
        response.contactPhone = org.contactPhone;
      }

      return response;
    });

    // 4. Return response with pagination metadata
    return {
      organizations: organizationDtos,
      total,
      page,
      limit
    };
  }
}
