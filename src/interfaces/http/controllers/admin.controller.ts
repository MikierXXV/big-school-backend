/**
 * ============================================
 * CONTROLLER: AdminController
 * ============================================
 *
 * Controlador para endpoints de administración de sistema.
 * Maneja promoción/demostración de admins y gestión de permisos.
 *
 * ENDPOINTS:
 * - POST /admin/promote - Promover usuario a ADMIN
 * - POST /admin/demote - Demostrar admin a USER
 * - POST /admin/permissions/grant - Otorgar permiso a admin
 * - POST /admin/permissions/revoke - Revocar permiso a admin
 * - GET /admin/list - Listar administradores
 *
 * RESPONSABILIDADES:
 * - Extraer datos del request
 * - Invocar caso de uso correspondiente
 * - Formatear respuesta HTTP
 * - Propagar errores al error handler
 */

import { HttpResponse } from './auth.controller.js';
import { PromoteToAdminUseCase } from '../../../application/use-cases/admin/promote-to-admin.use-case.js';
import { DemoteToUserUseCase } from '../../../application/use-cases/admin/demote-to-user.use-case.js';
import { GrantAdminPermissionUseCase } from '../../../application/use-cases/admin/grant-admin-permission.use-case.js';
import { RevokeAdminPermissionUseCase } from '../../../application/use-cases/admin/revoke-admin-permission.use-case.js';
import { GetAdminPermissionsUseCase } from '../../../application/use-cases/admin/get-admin-permissions.use-case.js';
import { ListAdminsUseCase } from '../../../application/use-cases/admin/list-admins.use-case.js';
import { ListUsersUseCase } from '../../../application/use-cases/user/list-users.use-case.js';
import { GetUserStatsUseCase } from '../../../application/use-cases/user/get-user-stats.use-case.js';
import { DeleteUserUseCase, DeleteUserResponseDto } from '../../../application/use-cases/user/delete-user.use-case.js';
import { HardDeleteUserUseCase } from '../../../application/use-cases/user/hard-delete-user.use-case.js';
import { UpdateUserStatusUseCase, UpdateUserStatusResponseDto } from '../../../application/use-cases/user/update-user-status.use-case.js';
import type { ListUsersResponseDto } from '../../../application/dtos/user/list-users.dto.js';
import type { GetUserStatsResponseDto } from '../../../application/dtos/user/user-stats.dto.js';
import {
  PromoteToAdminRequestDto,
  DemoteToUserRequestDto,
  GrantPermissionRequestDto,
  RevokePermissionRequestDto,
  AdminRoleResponseDto,
  AdminPermissionsResponseDto,
  AdminListResponseDto,
} from '../../../application/dtos/admin/admin.dto.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

/**
 * Dependencias del AdminController.
 */
export interface AdminControllerDependencies {
  readonly promoteToAdminUseCase: PromoteToAdminUseCase;
  readonly demoteToUserUseCase: DemoteToUserUseCase;
  readonly grantAdminPermissionUseCase: GrantAdminPermissionUseCase;
  readonly revokeAdminPermissionUseCase: RevokeAdminPermissionUseCase;
  readonly getAdminPermissionsUseCase: GetAdminPermissionsUseCase;
  readonly listAdminsUseCase: ListAdminsUseCase;
  readonly listUsersUseCase: ListUsersUseCase;
  readonly getUserStatsUseCase: GetUserStatsUseCase;
  readonly deleteUserUseCase: DeleteUserUseCase;
  readonly hardDeleteUserUseCase: HardDeleteUserUseCase;
  readonly updateUserStatusUseCase: UpdateUserStatusUseCase;
}

/**
 * Controlador de administración.
 * Independiente del framework HTTP.
 */
export class AdminController {
  /**
   * Casos de uso inyectados.
   * @private
   */
  private readonly deps: AdminControllerDependencies;

  /**
   * Constructor con inyección de dependencias.
   *
   * @param deps - Casos de uso requeridos
   */
  constructor(deps: AdminControllerDependencies) {
    this.deps = deps;
  }

