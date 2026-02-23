/**
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
 * ============================================
 * USE CASE: GetAdminPermissions
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Gets all permissions granted to an ADMIN user.
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAdminPermissionRepository } from '../../../domain/repositories/admin-permission.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { AdminPermissionsResponseDto } from '../../dtos/admin/admin.dto.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface GetAdminPermissionsDependencies {
  readonly userRepository: UserRepository;
  readonly adminPermissionRepository: IAdminPermissionRepository;
  readonly authorizationService: IAuthorizationService;
}

export class GetAdminPermissionsUseCase {
  private readonly deps: GetAdminPermissionsDependencies;

  constructor(deps: GetAdminPermissionsDependencies) {
    this.deps = deps;
  }

  public async execute(
    userId: string,
    executorId: string
  ): Promise<AdminPermissionsResponseDto> {
    // 1. Verify executor has permission (SUPER_ADMIN or self)
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const isSelf = executorId === userId;

    if (!isSuperAdmin && !isSelf) {
      throw new InsufficientPermissionsError('View permissions', executorId);
    }

    // 2. Find target user
    const targetUser = await this.deps.userRepository.findById(userId);

    if (!targetUser) {
      throw new UserNotFoundError(userId);
    }

    // 3. Get all grants
    const grants = await this.deps.adminPermissionRepository.findByUserId(userId);

    return {
      userId,
      systemRole: targetUser.systemRole.getValue(),
      grantedPermissions: grants.map(grant => ({
        permission: grant.permission.getValue(),
        grantedBy: grant.grantedBy,
        grantedAt: grant.grantedAt,
      })),
    };
  }
}
