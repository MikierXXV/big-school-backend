/**
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
 * ============================================
 * USE CASE: DemoteToUser
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Demotes an ADMIN to USER role.
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { SystemRole } from '../../../domain/value-objects/system-role.value-object.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import {
  DemoteToUserRequestDto,
  AdminRoleResponseDto,
} from '../../dtos/admin/admin.dto.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import {
  InsufficientPermissionsError,
  CannotModifySuperAdminError,
} from '../../../domain/errors/authorization.errors.js';

export interface DemoteToUserDependencies {
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
  readonly dateTimeService: IDateTimeService;
}

export class DemoteToUserUseCase {
  private readonly deps: DemoteToUserDependencies;

  constructor(deps: DemoteToUserDependencies) {
    this.deps = deps;
  }

  public async execute(
    request: DemoteToUserRequestDto,
    executorId: string
  ): Promise<AdminRoleResponseDto> {
    // 1. Verify executor is SUPER_ADMIN
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);

    if (!isSuperAdmin) {
      throw new InsufficientPermissionsError('SUPER_ADMIN role', executorId);
    }

    // 2. Find target user
    const targetUser = await this.deps.userRepository.findById(request.userId);

    if (!targetUser) {
      throw new UserNotFoundError(request.userId);
    }

    // 3. Check target is not SUPER_ADMIN
    if (targetUser.isSuperAdmin()) {
      throw new CannotModifySuperAdminError();
    }

    // 4. If already USER, return success (idempotent)
    if (targetUser.isUser()) {
      return this.buildResponse(targetUser);
    }

    // 5. Change systemRole to USER
    const now = this.deps.dateTimeService.now();
    const updatedUser = targetUser.changeSystemRole(SystemRole.USER(), now);

    // 6. Update user
    await this.deps.userRepository.update(updatedUser);

    // 7. Return response DTO
    return this.buildResponse(updatedUser);
  }

  private buildResponse(user: any): AdminRoleResponseDto {
    return {
      userId: user.id.value,
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      systemRole: user.systemRole.getValue(),
      updatedAt: user.updatedAt,
    };
  }
}
