/**
 * ============================================
 * USE CASE: GrantAdminPermission
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Grants one or more permissions to an ADMIN user.
 */

import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAdminPermissionRepository } from '../../../domain/repositories/admin-permission.repository.interface.js';
import { AdminPermissionGrant } from '../../../domain/entities/admin-permission-grant.entity.js';
import { AdminPermission } from '../../../domain/value-objects/admin-permission.value-object.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { IUuidGenerator } from '../../ports/uuid-generator.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import {
  GrantPermissionRequestDto,
  AdminPermissionsResponseDto,
} from '../../dtos/admin/admin.dto.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import {
  InsufficientPermissionsError,
  CannotModifySuperAdminError,
} from '../../../domain/errors/authorization.errors.js';
import { InvalidFieldFormatError } from '../../errors/validation.errors.js';

export interface GrantAdminPermissionDependencies {
  readonly userRepository: UserRepository;
  readonly adminPermissionRepository: IAdminPermissionRepository;
  readonly authorizationService: IAuthorizationService;
  readonly uuidGenerator: IUuidGenerator;
  readonly dateTimeService: IDateTimeService;
}

export class GrantAdminPermissionUseCase {
  private readonly deps: GrantAdminPermissionDependencies;

  constructor(deps: GrantAdminPermissionDependencies) {
    this.deps = deps;
  }

  public async execute(
    request: GrantPermissionRequestDto,
    executorId: string
  ): Promise<AdminPermissionsResponseDto> {
    // 1. Find target user
    const targetUser = await this.deps.userRepository.findById(UserId.create(request.userId));

    if (!targetUser) {
      throw new UserNotFoundError(request.userId);
    }

    // 2. Early idempotency check: if ALL requested permissions already exist, return current state
    //    without re-validating admin status (idempotent by design).
    const requestedPermissions = request.permissions.map(p => AdminPermission.create(p));
    const allAlreadyGranted = await Promise.all(
      requestedPermissions.map(p =>
        this.deps.adminPermissionRepository.hasPermission(request.userId, p)
      )
    );
    if (allAlreadyGranted.every(Boolean)) {
      const grants = await this.deps.adminPermissionRepository.findByUserId(request.userId);
      return {
        userId: request.userId,
        systemRole: targetUser.systemRole.getValue(),
        permissions: grants.map(grant => ({
          permission: grant.permission.getValue(),
          grantedBy: grant.grantedBy,
          grantedAt: grant.grantedAt,
        })),
      };
    }

    // 3. Validate target user is admin (validation - 400 if not)
    const systemRole = targetUser.systemRole.getValue();
    if (systemRole !== 'admin' && systemRole !== 'super_admin') {
      throw new InvalidFieldFormatError('userId', 'Must be an admin user');
    }

    // 4. Check target is not SUPER_ADMIN (authorization - 403 if yes)
    if (targetUser.isSuperAdmin()) {
      throw new CannotModifySuperAdminError();
    }

    // 5. Verify executor is SUPER_ADMIN (authorization - 403 if not)
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);

    if (!isSuperAdmin) {
      throw new InsufficientPermissionsError('SUPER_ADMIN role', executorId);
    }

    // 6. For each permission, check if already granted, then grant
    for (const permission of requestedPermissions) {
      const hasPermission = await this.deps.adminPermissionRepository.hasPermission(
        request.userId,
        permission
      );

      if (!hasPermission) {
        const grant = AdminPermissionGrant.create({
          id: this.deps.uuidGenerator.generate(),
          adminUserId: request.userId,
          permission,
          grantedBy: executorId,
        });

        await this.deps.adminPermissionRepository.grant(grant);
      }
    }

    // 7. Return all granted permissions
    const grants = await this.deps.adminPermissionRepository.findByUserId(request.userId);

    return {
      userId: request.userId,
      systemRole: targetUser.systemRole.getValue(),
      permissions: grants.map(grant => ({
        permission: grant.permission.getValue(),
        grantedBy: grant.grantedBy,
        grantedAt: grant.grantedAt,
      })),
    };
  }
}
