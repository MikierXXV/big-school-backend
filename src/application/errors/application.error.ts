/**
 * ============================================
 * BASE: ApplicationError
 * ============================================
 *
 * Clase base para errores de la capa de aplicación.
 * Diferente de DomainError (reglas de negocio).
 *
 * EJEMPLOS DE ERRORES DE APLICACIÓN:
 * - Validación de DTOs fallida
 * - Operación no permitida
 * - Recurso no encontrado (desde perspectiva de app)
 */

/**
 * Clase base abstracta para errores de aplicación.
 */
export abstract class ApplicationError extends Error {
  /**
   * Código único del error.
   * Formato: APP_<CONTEXT>_<ERROR>
   */
  public abstract readonly code: string;

  /**
   * Código HTTP sugerido para la respuesta.
   */
  public abstract readonly httpStatusCode: number;

  /**
   * Indica si es un error de aplicación.
   */
  public readonly isApplicationError = true;

  /**
   * Timestamp del error.
   */
  public readonly timestamp: Date;

  /**
   * Contexto adicional.
   */
  public readonly context?: Record<string, unknown> | undefined;

  /**
   * Constructor del error de aplicación.
   *
   * @param message - Mensaje descriptivo
   * @param context - Contexto adicional
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializa el error.
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      httpStatusCode: this.httpStatusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

/**
 * Type guard para verificar si es un error de aplicación.
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return (
    error instanceof Error &&
    'isApplicationError' in error &&
    (error as ApplicationError).isApplicationError === true
  );
}
