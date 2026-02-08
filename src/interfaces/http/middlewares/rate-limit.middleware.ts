/**
 * ============================================
 * MIDDLEWARE: Rate Limit
 * ============================================
 *
 * Middleware para limitar la cantidad de requests por IP.
 * Usa el IRateLimiter port para tracking de requests.
 *
 * RESPONSABILIDADES:
 * - Verificar si la IP puede hacer un request
 * - Agregar headers de rate limit a la respuesta
 * - Retornar 429 si se excede el límite
 */

import { HttpRequest, HttpResponse } from '../controllers/auth.controller.js';
import { IRateLimiter, RateLimitOptions } from '../../../application/ports/rate-limiter.port.js';
import { RATE_LIMIT_HEADERS } from '../config/rate-limits.config.js';

/**
 * Resultado del middleware de rate limit.
 */
export interface RateLimitMiddlewareResult {
  /**
   * Si el request puede continuar.
   */
  readonly allowed: boolean;

  /**
   * Headers a agregar a la respuesta.
   */
  readonly headers: Record<string, string>;

  /**
   * Respuesta de error si no está permitido.
   */
  readonly errorResponse?: HttpResponse;
}

/**
 * Middleware de rate limiting.
 */
export class RateLimitMiddleware {
  /**
   * Rate limiter para tracking de requests.
   */
  private readonly rateLimiter: IRateLimiter;

  /**
   * Opciones de rate limit.
   */
  private readonly options: RateLimitOptions;

  /**
   * Constructor.
   *
   * @param rateLimiter - Servicio de rate limiting
   * @param options - Opciones de configuración
   */
  constructor(rateLimiter: IRateLimiter, options: RateLimitOptions) {
    this.rateLimiter = rateLimiter;
    this.options = options;
  }

  /**
   * Procesa el request y verifica rate limit.
   *
   * @param request - Request HTTP
   * @returns Resultado indicando si puede continuar
   */
  public async process(request: HttpRequest): Promise<RateLimitMiddlewareResult> {
    const ip = this.extractClientIp(request);
    const key = `${this.options.keyPrefix}:${ip}`;

    // Verificar límite
    const result = await this.rateLimiter.check(
      key,
      this.options.limit,
      this.options.windowMs
    );

    // Preparar headers
    const headers: Record<string, string> = {
      [RATE_LIMIT_HEADERS.limit]: String(result.total),
      [RATE_LIMIT_HEADERS.remaining]: String(Math.max(0, result.remaining)),
      [RATE_LIMIT_HEADERS.reset]: String(Math.ceil(result.resetAt.getTime() / 1000)),
    };

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
      headers[RATE_LIMIT_HEADERS.retryAfter] = String(retryAfterSeconds);

      return {
        allowed: false,
        headers,
        errorResponse: {
          statusCode: 429,
          body: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
              retryAfter: retryAfterSeconds,
            },
          },
        },
      };
    }

    // Incrementar contador
    await this.rateLimiter.increment(key, this.options.windowMs);

    return {
      allowed: true,
      headers,
    };
  }

  /**
   * Extrae la IP del cliente.
   * Considera proxies (X-Forwarded-For).
   *
   * @param request - Request HTTP
   * @returns IP del cliente
   */
  private extractClientIp(request: HttpRequest): string {
    // Verificar headers de proxy
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For puede tener múltiples IPs: "client, proxy1, proxy2"
      const firstIp = forwardedFor.split(',')[0];
      return firstIp?.trim() ?? 'unknown';
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    return request.ip ?? 'unknown';
  }
}

/**
 * Factory para crear middleware de rate limit con opciones específicas.
 *
 * @param rateLimiter - Servicio de rate limiting
 * @param options - Opciones de configuración
 * @returns Instancia del middleware
 */
export function createRateLimitMiddleware(
  rateLimiter: IRateLimiter,
  options: RateLimitOptions
): RateLimitMiddleware {
  return new RateLimitMiddleware(rateLimiter, options);
}
