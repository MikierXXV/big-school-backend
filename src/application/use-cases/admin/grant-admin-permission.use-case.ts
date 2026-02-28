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

    // 2. FIRST: Validate target user is admin (validation - 400 if not)
    const systemRole = targetUser.systemRole.getValue();
    if (systemRole !== 'admin' && systemRole !== 'super_admin') {
      throw new InvalidFieldFormatError('userId', 'Must be an admin user');
    }

    // 3. Check target is not SUPER_ADMIN (authorization - 403 if yes)
    if (targetUser.isSuperAdmin()) {
      throw new CannotModifySuperAdminError();
    }

    // 4. THEN: Verify executor is SUPER_ADMIN (authorization - 403 if not)
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);

    if (!isSuperAdmin) {
      throw new InsufficientPermissionsError('SUPER_ADMIN role', executorId);
    }

    // 4. For each permission, check if already granted, then grant
    for (const permissionValue of request.permissions) {
      const permission = AdminPermission.create(permissionValue);

      // Check if already granted (skip if exists - idempotent)
      const hasPermission = await this.deps.adminPermissionRepository.hasPermission(
        request.userId,
        permission
      );

      if (!hasPermission) {
        // Create and save grant
        const grant = AdminPermissionGrant.create({
          id: this.deps.uuidGenerator.generate(),
          adminUserId: request.userId,
          permission,
          grantedBy: executorId,
        });

        await this.deps.adminPermissionRepository.grant(grant);
      }
    }

    // 5. Return all granted permissions
    const grants = await this.deps.adminPermissionRepository.findByUserId(request.userId);

    return {
      userId: request.userId,
      systemRole: targetUser.systemRole.getValue(),
      grantedPermissions: grants.map(grant => ({
        permission: grant.permission.getValue(),
        grantedBy: grant.grantedBy,
        grantedAt: grant.grantedAt,
      })),
    };
  }
}
