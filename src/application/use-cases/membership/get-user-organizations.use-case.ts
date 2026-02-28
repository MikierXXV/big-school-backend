/**
 * USE CASE: GetUserOrganizations
 * Gets all organizations where a user is a member.
 */

import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../../domain/repositories/organization-membership.repository.interface.js';
import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { UserOrganizationsResponseDto } from '../../dtos/membership/membership.dto.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';
import { InvalidUserIdError, UserNotFoundError } from '../../../domain/errors/user.errors.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';

export interface GetUserOrganizationsDependencies {
  readonly organizationRepository: IOrganizationRepository;
  readonly membershipRepository: IOrganizationMembershipRepository;
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
}

export class GetUserOrganizationsUseCase {
  private readonly deps: GetUserOrganizationsDependencies;

  constructor(deps: GetUserOrganizationsDependencies) {
    this.deps = deps;
  }

  public async execute(
    userId: string,
    executorId: string,
    options?: { page?: number; limit?: number }
  ): Promise<UserOrganizationsResponseDto> {
    // 0. Validate UUID format
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!UUID_REGEX.test(userId)) {
      throw new InvalidUserIdError(userId);
    }

    // 0b. Verify user exists
    const user = await this.deps.userRepository.findById(UserId.create(userId));
    if (!user) {
      throw new UserNotFoundError(userId);
    }

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
          organizationType: org.type.getValue(),
          role: membership.role.getValue(),
          joinedAt: membership.joinedAt,
        });
      }
    }

    // 4. Apply pagination
    const page = options?.page || 1;
    const limit = options?.limit || organizations.length;
    const startIndex = (page - 1) * limit;
    const paginatedOrganizations = organizations.slice(startIndex, startIndex + limit);

    return {
      userId,
      organizations: paginatedOrganizations,
      total: organizations.length,
      page,
      limit,
    };
  }
}
