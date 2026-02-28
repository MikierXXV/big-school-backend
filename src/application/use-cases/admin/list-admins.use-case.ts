/**
 * ============================================
 * USE CASE: ListAdmins
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Lists all users with ADMIN or SUPER_ADMIN role with their permissions.
 * Only SUPER_ADMIN users can execute this use case.
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAdminPermissionRepository } from '../../../domain/repositories/admin-permission.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { AdminListResponseDto } from '../../dtos/admin/admin.dto.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';

export interface ListAdminsDependencies {
  readonly userRepository: UserRepository;
  readonly adminPermissionRepository: IAdminPermissionRepository;
  readonly authorizationService: IAuthorizationService;
}

export class ListAdminsUseCase {
  private readonly deps: ListAdminsDependencies;

  constructor(deps: ListAdminsDependencies) {
    this.deps = deps;
  }

  public async execute(executorId: string): Promise<AdminListResponseDto> {
    // 1. Verify executor is SUPER_ADMIN
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);

    if (!isSuperAdmin) {
      throw new InsufficientPermissionsError('List admins', executorId);
    }

    // 2. Get all users with systemRole = 'admin' or 'super_admin'
    const adminUsers = await this.deps.userRepository.findBySystemRole([
      'admin',
      'super_admin',
    ]);

    // 3. For each user, get their permissions
    const adminsWithPermissions = await Promise.all(
      adminUsers.map(async (user) => {
        const grants = await this.deps.adminPermissionRepository.findByUserId(
          user.id.value
        );

        return {
          userId: user.id.value,
          email: user.email.value,
          firstName: user.firstName,
          lastName: user.lastName,
          systemRole: user.systemRole.getValue(),
          permissions: grants.map((grant) => grant.permission.getValue()),
        };
      })
    );

    return {
      admins: adminsWithPermissions,
    };
  }
}
