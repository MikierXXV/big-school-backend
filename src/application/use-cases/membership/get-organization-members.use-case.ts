/**
 * USE CASE: GetOrganizationMembers
 * Gets all members of an organization.
 */

import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { OrganizationMembersResponseDto } from '../../dtos/membership/membership.dto.js';
import { UnauthorizedError } from '../../../domain/errors/authorization.errors.js';
import { OrganizationNotFoundError } from '../../../domain/errors/organization.errors.js';

export interface GetOrganizationMembersDependencies {
  readonly organizationRepository: IOrganizationRepository;
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
    executorId: string,
    options?: { page?: number; limit?: number; role?: string }
  ): Promise<OrganizationMembersResponseDto> {
    // 1. Verify organization exists
    const organization = await this.deps.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    // 2. Check access
    const canAccess = await this.deps.authorizationService.canAccessOrganization(
      executorId,
      organizationId
    );

    if (!canAccess) {
      throw new UnauthorizedError('organization members');
    }

    // 2. Get memberships
    let memberships = await this.deps.membershipRepository.findByOrganizationId(
      organizationId,
      true
    );

    // 3. Filter by role if specified
    if (options?.role) {
      memberships = memberships.filter(m => m.role.getValue() === options.role);
    }

    // 4. Get user details
    const members = [];

    for (const membership of memberships) {
      const user = await this.deps.userRepository.findById(UserId.create(membership.userId));

      const memberData: any = {
        id: membership.id,
        userId: membership.userId,
        organizationId: membership.organizationId,
        role: membership.role.getValue(),
        joinedAt: membership.joinedAt,
        isActive: membership.isActive(),
        email: user?.email.value || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
      };

      // Only add leftAt if it exists
      if (membership.leftAt !== null) {
        memberData.leftAt = membership.leftAt;
      }

      members.push(memberData);
    }

    // 5. Apply pagination
    const page = options?.page || 1;
    const limit = options?.limit || members.length;
    const startIndex = (page - 1) * limit;
    const paginatedMembers = members.slice(startIndex, startIndex + limit);

    return {
      organizationId,
      members: paginatedMembers,
      total: members.length,
      page,
      limit,
    };
  }
}
