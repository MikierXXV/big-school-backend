/**
 * ============================================
 * PORT: Logger
 * ============================================
 *
 * Define el contrato para el servicio de logging.
 * Abstrae la implementación de logging (console, winston, pino, etc.).
 *
 * RESPONSABILIDADES:
 * - Loggear mensajes en diferentes niveles
 * - Incluir contexto estructurado
 * - Permitir filtrado por nivel
 *
 * NIVELES DE LOG (de menor a mayor severidad):
 * - debug: Info detallada para debugging
 * - info: Eventos normales de la aplicación
 * - warn: Situaciones inesperadas pero no errores
 * - error: Errores que requieren atención
 *
 * SEGURIDAD:
 * - NUNCA loggear contraseñas
 * - NUNCA loggear tokens completos
 * - Sanitizar datos sensibles antes de loggear
 *
 * IMPLEMENTACIONES POSIBLES:
 * - ConsoleLogger (desarrollo)
 * - WinstonLogger (producción)
 * - PinoLogger (alto rendimiento)
 */

/**
 * Contexto adicional para los logs.
 * Permite incluir información estructurada.
 */
export interface LogContext {
  /** ID de correlación para tracing */
  correlationId?: string;
  /** ID del usuario si está autenticado */
  userId?: string;
  /** Nombre del módulo o componente */
  module?: string;
  /** Nombre de la operación */
  operation?: string;
  /** Datos adicionales */
  [key: string]: unknown;
}

/**
 * Niveles de log soportados.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Port del servicio de logging.
 * Implementado en infraestructura.
 */
export interface ILogger {
  /**
   * Log de nivel debug.
   * Para información detallada de debugging.
   *
   * @param message - Mensaje a loggear
   * @param context - Contexto adicional
   *
   * TODO: Implementar en ConsoleLogger/WinstonLogger
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Log de nivel info.
   * Para eventos normales de la aplicación.
   *
   * @param message - Mensaje a loggear
   * @param context - Contexto adicional
   *
   * TODO: Implementar en ConsoleLogger/WinstonLogger
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log de nivel warn.
   * Para situaciones inesperadas que no son errores.
   *
   * @param message - Mensaje a loggear
   * @param context - Contexto adicional
   *
   * TODO: Implementar en ConsoleLogger/WinstonLogger
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log de nivel error.
   * Para errores que requieren atención.
   *
   * @param message - Mensaje a loggear
   * @param error - Error opcional
   * @param context - Contexto adicional
   *
   * TODO: Implementar en ConsoleLogger/WinstonLogger
   */
  error(message: string, error?: Error, context?: LogContext): void;

  /**
   * Crea un logger hijo con contexto adicional.
   * Útil para propagar contexto en una operación.
   *
   * @param context - Contexto a agregar
   * @returns Nuevo logger con contexto combinado
   *
   * CASO DE USO:
   * ```typescript
   * const requestLogger = logger.child({ correlationId: 'xxx' });
   * requestLogger.info('Processing request'); // Incluye correlationId
   * ```
   *
   * TODO: Implementar en ConsoleLogger/WinstonLogger
   */
  child(context: LogContext): ILogger;

  /**
   * Establece el nivel mínimo de log.
   *
   * @param level - Nivel mínimo
   *
   * TODO: Implementar en ConsoleLogger/WinstonLogger
   */
  setLevel(level: LogLevel): void;
}

/**
 * Símbolo para inyección de dependencias.
 */
export const LOGGER = Symbol('ILogger');
