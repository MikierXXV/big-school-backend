/**
 * ============================================
 * MIDDLEWARE: Authorization
 * ============================================
 *
 * Middleware para autorización basada en roles y permisos.
 * Valida que el usuario autenticado tenga los permisos necesarios.
 *
 * FLUJO:
 * 1. Verificar que el usuario esté autenticado
 * 2. Verificar rol de sistema (SUPER_ADMIN, ADMIN)
 * 3. Verificar permisos específicos
 * 4. Verificar permisos organizacionales
 * 5. Continuar o rechazar
 *
 * OPCIONES:
 * - requireSuperAdmin: Solo SUPER_ADMIN
 * - requireAdmin: ADMIN o SUPER_ADMIN
 * - permission: Permiso específico requerido
 * - organizationIdParam: Nombre del parámetro con el ID de organización
 */

import { HttpRequest } from '../controllers/auth.controller.js';
import { IAuthorizationService } from '../../../application/ports/authorization.service.port.js';
import { UnauthorizedError, UnauthenticatedError } from '../../../domain/errors/authorization.errors.js';
import { AuthenticatedRequest } from './auth.middleware.js';

/**
 * Opciones del middleware de autorización.
 */
export interface AuthorizationMiddlewareOptions {
  /** Permiso específico requerido */
  permission?: string;
  /** Nombre del parámetro de ruta con el ID de organización */
  organizationIdParam?: string;
  /** Requiere rol SUPER_ADMIN */
  requireSuperAdmin?: boolean;
  /** Requiere rol ADMIN o SUPER_ADMIN */
  requireAdmin?: boolean;
}

/**
 * Middleware de autorización.
 * Independiente del framework.
 */
export class AuthorizationMiddleware {
  /**
   * Servicio de autorización.
   * @private
   */
  private readonly authorizationService: IAuthorizationService;

  /**
   * Constructor con inyección del servicio de autorización.
   *
   * @param authorizationService - Servicio para validar permisos
   */
  constructor(authorizationService: IAuthorizationService) {
    this.authorizationService = authorizationService;
  }

  /**
   * Crea una función de validación de permisos.
   * Esta función puede ser usada como middleware.
   *
   * @param options - Opciones de autorización
   * @returns Función de validación
   */
  public checkPermission(
    options: AuthorizationMiddlewareOptions
  ): (request: HttpRequest) => Promise<void> {
    return async (request: HttpRequest): Promise<void> => {
      // 1. Verify user is authenticated
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new UnauthenticatedError();
      }

      const userId = authRequest.user.userId;

      // 2. Check SUPER_ADMIN requirement
      if (options.requireSuperAdmin) {
        const isSuperAdmin = await this.authorizationService.isSuperAdmin(userId);
        if (!isSuperAdmin) {
          throw new UnauthorizedError('SUPER_ADMIN role required');
        }
        return;
      }

      // 3. Check ADMIN requirement (SUPER_ADMIN also passes)
      if (options.requireAdmin) {
        const isSuperAdmin = await this.authorizationService.isSuperAdmin(userId);
        const isAdmin = await this.authorizationService.isAdmin(userId);
        if (!isSuperAdmin && !isAdmin) {
          throw new UnauthorizedError('ADMIN role required');
        }
        return;
      }

      // 4. Check specific permission
      if (options.permission) {
        const organizationId = options.organizationIdParam
          ? request.params?.[options.organizationIdParam]
          : undefined;

        const hasPermission = await this.authorizationService.hasPermission(
          userId,
          options.permission,
          organizationId
        );

        if (!hasPermission) {
          throw new UnauthorizedError(`Permission '${options.permission}' required`);
        }
      }
    };
  }
}
