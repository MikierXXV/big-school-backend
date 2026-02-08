/**
 * ============================================
 * PORT: IRateLimiter
 * ============================================
 *
 * Interface para servicios de rate limiting.
 * Permite limitar la cantidad de requests por key (IP, userId, email).
 *
 * RESPONSABILIDADES:
 * - Verificar si una key puede hacer un request
 * - Incrementar el contador de requests
 * - Resetear contadores
 * - Proporcionar información sobre límites restantes
 *
 * IMPLEMENTACIONES:
 * - InMemoryRateLimiter: Para desarrollo y tests
 * - RedisRateLimiter: Para producción (futuro)
 */

/**
 * Resultado de verificar el rate limit.
 */
export interface RateLimitResult {
  /**
   * Si el request está permitido.
   */
  readonly allowed: boolean;

  /**
   * Requests restantes en la ventana actual.
   */
  readonly remaining: number;

  /**
   * Milisegundos hasta poder reintentar si no está permitido.
   */
  readonly retryAfterMs: number;

  /**
   * Límite total de requests en la ventana.
   */
  readonly total: number;

  /**
   * Timestamp de cuándo se resetea la ventana.
   */
  readonly resetAt: Date;
}

/**
 * Opciones para configurar un rate limiter.
 */
export interface RateLimitOptions {
  /**
   * Prefijo para la key (ej: 'rl:global', 'rl:auth').
   */
  readonly keyPrefix: string;

  /**
   * Máximo de requests permitidos en la ventana.
   */
  readonly limit: number;

  /**
   * Duración de la ventana en milisegundos.
   */
  readonly windowMs: number;
}

/**
 * Interface para servicios de rate limiting.
 */
export interface IRateLimiter {
  /**
   * Verifica si una key puede hacer un request.
   *
   * @param key - Identificador único (IP, userId, email)
   * @param limit - Máximo de requests permitidos
   * @param windowMs - Duración de la ventana en ms
   * @returns Resultado indicando si está permitido y stats
   */
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;

  /**
   * Incrementa el contador para una key.
   * Debe llamarse después de check() si el request procede.
   *
   * @param key - Identificador único
   * @param windowMs - Duración de la ventana en ms
   */
  increment(key: string, windowMs: number): Promise<void>;

  /**
   * Resetea el contador para una key.
   * Útil para limpiar después de acciones exitosas.
   *
   * @param key - Identificador único
   */
  reset(key: string): Promise<void>;

  /**
   * Limpia todas las entries expiradas.
   * Llamar periódicamente para liberar memoria.
   */
  cleanup(): Promise<void>;
}
