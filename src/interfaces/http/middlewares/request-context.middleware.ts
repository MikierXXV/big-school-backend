/**
 * ============================================
 * MIDDLEWARE: Request Context
 * ============================================
 *
 * Middleware para establecer contexto del request.
 * Genera correlation ID y extrae información útil.
 *
 * RESPONSABILIDADES:
 * - Generar/extraer correlation ID
 * - Extraer IP del cliente
 * - Extraer User-Agent
 * - Registrar inicio de request
 */

import { HttpRequest } from '../controllers/auth.controller.js';
import { IUuidGenerator } from '../../../application/ports/uuid-generator.port.js';
import { ILogger } from '../../../application/ports/logger.port.js';

/**
 * Request con contexto enriquecido.
 */
export interface ContextualRequest<TBody = unknown> extends HttpRequest<TBody> {
  /** ID de correlación para tracing */
  correlationId: string;
  /** Timestamp de inicio del request */
  startTime: number;
}

/**
 * Middleware de contexto de request.
 */
export class RequestContextMiddleware {
  /**
   * Generador de UUIDs.
   * @private
   */
  private readonly uuidGenerator: IUuidGenerator;

  /**
   * Logger.
   * @private
   */
  private readonly logger: ILogger;

  /**
   * Header para correlation ID (si viene del cliente/gateway).
   */
  public static readonly CORRELATION_ID_HEADER = 'x-correlation-id';

  /**
   * Constructor.
   *
   * @param uuidGenerator - Generador de UUIDs
   * @param logger - Logger
   */
  constructor(uuidGenerator: IUuidGenerator, logger: ILogger) {
    this.uuidGenerator = uuidGenerator;
    this.logger = logger;
  }

  /**
   * Enriquece el request con contexto.
   *
   * @param request - Request original
   * @returns Request con contexto
   */
  public enrich<TBody>(request: HttpRequest<TBody>): ContextualRequest<TBody> {
    // Obtener o generar correlation ID
    const existingId = request.headers[RequestContextMiddleware.CORRELATION_ID_HEADER];
    const correlationId = existingId ?? this.uuidGenerator.generate();

    // Extraer información adicional
    const ip = this.extractClientIp(request);
    const userAgent = request.headers['user-agent'];

    // Log inicio de request
    this.logger.info('Request started', {
      correlationId,
      method: 'HTTP', // Se puede enriquecer con método real
      ip,
      userAgent,
    });

    return {
      ...request,
      correlationId,
      startTime: Date.now(),
      ip,
      ...(userAgent !== undefined && { userAgent }),
    };
  }

  /**
   * Log de finalización de request.
   *
   * @param request - Request contextual
   * @param statusCode - Código de respuesta
   */
  public logCompletion(request: ContextualRequest, statusCode: number): void {
    const duration = Date.now() - request.startTime;

    this.logger.info('Request completed', {
      correlationId: request.correlationId,
      statusCode,
      durationMs: duration,
    });
  }

  /**
   * Extrae la IP del cliente.
   * Considera proxies (X-Forwarded-For).
   *
   * @param request - Request HTTP
   * @returns IP del cliente
   *
   * @private
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
