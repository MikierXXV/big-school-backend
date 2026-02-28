/**
 * USE CASE: RemoveUserFromOrganization
 * Removes a user from an organization (soft delete).
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { RemoveMemberRequestDto, MembershipResponseDto } from '../../dtos/membership/membership.dto.js';
import { UserNotMemberError, OrganizationNotFoundError } from '../../../domain/errors/organization.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';
import { InvalidUserIdError } from '../../../domain/errors/user.errors.js';
import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';

export interface RemoveUserFromOrganizationDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly membershipRepository: IOrganizationMembershipRepository;
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
  readonly dateTimeService: IDateTimeService;
}

export class RemoveUserFromOrganizationUseCase {
  private readonly deps: RemoveUserFromOrganizationDependencies;

  constructor(deps: RemoveUserFromOrganizationDependencies) {
    this.deps = deps;
  }

  public async execute(
    request: RemoveMemberRequestDto,
    executorId: string
  ): Promise<MembershipResponseDto> {
    // 0a. Validate UUID format for userId
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(request.userId)) {
      throw new InvalidUserIdError(request.userId);
    }

    // 0b. Verify organization exists
    const organization = await this.deps.organizationRepository.findById(request.organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(request.organizationId);
    }

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

    const canRemove = isSuperAdmin || hasAssignMembers || userRole === 'org_admin';

    if (!canRemove) {
      throw new InsufficientPermissionsError('Remove members', executorId);
    }

    // 2. Find membership
    const membership = await this.deps.membershipRepository.findActiveMembership(
      request.userId,
      request.organizationId
    );

    if (!membership) {
      throw new UserNotMemberError(request.userId, request.organizationId);
    }

    // 3. Mark as left (soft delete)
    const now = this.deps.dateTimeService.now();
    const updatedMembership = membership.leave(now);

    await this.deps.membershipRepository.update(updatedMembership);

    // 4. Get user details for response
    const user = await this.deps.userRepository.findById(UserId.create(updatedMembership.userId));

    // 5. Return removed membership data
    return {
      id: updatedMembership.id,
      userId: updatedMembership.userId,
      organizationId: updatedMembership.organizationId,
      role: updatedMembership.role.getValue(),
      joinedAt: updatedMembership.joinedAt,
      leftAt: updatedMembership.leftAt,
      isActive: updatedMembership.isActive(),
      email: user?.email.value || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    };
  }
}
