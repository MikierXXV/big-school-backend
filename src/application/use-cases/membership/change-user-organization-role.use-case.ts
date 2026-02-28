/**
 * USE CASE: ChangeUserOrganizationRole
 * Changes a user's role within an organization.
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { OrganizationRole } from '../../../domain/value-objects/organization-role.value-object.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { ChangeMemberRoleRequestDto, MembershipResponseDto } from '../../dtos/membership/membership.dto.js';
import { UserNotMemberError, OrganizationNotFoundError } from '../../../domain/errors/organization.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface ChangeUserOrganizationRoleDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly membershipRepository: IOrganizationMembershipRepository;
  readonly authorizationService: IAuthorizationService;
  readonly dateTimeService: IDateTimeService;
}

export class ChangeUserOrganizationRoleUseCase {
  private readonly deps: ChangeUserOrganizationRoleDependencies;

  constructor(deps: ChangeUserOrganizationRoleDependencies) {
    this.deps = deps;
  }

  public async execute(
    request: ChangeMemberRoleRequestDto,
    executorId: string
  ): Promise<MembershipResponseDto> {
    // 0. Verify organization exists
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

    const canChange = isSuperAdmin || hasAssignMembers || userRole === 'org_admin';

    if (!canChange) {
      throw new InsufficientPermissionsError('Change member role', executorId);
    }

    // 2. Find membership and verify it exists
    const membership = await this.deps.membershipRepository.findActiveMembership(
      request.userId,
      request.organizationId
    );

    if (!membership) {
      throw new UserNotMemberError(request.userId, request.organizationId);
    }

    // 3. Change role
    const now = this.deps.dateTimeService.now();
    const newRole = OrganizationRole.create(request.newRole);
    const updatedMembership = membership.changeRole(newRole, now);

    await this.deps.membershipRepository.update(updatedMembership);

    // 4. Return response
    return {
      id: updatedMembership.id,
      userId: updatedMembership.userId,
      organizationId: updatedMembership.organizationId,
      role: updatedMembership.role.getValue(),
      joinedAt: updatedMembership.joinedAt,
      isActive: updatedMembership.isActive(),
    };
  }
}
