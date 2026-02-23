/**
 * USE CASE: RemoveUserFromOrganization
 * Removes a user from an organization (soft delete).
 */

import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { RemoveMemberRequestDto } from '../../dtos/membership/membership.dto.js';
import { UserNotMemberError } from '../../../domain/errors/organization.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface RemoveUserFromOrganizationDependencies {
  readonly membershipRepository: IOrganizationMembershipRepository;
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
  ): Promise<void> {
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
  }
}
