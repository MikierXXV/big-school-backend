/**
 * USE CASE: DeleteUser
 * Deactivates a user account (soft delete).
 * Only SUPER_ADMIN or ADMIN with manage_users permission can perform this action.
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface DeleteUserDependencies {
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
  readonly dateTimeService: IDateTimeService;
}

export interface DeleteUserResponseDto {
  readonly id: string;
  readonly status: string;
}

export class DeleteUserUseCase {
  private readonly deps: DeleteUserDependencies;

  constructor(deps: DeleteUserDependencies) {
    this.deps = deps;
  }

  public async execute(
    targetUserId: string,
    executorId: string
  ): Promise<DeleteUserResponseDto> {
    // 1. Check permissions (SUPER_ADMIN or ADMIN with manage_users)
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasManageUsers = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'manage_users'
    );

    if (!isSuperAdmin && !hasManageUsers) {
      throw new InsufficientPermissionsError('Delete user', executorId);
    }

    // 2. Prevent deleting own account
    if (targetUserId === executorId) {
      throw new InsufficientPermissionsError('Delete own account', executorId);
    }

    // 3. Find user
    const userId = UserId.create(targetUserId);
    const user = await this.deps.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(targetUserId);
    }

    // 4. Prevent non-superadmin from deleting superadmins
    if (!isSuperAdmin && user.isSuperAdmin()) {
      throw new InsufficientPermissionsError('Delete super admin', executorId);
    }

    // 5. Soft delete: set status to DEACTIVATED
    const now = this.deps.dateTimeService.now();
    const deactivatedUser = user.deactivate(now);
    await this.deps.userRepository.update(deactivatedUser);

    return {
      id: deactivatedUser.id.value,
      status: deactivatedUser.status,
    };
  }
}
