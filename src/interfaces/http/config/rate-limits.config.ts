/**
 * ============================================
 * CONFIG: Rate Limits
 * ============================================
 *
 * Configuración de límites de rate para diferentes endpoints.
 *
 * LÍMITES DEFINIDOS:
 * - global: Límite general para todas las requests (100 req/15min)
 * - auth: Límite estricto para endpoints de autenticación (5 req/min)
 * - passwordReset: Límite para solicitudes de reset (3 req/hora)
 */

import { RateLimitOptions } from '../../../application/ports/rate-limiter.port.js';

/**
 * Tipos de rate limit disponibles.
 */
export type RateLimitType = 'global' | 'auth' | 'passwordReset';

/**
 * Configuración de rate limits por tipo de endpoint.
 */
export const RATE_LIMITS: Record<RateLimitType, RateLimitOptions> = {
  /**
   * Límite global por IP.
   * Protege contra ataques de flooding general.
   */
  global: {
    keyPrefix: 'rl:global',
    limit: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX ?? '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS ?? '900000', 10), // 15 minutes
  },

  /**
   * Límite para endpoints de autenticación.
   * Más estricto para prevenir brute force.
   */
  auth: {
    keyPrefix: 'rl:auth',
    limit: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? '5', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? '60000', 10), // 1 minute
  },

  /**
   * Límite para password reset.
   * Muy estricto para prevenir abuso de emails.
   */
  passwordReset: {
    keyPrefix: 'rl:pwd-reset',
    limit: parseInt(process.env.RATE_LIMIT_PWD_RESET_MAX ?? '3', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_PWD_RESET_WINDOW_MS ?? '3600000', 10), // 1 hour
  },
} as const;

/**
 * Headers de rate limit que se incluyen en las respuestas.
 */
export const RATE_LIMIT_HEADERS = {
  limit: 'X-RateLimit-Limit',
  remaining: 'X-RateLimit-Remaining',
  reset: 'X-RateLimit-Reset',
  retryAfter: 'Retry-After',
} as const;
