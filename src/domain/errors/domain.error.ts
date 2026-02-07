/**
 * ============================================
 * BASE: DomainError
 * ============================================
 *
 * Clase base para todos los errores de dominio.
 * Proporciona estructura común y diferenciación de errores técnicos.
 *
 * USO:
 * Todos los errores de dominio deben extender esta clase.
 * Esto permite:
 * - Identificar errores de negocio vs técnicos
 * - Manejo uniforme en la capa de interfaces
 * - Logging estructurado
 */

/**
 * Clase base abstracta para errores de dominio.
 * Todos los errores específicos del dominio heredan de esta.
 */
export abstract class DomainError extends Error {
  /**
   * Código único del error para identificación programática.
   * Formato: DOMAIN_<CONTEXT>_<ERROR>
   * Ejemplo: DOMAIN_USER_NOT_FOUND
   */
  public abstract readonly code: string;

  /**
   * Indica si este error es un error de dominio.
   * Útil para type guards.
   */
  public readonly isDomainError = true;

  /**
   * Timestamp de cuando ocurrió el error.
   */
  public readonly timestamp: Date;

  /**
   * Contexto adicional del error (para logging).
   * NO exponer a usuarios finales.
   */
  public readonly context?: Record<string, unknown> | undefined;

  /**
   * Constructor del error de dominio.
   *
   * @param message - Mensaje descriptivo del error
   * @param context - Contexto adicional (opcional)
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;

    // Mantener el stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializa el error para logging.
   * @returns Objeto con información del error
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

/**
 * Type guard para verificar si un error es de dominio.
 * @param error - Error a verificar
 * @returns true si es un DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
  return (
    error instanceof Error &&
    'isDomainError' in error &&
    (error as DomainError).isDomainError === true
  );
}
