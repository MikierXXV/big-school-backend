/**
 * ============================================
 * SERVICE: InMemoryRateLimiter
 * ============================================
 *
 * Implementación en memoria del IRateLimiter port.
 * Usa un Map para almacenar contadores con TTL.
 *
 * LIMITACIONES:
 * - No persiste entre reinicios del servidor
 * - No funciona en clusters (múltiples procesos)
 * - Para producción usar RedisRateLimiter
 *
 * ADECUADO PARA:
 * - Desarrollo local
 * - Tests
 * - Despliegues single-instance
 */

import { IRateLimiter, RateLimitResult } from '../../application/ports/rate-limiter.port.js';

/**
 * Entrada en el store del rate limiter.
 */
interface RateLimitEntry {
  /**
   * Cantidad de requests en la ventana actual.
   */
  count: number;

  /**
   * Timestamp de cuando expira la ventana.
   */
  expiresAt: number;
}

/**
 * Implementación in-memory del rate limiter.
 */
export class InMemoryRateLimiter implements IRateLimiter {
  /**
   * Store de contadores por key.
   */
  private readonly store: Map<string, RateLimitEntry>;

  /**
   * Constructor.
   */
  constructor() {
    this.store = new Map();
  }

  /**
   * Verifica si una key puede hacer un request.
   *
   * @param key - Identificador único (IP, userId, email)
   * @param limit - Máximo de requests permitidos
   * @param windowMs - Duración de la ventana en ms
   * @returns Resultado indicando si está permitido y stats
   */
  public async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    // Si no hay entrada o expiró, permitir
    if (!entry || entry.expiresAt <= now) {
      const resetAt = new Date(now + windowMs);
      return {
        allowed: true,
        remaining: limit - 1,
        retryAfterMs: 0,
        total: limit,
        resetAt,
      };
    }

    // Verificar si queda cuota
    const remaining = limit - entry.count;

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.expiresAt - now,
        total: limit,
        resetAt: new Date(entry.expiresAt),
      };
    }

    return {
      allowed: true,
      remaining: remaining - 1,
      retryAfterMs: 0,
      total: limit,
      resetAt: new Date(entry.expiresAt),
    };
  }

  /**
   * Incrementa el contador para una key.
   *
   * @param key - Identificador único
   * @param windowMs - Duración de la ventana en ms
   */
  public async increment(key: string, windowMs: number): Promise<void> {
    const now = Date.now();
    const entry = this.store.get(key);

    // Si no hay entrada o expiró, crear nueva
    if (!entry || entry.expiresAt <= now) {
      this.store.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return;
    }

    // Incrementar contador existente
    entry.count++;
  }

  /**
   * Resetea el contador para una key.
   *
   * @param key - Identificador único
   */
  public async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Limpia todas las entries expiradas.
   * Llamar periódicamente para liberar memoria.
   */
  public async cleanup(): Promise<void> {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Obtiene el número de entries activas.
   * Útil para testing y monitoreo.
   */
  public getActiveEntriesCount(): number {
    const now = Date.now();
    let count = 0;

    for (const entry of this.store.values()) {
      if (entry.expiresAt > now) {
        count++;
      }
    }

    return count;
  }

  /**
   * Limpia todo el store.
   * Útil para tests.
   */
  public clear(): void {
    this.store.clear();
  }
}
