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
import {
  PromoteToAdminRequestDto,
  DemoteToUserRequestDto,
  GrantPermissionRequestDto,
  RevokePermissionRequestDto,
  AdminRoleResponseDto,
  AdminPermissionsResponseDto,
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
}
