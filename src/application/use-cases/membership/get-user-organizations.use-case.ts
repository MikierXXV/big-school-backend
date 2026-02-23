/**
 * USE CASE: GetUserOrganizations
 * Gets all organizations where a user is a member.
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { UserOrganizationsResponseDto } from '../../dtos/membership/membership.dto.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface GetUserOrganizationsDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly membershipRepository: IOrganizationMembershipRepository;
  readonly authorizationService: IAuthorizationService;
}

export class GetUserOrganizationsUseCase {
  private readonly deps: GetUserOrganizationsDependencies;

  constructor(deps: GetUserOrganizationsDependencies) {
    this.deps = deps;
  }

  public async execute(
    userId: string,
    executorId: string
  ): Promise<UserOrganizationsResponseDto> {
    // 1. Check permissions (can view own or if ADMIN/SUPER_ADMIN)
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasManageUsers = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'manage_users'
    );
    const isSelf = executorId === userId;

    if (!isSuperAdmin && !hasManageUsers && !isSelf) {
      throw new InsufficientPermissionsError('View user organizations', executorId);
    }

    // 2. Get memberships
    const memberships = await this.deps.membershipRepository.findByUserId(userId, true);

    // 3. Get organization details
    const organizations = [];

    for (const membership of memberships) {
      const org = await this.deps.organizationRepository.findById(membership.organizationId);
      if (org) {
        organizations.push({
          organizationId: org.id,
          organizationName: org.name,
          role: membership.role.getValue(),
          joinedAt: membership.joinedAt,
        });
      }
    }

    return {
      userId,
      organizations,
      totalOrganizations: organizations.length,
    };
  }
}
