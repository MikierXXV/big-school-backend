/**
 * ============================================
 * SERVICE: ConsoleLogger
 * ============================================
 *
 * Implementación simple de ILogger usando console.
 * Para desarrollo. En producción usar Winston, Pino, etc.
 *
 * RESPONSABILIDADES:
 * - Loggear a consola con formato estructurado
 * - Filtrar por nivel
 * - Incluir contexto
 */

import { ILogger, LogContext, LogLevel } from '../../application/ports/logger.port.js';

/**
 * Orden de niveles de log.
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Implementación de ILogger usando console.
 */
export class ConsoleLogger implements ILogger {
  /**
   * Contexto base del logger.
   * @private
   */
  private readonly baseContext: LogContext;

  /**
   * Nivel mínimo de log.
   * @private
   */
  private currentLevel: LogLevel;

  /**
   * Constructor con contexto opcional.
   *
   * @param context - Contexto base
   * @param level - Nivel mínimo (default: debug)
   */
  constructor(context: LogContext = {}, level: LogLevel = 'debug') {
    this.baseContext = context;
    this.currentLevel = level;
  }

  /**
   * Log de nivel debug.
   */
  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log de nivel info.
   */
  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log de nivel warn.
   */
  public warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log de nivel error.
   */
  public error(message: string, error?: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };
    this.log('error', message, errorContext);
  }

  /**
   * Crea un logger hijo con contexto adicional.
   */
  public child(context: LogContext): ILogger {
    const combinedContext: LogContext = {
      ...this.baseContext,
      ...context,
    };
    return new ConsoleLogger(combinedContext, this.currentLevel);
  }

  /**
   * Establece el nivel mínimo de log.
   */
  public setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Método interno de logging.
   * @private
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Filtrar por nivel
    if (LOG_LEVELS[level] < LOG_LEVELS[this.currentLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const combinedContext = { ...this.baseContext, ...context };

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(Object.keys(combinedContext).length > 0 && { context: combinedContext }),
    };

    // Usar el método de console apropiado
    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(logEntry));
        break;
      case 'info':
        console.info(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
    }
  }
}
