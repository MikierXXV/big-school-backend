/**
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
 * USE CASE: GetOrganizationMembers
 * Gets all members of an organization.
 */

import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { OrganizationMembersResponseDto } from '../../dtos/membership/membership.dto.js';
import { UnauthorizedError } from '../../../domain/errors/authorization.errors.js';

export interface GetOrganizationMembersDependencies {
  readonly membershipRepository: IOrganizationMembershipRepository;
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
}

export class GetOrganizationMembersUseCase {
  private readonly deps: GetOrganizationMembersDependencies;

  constructor(deps: GetOrganizationMembersDependencies) {
    this.deps = deps;
  }

  public async execute(
    organizationId: string,
    executorId: string
  ): Promise<OrganizationMembersResponseDto> {
    // 1. Check access
    const canAccess = await this.deps.authorizationService.canAccessOrganization(
      executorId,
      organizationId
    );

    if (!canAccess) {
      throw new UnauthorizedError('organization members');
    }

    // 2. Get memberships
    const memberships = await this.deps.membershipRepository.findByOrganizationId(
      organizationId,
      true
    );

    // 3. Get user details
    const members = [];

    for (const membership of memberships) {
      const user = await this.deps.userRepository.findById(membership.userId);

      members.push({
        id: membership.id,
        userId: membership.userId,
        organizationId: membership.organizationId,
        role: membership.role.getValue(),
        joinedAt: membership.joinedAt,
        leftAt: membership.leftAt ?? undefined,
        isActive: membership.isActive(),
        user: user ? {
          email: user.email.value,
          firstName: user.firstName,
          lastName: user.lastName,
        } : undefined,
      });
    }

    return {
      organizationId,
      members,
      totalMembers: members.length,
    };
  }
}
