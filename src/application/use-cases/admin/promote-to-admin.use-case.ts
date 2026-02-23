/**
 * ============================================
 * USE CASE: PromoteToAdmin
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Promotes a USER to ADMIN role.
 *
 * FLOW:
 * 1. Verify executor is SUPER_ADMIN
 * 2. Find target user
 * 3. Check target is not SUPER_ADMIN
 * 4. If already ADMIN, return success (idempotent)
 * 5. Change systemRole to ADMIN
 * 6. Update user
 * 7. Return response DTO
 *
 * DEPENDENCIES (injected):
 * - UserRepository: User persistence
 * - AuthorizationService: Permission checks
 * - DateTimeService: Current time
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { SystemRole } from '../../../domain/value-objects/system-role.value-object.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import {
  PromoteToAdminRequestDto,
  AdminRoleResponseDto,
} from '../../dtos/admin/admin.dto.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import {
  InsufficientPermissionsError,
  CannotModifySuperAdminError,
} from '../../../domain/errors/authorization.errors.js';

/**
 * Dependencies for PromoteToAdminUseCase
 */
export interface PromoteToAdminDependencies {
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
  readonly dateTimeService: IDateTimeService;
}

/**
 * Use case: Promote USER to ADMIN role
 */
export class PromoteToAdminUseCase {
  private readonly deps: PromoteToAdminDependencies;

  constructor(deps: PromoteToAdminDependencies) {
    this.deps = deps;
  }

  /**
   * Executes the promote to admin use case
   *
   * @param request - DTO with target user ID
   * @param executorId - ID of user performing the operation
   * @returns DTO with updated user information
   *
   * @throws InsufficientPermissionsError if executor is not SUPER_ADMIN
   * @throws UserNotFoundError if target user does not exist
   * @throws CannotModifySuperAdminError if attempting to modify SUPER_ADMIN
   */
  public async execute(
    request: PromoteToAdminRequestDto,
    executorId: string
  ): Promise<AdminRoleResponseDto> {
    // 1. Verify executor is SUPER_ADMIN
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(
      executorId
    );

    if (!isSuperAdmin) {
      throw new InsufficientPermissionsError('SUPER_ADMIN role', executorId);
    }

    // 2. Find target user
    const userId = UserId.create(request.userId);
    const targetUser = await this.deps.userRepository.findById(userId);

    if (!targetUser) {
      throw new UserNotFoundError(request.userId);
    }

    // 3. Check target is not SUPER_ADMIN
    if (targetUser.isSuperAdmin()) {
      throw new CannotModifySuperAdminError();
    }

    // 4. If already ADMIN, return success (idempotent)
    if (targetUser.isAdmin()) {
      return this.buildResponse(targetUser);
    }

    // 5. Change systemRole to ADMIN
    const now = this.deps.dateTimeService.now();
    const updatedUser = targetUser.changeSystemRole(SystemRole.ADMIN(), now);

    // 6. Update user
    await this.deps.userRepository.update(updatedUser);

    // 7. Return response DTO
    return this.buildResponse(updatedUser);
  }

  /**
   * Builds the response DTO from updated user
   */
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
