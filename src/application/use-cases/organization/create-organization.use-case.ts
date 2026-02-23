/**
 * ============================================
 * USE CASE: CreateOrganization
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Creates a new organization and assigns creator as ORG_ADMIN.
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { Organization } from '../../../domain/entities/organization.entity.js';
import { OrganizationMembership } from '../../../domain/entities/organization-membership.entity.js';
import { OrganizationType } from '../../../domain/value-objects/organization-type.value-object.js';
import { OrganizationRole } from '../../../domain/value-objects/organization-role.value-object.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IUuidGenerator } from '../../ports/uuid-generator.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import {
  CreateOrganizationRequestDto,
  OrganizationResponseDto,
} from '../../dtos/organization/organization.dto.js';
import { OrganizationAlreadyExistsError } from '../../../domain/errors/organization.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface CreateOrganizationDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly membershipRepository: IOrganizationMembershipRepository;
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
  readonly uuidGenerator: IUuidGenerator;
  readonly dateTimeService: IDateTimeService;
}

export class CreateOrganizationUseCase {
  private readonly deps: CreateOrganizationDependencies;

  constructor(deps: CreateOrganizationDependencies) {
    this.deps = deps;
  }

  public async execute(
    request: CreateOrganizationRequestDto,
    executorId: string
  ): Promise<OrganizationResponseDto> {
    // 1. Verify executor has permission (SUPER_ADMIN OR ADMIN with MANAGE_ORGANIZATIONS)
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasManageOrgs = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'manage_organizations'
    );

    if (!isSuperAdmin && !hasManageOrgs) {
      throw new InsufficientPermissionsError('MANAGE_ORGANIZATIONS', executorId);
    }

    // 2. Check name doesn't exist
    const existing = await this.deps.organizationRepository.findByName(request.name);
    if (existing) {
      throw new OrganizationAlreadyExistsError(request.name);
    }

    // 3. Create Organization
    const orgId = this.deps.uuidGenerator.generate();
    const orgType = OrganizationType.create(request.type);

    const organization = Organization.create({
      id: orgId,
      name: request.name,
      type: orgType,
      description: request.description,
      address: request.address,
      contactEmail: request.contactEmail,
      contactPhone: request.contactPhone,
    });

    // 4. Save organization
    await this.deps.organizationRepository.save(organization);

    // 5. Create membership for creator as ORG_ADMIN
    const membershipId = this.deps.uuidGenerator.generate();
    const membership = OrganizationMembership.create({
      id: membershipId,
      userId: executorId,
      organizationId: orgId,
      role: OrganizationRole.ORG_ADMIN(),
      createdBy: executorId,
    });

    await this.deps.membershipRepository.save(membership);

    // 6. Return response
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
