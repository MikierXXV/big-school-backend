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
   * Los errores se propagan al error handler middleware.
   */
  public async register(
    request: HttpRequest<RegisterUserRequestDto>
  ): Promise<HttpResponse<RegisterUserResponseDto>> {
    // Extract DTO from body
    const dto = request.body;

    // Execute use case (errors propagate to error handler)
    const result = await this.deps.registerUserUseCase.execute(dto);

    // Return successful response
    return {
      statusCode: 201,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja POST /auth/login
   *
   * @param request - Request HTTP con credenciales
   * @returns Response HTTP con tokens
   *
   * Los errores se propagan al error handler middleware.
   */
  public async login(
    request: HttpRequest<LoginUserRequestDto>
  ): Promise<HttpResponse<LoginUserResponseDto>> {
    // Build DTO with deviceInfo from userAgent (only if present)
    const dto: LoginUserRequestDto = {
      ...request.body,
      ...(request.userAgent ? { deviceInfo: request.userAgent } : {}),
    };

    // Execute use case (errors propagate to error handler)
    const result = await this.deps.loginUserUseCase.execute(dto);

    // Return successful response
    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja POST /auth/refresh
   *
   * @param request - Request HTTP con refresh token
   * @returns Response HTTP con nuevos tokens
   *
   * Los errores se propagan al error handler middleware.
   */
  public async refresh(
    request: HttpRequest<RefreshSessionRequestDto>
  ): Promise<HttpResponse<RefreshSessionResponseDto>> {
    // Extract DTO from body
    const dto = request.body;

    // Execute use case (errors propagate to error handler)
    const result = await this.deps.refreshSessionUseCase.execute(dto);

    // Return successful response
    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja POST /auth/logout
   *
   * Actualmente es un stub que retorna éxito.
   * TODO: Implementar cuando se cree el LogoutUseCase.
   */
  public async logout(
    _request: HttpRequest<{ refreshToken: string }>
  ): Promise<HttpResponse<{ message: string }>> {
    // TODO: Implement when LogoutUseCase is created
    // For now, return success (stub)
    return {
      statusCode: 200,
      body: {
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      },
    };
  }
}