  /**
   * Maneja POST /admin/promote
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con resultado
   */
  public async promote(
    request: AuthenticatedRequest<PromoteToAdminRequestDto>
  ): Promise<HttpResponse<AdminRoleResponseDto>> {
    const executorId = request.user!.userId;
    const dto = request.body;

    const result = await this.deps.promoteToAdminUseCase.execute(dto, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja POST /admin/demote
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con resultado
   */
  public async demote(
    request: AuthenticatedRequest<DemoteToUserRequestDto>
  ): Promise<HttpResponse<AdminRoleResponseDto>> {
    const executorId = request.user!.userId;
    const dto = request.body;

    const result = await this.deps.demoteToUserUseCase.execute(dto, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja POST /admin/permissions/grant
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con resultado
   */
  public async grantPermission(
    request: AuthenticatedRequest<GrantPermissionRequestDto>
  ): Promise<HttpResponse<AdminPermissionsResponseDto>> {
    const executorId = request.user!.userId;
    const dto = request.body;

    const result = await this.deps.grantAdminPermissionUseCase.execute(dto, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja POST /admin/permissions/revoke
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con resultado
   */
  public async revokePermission(
    request: AuthenticatedRequest<RevokePermissionRequestDto>
  ): Promise<HttpResponse<AdminPermissionsResponseDto>> {
    const executorId = request.user!.userId;
    const dto = request.body;

    const result = await this.deps.revokeAdminPermissionUseCase.execute(dto, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja GET /admin/my-permissions
   * Self-read: any authenticated admin can fetch their own permissions.
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con los permisos del usuario actual
   */
  public async getMyPermissions(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<AdminPermissionsResponseDto>> {
    const userId = request.user!.userId;

    const result = await this.deps.getAdminPermissionsUseCase.execute(userId, userId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja GET /admin/:userId/permissions
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con permisos del admin
   */
  public async getPermissions(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<AdminPermissionsResponseDto>> {
    const executorId = request.user!.userId;
    const targetUserId = request.params.userId || '';

    const result = await this.deps.getAdminPermissionsUseCase.execute(
      targetUserId,
      executorId
    );

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja GET /admin/list
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con lista de administradores
   */
  public async list(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<AdminListResponseDto>> {
    const executorId = request.user!.userId;

    const result = await this.deps.listAdminsUseCase.execute(executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja GET /users
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con lista paginada de usuarios
   */
  public async listUsers(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<ListUsersResponseDto>> {
    const executorId = request.user!.userId;
    const page = request.query.page ? parseInt(request.query.page, 10) : 1;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;
    const search = request.query.search || undefined;
    const role = request.query.role || undefined;

    const result = await this.deps.listUsersUseCase.execute({
      executorId,
      page,
      limit,
      search,
      role,
    });

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja GET /users/stats
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con estadísticas agregadas de usuarios
   */
  public async getUserStats(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<GetUserStatsResponseDto>> {
    const executorId = request.user!.userId;

    const result = await this.deps.getUserStatsUseCase.execute({ executorId });

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja DELETE /users/:userId
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con usuario desactivado
   */
  public async deleteUser(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<DeleteUserResponseDto>> {
    const executorId = request.user!.userId;
    const targetUserId = request.params.userId || '';

    const result = await this.deps.deleteUserUseCase.execute(targetUserId, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja DELETE /users/:userId/permanent
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con usuario eliminado permanentemente
   */
  public async hardDeleteUser(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<{ id: string; email: string }>> {
    const executorId = request.user!.userId;
    const targetUserId = request.params.userId || '';

    const result = await this.deps.hardDeleteUserUseCase.execute(targetUserId, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja PATCH /users/:userId/status
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con usuario actualizado
   */
  public async updateUserStatus(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<UpdateUserStatusResponseDto>> {
    const executorId = request.user!.userId;
    const targetUserId = request.params.userId || '';
    const { status } = request.body as { status: string };

    const result = await this.deps.updateUserStatusUseCase.execute(
      { targetUserId, newStatus: status as 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' },
      executorId
    );

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }
}
