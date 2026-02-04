/**
 * ============================================
 * MIDDLEWARE: Authentication
 * ============================================
 *
 * Middleware para autenticación de requests.
 * Valida el access token y extrae información del usuario.
 *
 * FLUJO:
 * 1. Extraer token del header Authorization
 * 2. Validar formato "Bearer <token>"
 * 3. Validar token con TokenService
 * 4. Agregar usuario al contexto del request
 * 5. Continuar o rechazar
 *
 * HEADERS:
 * Authorization: Bearer <access_token>
 */

import { HttpRequest, HttpResponse } from '../controllers/auth.controller.js';
import { ITokenService } from '../../../application/ports/token.service.port.js';

/**
 * Request con información de usuario autenticado.
 */
export interface AuthenticatedRequest<TBody = unknown> extends HttpRequest<TBody> {
  /** Usuario autenticado (presente si el token es válido) */
  user?: AuthenticatedUser;
}

/**
 * Información del usuario autenticado.
 */
export interface AuthenticatedUser {
  /** ID del usuario */
  userId: string;
  /** Email del usuario */
  email: string;
  /** Claims adicionales del token */
  claims?: Record<string, unknown>;
}

/**
 * Resultado del middleware de autenticación.
 */
export type AuthMiddlewareResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: HttpResponse };

/**
 * Middleware de autenticación.
 * Independiente del framework.
 */
export class AuthMiddleware {
  /**
   * Servicio de tokens.
   * @private
   */
  private readonly tokenService: ITokenService;

  /**
   * Constructor con inyección del servicio de tokens.
   *
   * @param tokenService - Servicio para validar tokens
   */
  constructor(tokenService: ITokenService) {
    this.tokenService = tokenService;
  }

  /**
   * Valida autenticación de un request.
   *
   * @param request - Request HTTP
   * @returns Resultado con usuario o respuesta de error
   */
  public async authenticate(
    request: HttpRequest
  ): Promise<AuthMiddlewareResult> {
    // 1. Extract Authorization header
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return {
        success: false,
        response: this.unauthorizedResponse('Missing authorization header'),
      };
    }

    // 2. Extract and validate Bearer token format
    const token = extractBearerToken(authHeader);
    if (!token) {
      return {
        success: false,
        response: this.unauthorizedResponse('Invalid authorization format'),
      };
    }

    // 3. Validate token with token service
    const validationResult = await this.tokenService.validateAccessToken(token);
    if (!validationResult.isValid) {
      const message = validationResult.error === 'expired'
        ? 'Token has expired'
        : 'Invalid token';
      return {
        success: false,
        response: this.unauthorizedResponse(message, validationResult.error),
      };
    }

    // 4. Return authenticated user
    return {
      success: true,
      user: {
        userId: validationResult.payload!.userId,
        email: validationResult.payload!.email,
      },
    };
  }

  /**
   * Crea respuesta de no autorizado (401).
   *
   * @param message - Mensaje de error
   * @param code - Código de error específico
   * @returns HttpResponse
   *
   * @private
   */
  private unauthorizedResponse(
    message: string,
    code: string = 'UNAUTHORIZED'
  ): HttpResponse {
    return {
      statusCode: 401,
      body: {
        success: false,
        error: {
          code: `AUTH_${code.toUpperCase()}`,
          message,
        },
      },
      headers: {
        'WWW-Authenticate': 'Bearer',
      },
    };
  }
}

/**
 * Función helper para extraer el token del header.
 *
 * @param authHeader - Valor del header Authorization
 * @returns Token o null si el formato es inválido
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1];
  // Return null for empty or whitespace-only tokens
  if (!token || token.trim() === '') {
    return null;
  }

  return token;
}
