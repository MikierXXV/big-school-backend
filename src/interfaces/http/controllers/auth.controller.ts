/**
 * ============================================
 * CONTROLLER: AuthController
 * ============================================
 *
 * Controlador para endpoints de autenticación.
 * Maneja registro, login y refresh de sesión.
 *
 * ENDPOINTS:
 * - POST /auth/register - Registro de usuario
 * - POST /auth/login - Login
 * - POST /auth/refresh - Refresh token
 * - POST /auth/logout - Logout (futuro)
 *
 * RESPONSABILIDADES:
 * - Extraer datos del request
 * - Validar formato (no reglas de negocio)
 * - Invocar caso de uso correspondiente
 * - Formatear respuesta HTTP
 * - Manejar errores
 */

import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user.use-case.js';
import { LoginUserUseCase } from '../../../application/use-cases/auth/login-user.use-case.js';
import { RefreshSessionUseCase } from '../../../application/use-cases/auth/refresh-session.use-case.js';
import {
  RegisterUserRequestDto,
  RegisterUserResponseDto,
} from '../../../application/dtos/auth/register.dto.js';
import {
  LoginUserRequestDto,
  LoginUserResponseDto,
} from '../../../application/dtos/auth/login.dto.js';
import {
  RefreshSessionRequestDto,
  RefreshSessionResponseDto,
} from '../../../application/dtos/auth/refresh-session.dto.js';

/**
 * Request HTTP genérico (independiente del framework).
 * Cada framework lo adapta a su formato.
 */
export interface HttpRequest<TBody = unknown> {
  body: TBody;
  headers: Record<string, string | undefined>;
  params: Record<string, string>;
  query: Record<string, string>;
  ip?: string;
  userAgent?: string;
}

/**
 * Response HTTP genérico.
 */
export interface HttpResponse<TData = unknown> {
  statusCode: number;
  body: {
    success: boolean;
    data?: TData;
    error?: {
      code: string;
      message: string;
      details?: unknown;
    };
  };
  headers?: Record<string, string>;
}

/**
 * Dependencias del AuthController.
 */
export interface AuthControllerDependencies {
  readonly registerUserUseCase: RegisterUserUseCase;
  readonly loginUserUseCase: LoginUserUseCase;
  readonly refreshSessionUseCase: RefreshSessionUseCase;
}

/**
 * Controlador de autenticación.
 * Independiente del framework HTTP.
 */
export class AuthController {
  /**
   * Casos de uso inyectados.
   * @private
   */
  private readonly deps: AuthControllerDependencies;

  /**
   * Constructor con inyección de dependencias.
   *
   * @param deps - Casos de uso requeridos
   */
  constructor(deps: AuthControllerDependencies) {
    this.deps = deps;
  }

  /**
   * Maneja POST /auth/register
   *
   * @param request - Request HTTP con datos de registro
   * @returns Response HTTP con resultado
   *
   * TODO: Implementar manejo del request
   */
  public async register(
    request: HttpRequest<RegisterUserRequestDto>
  ): Promise<HttpResponse<RegisterUserResponseDto>> {
    // TODO: Implementar
    // try {
    //   // 1. Extraer DTO del body
    //   const dto = request.body;
    //
    //   // 2. Ejecutar caso de uso
    //   const result = await this.deps.registerUserUseCase.execute(dto);
    //
    //   // 3. Retornar respuesta exitosa
    //   return {
    //     statusCode: 201,
    //     body: {
    //       success: true,
    //       data: result,
    //     },
    //   };
    // } catch (error) {
    //   return this.handleError(error);
    // }

    // Placeholder
    throw new Error('AuthController.register not implemented');
  }

  /**
   * Maneja POST /auth/login
   *
   * @param request - Request HTTP con credenciales
   * @returns Response HTTP con tokens
   *
   * TODO: Implementar manejo del request
   */
  public async login(
    request: HttpRequest<LoginUserRequestDto>
  ): Promise<HttpResponse<LoginUserResponseDto>> {
    // TODO: Implementar
    // try {
    //   const dto: LoginUserRequestDto = {
    //     ...request.body,
    //     deviceInfo: request.userAgent,
    //   };
    //
    //   const result = await this.deps.loginUserUseCase.execute(dto);
    //
    //   return {
    //     statusCode: 200,
    //     body: {
    //       success: true,
    //       data: result,
    //     },
    //   };
    // } catch (error) {
    //   return this.handleError(error);
    // }

    // Placeholder
    throw new Error('AuthController.login not implemented');
  }

  /**
   * Maneja POST /auth/refresh
   *
   * @param request - Request HTTP con refresh token
   * @returns Response HTTP con nuevos tokens
   *
   * TODO: Implementar manejo del request
   */
  public async refresh(
    request: HttpRequest<RefreshSessionRequestDto>
  ): Promise<HttpResponse<RefreshSessionResponseDto>> {
    // TODO: Implementar
    // try {
    //   const dto = request.body;
    //   const result = await this.deps.refreshSessionUseCase.execute(dto);
    //
    //   return {
    //     statusCode: 200,
    //     body: {
    //       success: true,
    //       data: result,
    //     },
    //   };
    // } catch (error) {
    //   return this.handleError(error);
    // }

    // Placeholder
    throw new Error('AuthController.refresh not implemented');
  }

  /**
   * Maneja POST /auth/logout
   *
   * TODO: Implementar cuando se cree el caso de uso
   */
  public async logout(
    _request: HttpRequest<{ refreshToken: string }>
  ): Promise<HttpResponse<{ message: string }>> {
    // TODO: Implementar

    // Placeholder
    throw new Error('AuthController.logout not implemented');
  }

  /**
   * Convierte errores a respuestas HTTP.
   *
   * @param error - Error capturado
   * @returns HttpResponse con error formateado
   *
   * @private
   */
  private handleError(error: unknown): HttpResponse {
    // TODO: Implementar mapeo de errores a HTTP status codes
    // - DomainError → 400-422 dependiendo del tipo
    // - ApplicationError → según httpStatusCode del error
    // - Error genérico → 500

    // Placeholder
    return {
      statusCode: 500,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    };
  }
}
