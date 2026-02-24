/**
 * ============================================
 * MIDDLEWARE: Error Handler
 * ============================================
 *
 * Middleware para manejo centralizado de errores.
 * Convierte errores de dominio/aplicación a respuestas HTTP.
 *
 * RESPONSABILIDADES:
 * - Capturar errores no manejados
 * - Mapear errores a códigos HTTP
 * - Formatear respuestas de error
 * - Loggear errores
 * - Ocultar detalles sensibles en producción
 */

import { HttpResponse } from '../controllers/auth.controller.js';
import { isDomainError, DomainError } from '../../../domain/errors/domain.error.js';
import { isApplicationError, ApplicationError } from '../../../application/errors/application.error.js';
import { ILogger } from '../../../application/ports/logger.port.js';

/**
 * Mapeo de códigos de error de dominio a HTTP status codes.
 */
const DOMAIN_ERROR_HTTP_CODES: Record<string, number> = {
  // User errors
  DOMAIN_USER_NOT_FOUND: 404,
  DOMAIN_USER_ALREADY_EXISTS: 409,
  DOMAIN_INVALID_EMAIL: 400,
  DOMAIN_INVALID_USER_ID: 400,
  DOMAIN_USER_NOT_ACTIVE: 403,
  DOMAIN_EMAIL_NOT_VERIFIED: 403,
  DOMAIN_USER_SUSPENDED: 403,
  DOMAIN_INVALID_PASSWORD_HASH: 500,

  // Auth errors
  DOMAIN_INVALID_CREDENTIALS: 401,
  DOMAIN_ACCESS_TOKEN_EXPIRED: 401,
  DOMAIN_INVALID_ACCESS_TOKEN: 401,
  DOMAIN_REFRESH_TOKEN_EXPIRED: 401,
  DOMAIN_INVALID_REFRESH_TOKEN: 401,
  DOMAIN_REFRESH_TOKEN_REVOKED: 401,
  DOMAIN_REFRESH_TOKEN_REUSE_DETECTED: 401,
  DOMAIN_SESSION_NOT_FOUND: 404,
  DOMAIN_UNAUTHENTICATED: 401,
  DOMAIN_UNAUTHORIZED: 403,
  DOMAIN_WEAK_PASSWORD: 400,

  // Rate limiting & lockout errors
  DOMAIN_ACCOUNT_LOCKED: 423,
  DOMAIN_TOO_MANY_REQUESTS: 429,

  // Authorization errors
  DOMAIN_INVALID_SYSTEM_ROLE: 400,
  DOMAIN_INVALID_ADMIN_PERMISSION: 400,
  DOMAIN_INVALID_ORGANIZATION_ROLE: 400,
  DOMAIN_INSUFFICIENT_PERMISSIONS: 403,
  DOMAIN_CANNOT_MODIFY_SUPER_ADMIN: 403,

  // Organization errors
  DOMAIN_INVALID_ORGANIZATION_ID: 400,
  DOMAIN_INVALID_ORGANIZATION_TYPE: 400,
  DOMAIN_ORGANIZATION_NOT_FOUND: 404,
  DOMAIN_ORGANIZATION_ALREADY_EXISTS: 409,

  // Membership errors
  DOMAIN_INVALID_MEMBERSHIP_ID: 400,
  DOMAIN_MEMBERSHIP_NOT_FOUND: 404,
  DOMAIN_MEMBERSHIP_ALREADY_EXISTS: 409,
  DOMAIN_CANNOT_REMOVE_LAST_ORG_ADMIN: 409,
};

/**
 * Middleware de manejo de errores.
 */
export class ErrorHandlerMiddleware {
  /**
   * Logger para registrar errores.
   * @private
   */
  private readonly logger: ILogger;

  /**
   * ¿Estamos en producción?
   * @private
   */
  private readonly isProduction: boolean;

