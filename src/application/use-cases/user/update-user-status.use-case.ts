/**
 * USE CASE: UpdateUserStatus
 * Changes a user's account status (activate, suspend, deactivate).
 * Only SUPER_ADMIN or ADMIN with manage_users permission can perform this action.
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface UpdateUserStatusDependencies {
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
  readonly dateTimeService: IDateTimeService;
}

export interface UpdateUserStatusRequestDto {
  readonly targetUserId: string;
  readonly newStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

export interface UpdateUserStatusResponseDto {
  readonly id: string;
  readonly status: string;
}

export class UpdateUserStatusUseCase {
  private readonly deps: UpdateUserStatusDependencies;

  constructor(deps: UpdateUserStatusDependencies) {
    this.deps = deps;
  }

  public async execute(
    dto: UpdateUserStatusRequestDto,
    executorId: string
  ): Promise<UpdateUserStatusResponseDto> {
    // 1. Check permissions (SUPER_ADMIN or ADMIN with manage_users)
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasManageUsers = await this.deps.authorizationService.hasAdminPermission(
      executorId,
      'manage_users'
    );

    if (!isSuperAdmin && !hasManageUsers) {
      throw new InsufficientPermissionsError('Update user status', executorId);
    }

    // 2. Prevent changing own status
    if (dto.targetUserId === executorId) {
      throw new InsufficientPermissionsError('Update own status', executorId);
    }

    // 3. Find user
    const userId = UserId.create(dto.targetUserId);
    const user = await this.deps.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(dto.targetUserId);
    }

    // 4. Prevent non-superadmin from changing superadmin status
    if (!isSuperAdmin && user.isSuperAdmin()) {
      throw new InsufficientPermissionsError('Update super admin status', executorId);
    }

    // 5. Apply status transition
    const now = this.deps.dateTimeService.now();
    let updatedUser;
    switch (dto.newStatus) {
      case 'ACTIVE':
        updatedUser = user.reactivate(now);
        break;
      case 'SUSPENDED':
        updatedUser = user.suspend(now);
        break;
      case 'DEACTIVATED':
        updatedUser = user.deactivate(now);
        break;
    }

    await this.deps.userRepository.update(updatedUser);

    return {
      id: updatedUser.id.value,
      status: updatedUser.status,
    };
  }
}
