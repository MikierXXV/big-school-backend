/**
 * USE CASE: AssignUserToOrganization
 * Assigns a user to an organization with a specific role.
 */

import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { OrganizationMembership } from '../../../domain/entities/organization-membership.entity.js';
import { OrganizationRole } from '../../../domain/value-objects/organization-role.value-object.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IUuidGenerator } from '../../ports/uuid-generator.port.js';
import { AssignMemberRequestDto, MembershipResponseDto } from '../../dtos/membership/membership.dto.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import { OrganizationNotFoundError, MembershipAlreadyExistsError } from '../../../domain/errors/organization.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface AssignUserToOrganizationDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly membershipRepository: IOrganizationMembershipRepository;
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
  readonly uuidGenerator: IUuidGenerator;
}

export class AssignUserToOrganizationUseCase {
  private readonly deps: AssignUserToOrganizationDependencies;

  constructor(deps: AssignUserToOrganizationDependencies) {
    this.deps = deps;
  }

  public async execute(
    request: AssignMemberRequestDto,
    executorId: string
  ): Promise<MembershipResponseDto> {
    // 1. Check permissions
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasAssignMembers = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'assign_members'
    );
    const userRole = await this.deps.authorizationService.getUserOrganizationRole(
      executorId,
      request.organizationId
    );

    const canAssign = isSuperAdmin || hasAssignMembers || userRole === 'org_admin';

    if (!canAssign) {
      throw new InsufficientPermissionsError('Assign members', executorId);
    }

    // 2. Verify organization exists
    const organization = await this.deps.organizationRepository.findById(request.organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(request.organizationId);
    }

    // 3. Verify user exists
    const user = await this.deps.userRepository.findById(UserId.create(request.userId));
    if (!user) {
      throw new UserNotFoundError(request.userId);
    }

    // 4. Check if already member
    const existing = await this.deps.membershipRepository.findActiveMembership(
      request.userId,
      request.organizationId
    );

    if (existing) {
      throw new MembershipAlreadyExistsError(request.userId, request.organizationId);
    }

    // 5. Create membership
    const membershipId = this.deps.uuidGenerator.generate();
    const role = OrganizationRole.create(request.role);

    const membership = OrganizationMembership.create({
      id: membershipId,
      userId: request.userId,
      organizationId: request.organizationId,
      role,
      createdBy: executorId,
    });

    await this.deps.membershipRepository.save(membership);

    // 6. Return response
    return {
      id: membership.id,
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: membership.role.getValue(),
      joinedAt: membership.joinedAt,
      isActive: membership.isActive(),
      user: {
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