  /**
   * Constructor.
   *
   * @param logger - Logger para registrar errores
   * @param isProduction - true si estamos en producción
   */
  constructor(logger: ILogger, isProduction: boolean = false) {
    this.logger = logger;
    this.isProduction = isProduction;
  }

  /**
   * Maneja un error y lo convierte a HttpResponse.
   *
   * @param error - Error capturado
   * @param correlationId - ID de correlación del request
   * @returns HttpResponse formateada
   */
  public handle(error: unknown, correlationId?: string): HttpResponse {
    // 1. Loggear el error
    this.logError(error, correlationId);

    // 2. Convertir a respuesta HTTP
    if (isDomainError(error)) {
      return this.handleDomainError(error);
    }

    if (isApplicationError(error)) {
      return this.handleApplicationError(error);
    }

    // Error genérico / desconocido
    return this.handleUnknownError(error);
  }

  /**
   * Maneja errores de dominio.
   *
   * @param error - Error de dominio
   * @returns HttpResponse
   *
   * @private
   */
  private handleDomainError(error: DomainError): HttpResponse {
    const statusCode = DOMAIN_ERROR_HTTP_CODES[error.code] ?? 400;

    // Extraer retryAfter de errores de lockout/rate limit
    const retryAfterSeconds = this.extractRetryAfter(error);

    return {
      statusCode,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          // Incluir retryAfter para errores de lockout/rate limit
          ...(retryAfterSeconds !== undefined && { retryAfter: retryAfterSeconds }),
          // Solo incluir detalles en desarrollo
          ...((!this.isProduction && error.context) && {
            details: error.context,
          }),
        },
      },
      // Incluir Retry-After header para errores 423 y 429
      ...(retryAfterSeconds !== undefined && {
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      }),
    };
  }

  /**
   * Extrae el valor de retryAfter de errores de lockout/rate limit.
   *
   * @param error - Error de dominio
   * @returns Segundos hasta poder reintentar, o undefined
   *
   * @private
   */
  private extractRetryAfter(error: DomainError): number | undefined {
    if (error.code === 'DOMAIN_ACCOUNT_LOCKED') {
      const context = error.context as { remainingSeconds?: number } | undefined;
      return context?.remainingSeconds;
    }

    if (error.code === 'DOMAIN_TOO_MANY_REQUESTS') {
      const context = error.context as { retryAfterSeconds?: number } | undefined;
      return context?.retryAfterSeconds;
    }

    return undefined;
  }

  /**
   * Maneja errores de aplicación.
   *
   * @param error - Error de aplicación
   * @returns HttpResponse
   *
   * @private
   */
  private handleApplicationError(error: ApplicationError): HttpResponse {
    return {
      statusCode: error.httpStatusCode,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...((!this.isProduction && error.context) && {
            details: error.context,
          }),
        },
      },
    };
  }

  /**
   * Maneja errores desconocidos.
   *
   * @param error - Error desconocido
   * @returns HttpResponse
   *
   * @private
   */
  private handleUnknownError(error: unknown): HttpResponse {
    // En producción, no exponer detalles del error
    const message = this.isProduction
      ? 'An unexpected error occurred'
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    return {
      statusCode: 500,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message,
          ...((!this.isProduction && error instanceof Error) && {
            details: {
              name: error.name,
              stack: error.stack,
            },
          }),
        },
      },
    };
  }

  /**
   * Loggea el error.
   *
   * @param error - Error a loggear
   * @param correlationId - ID de correlación
   *
   * @private
   */
  private logError(error: unknown, correlationId?: string): void {
    const context = correlationId ? { correlationId } : undefined;

    if (error instanceof Error) {
      // Nivel de log según tipo de error
      if (isDomainError(error) || isApplicationError(error)) {
        // Errores esperados → warn
        this.logger.warn(`Handled error: ${error.message}`, context);
      } else {
        // Errores inesperados → error
        this.logger.error('Unhandled error', error, context);
      }
    } else {
      this.logger.error('Unknown error type', undefined, {
        ...context,
        errorValue: String(error),
      });
    }
  }
}
