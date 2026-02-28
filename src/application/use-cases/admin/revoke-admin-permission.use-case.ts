/**
 * ============================================
 * USE CASE: RevokeAdminPermission
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Revokes a permission from an ADMIN user.
 */

import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAdminPermissionRepository } from '../../../domain/repositories/admin-permission.repository.interface.js';
import { AdminPermission } from '../../../domain/value-objects/admin-permission.value-object.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import {
  RevokePermissionRequestDto,
  AdminPermissionsResponseDto,
} from '../../dtos/admin/admin.dto.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import {
  InsufficientPermissionsError,
  CannotModifySuperAdminError,
} from '../../../domain/errors/authorization.errors.js';

export interface RevokeAdminPermissionDependencies {
  readonly userRepository: UserRepository;
  readonly adminPermissionRepository: IAdminPermissionRepository;
  readonly authorizationService: IAuthorizationService;
}

export class RevokeAdminPermissionUseCase {
  private readonly deps: RevokeAdminPermissionDependencies;

  constructor(deps: RevokeAdminPermissionDependencies) {
    this.deps = deps;
  }

  public async execute(
    request: RevokePermissionRequestDto,
    executorId: string
  ): Promise<AdminPermissionsResponseDto> {
    // 1. Verify executor is SUPER_ADMIN
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);

    if (!isSuperAdmin) {
      throw new InsufficientPermissionsError('SUPER_ADMIN role', executorId);
    }

    // 2. Find target user
    const targetUser = await this.deps.userRepository.findById(UserId.create(request.userId));

    if (!targetUser) {
      throw new UserNotFoundError(request.userId);
    }

    // 3. Check target is not SUPER_ADMIN
    if (targetUser.isSuperAdmin()) {
      throw new CannotModifySuperAdminError();
    }

    // 4. Find the grant to revoke
    const permission = AdminPermission.create(request.permission);
    const grants = await this.deps.adminPermissionRepository.findByUserId(request.userId);
    const grantToRevoke = grants.find(g => g.permission.equals(permission));

    if (grantToRevoke) {
      await this.deps.adminPermissionRepository.revoke(grantToRevoke.id);
    }

    // 5. Return remaining permissions
    const remainingGrants = await this.deps.adminPermissionRepository.findByUserId(request.userId);

    return {
      userId: request.userId,
      systemRole: targetUser.systemRole.getValue(),
      grantedPermissions: remainingGrants.map(grant => ({
        permission: grant.permission.getValue(),
        grantedBy: grant.grantedBy,
        grantedAt: grant.grantedAt,
      })),
    };
  }
}
