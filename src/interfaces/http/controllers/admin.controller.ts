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
import { DeleteUserUseCase, DeleteUserResponseDto } from '../../../application/use-cases/user/delete-user.use-case.js';
import type { ListUsersResponseDto } from '../../../application/dtos/user/list-users.dto.js';
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
  readonly deleteUserUseCase: DeleteUserUseCase;
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

    const result = await this.deps.listUsersUseCase.execute({
      executorId,
      page,
      limit,
      search,
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
}
