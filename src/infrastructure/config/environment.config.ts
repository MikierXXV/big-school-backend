/**
 * ============================================
 * CONFIG: Environment
 * ============================================
 *
 * Configuración general del entorno.
 * Carga y valida variables de entorno usando dotenv.
 *
 * RESPONSABILIDADES:
 * - Cargar .env
 * - Validar variables requeridas
 * - Exponer configuración tipada
 * - Valores por defecto seguros
 */

// import dotenv from 'dotenv';

/**
 * Entornos soportados.
 */
export type Environment = 'development' | 'test' | 'staging' | 'production';

/**
 * Configuración del servidor.
 */
export interface ServerConfig {
  /** Puerto del servidor */
  readonly port: number;
  /** Host del servidor */
  readonly host: string;
  /** Entorno actual */
  readonly environment: Environment;
  /** ¿Es producción? */
  readonly isProduction: boolean;
  /** ¿Es desarrollo? */
  readonly isDevelopment: boolean;
  /** ¿Es test? */
  readonly isTest: boolean;
}

/**
 * Configuración de CORS.
 */
export interface CorsConfig {
  /** Orígenes permitidos */
  readonly origin: string | string[];
  /** ¿Permitir credentials? */
  readonly credentials: boolean;
}

/**
 * Configuración de Rate Limiting.
 */
export interface RateLimitConfig {
  /** Ventana de tiempo en ms */
  readonly windowMs: number;
  /** Máximo de requests por ventana */
  readonly maxRequests: number;
}

/**
 * Configuración completa del entorno.
 */
export interface EnvironmentConfig {
  readonly server: ServerConfig;
  readonly cors: CorsConfig;
  readonly rateLimit: RateLimitConfig;
}

/**
 * Carga y valida la configuración del entorno.
 *
 * @returns Configuración tipada y validada
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const env = (process.env.NODE_ENV || 'development') as Environment;

  return {
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || 'localhost',
      environment: env,
      isProduction: env === 'production',
      isDevelopment: env === 'development',
      isTest: env === 'test',
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  };
}

/**
 * Valida que las variables de entorno requeridas estén presentes.
 *
 * @param requiredVars - Lista de variables requeridas
 * @throws Error si falta alguna variable
 *
 * TODO: Implementar validación
 */
export function validateRequiredEnvVars(_requiredVars: string[]): void {
  // TODO: Implementar
  // const missing = requiredVars.filter(v => !process.env[v]);
  // if (missing.length > 0) {
  //   throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  // }
}
