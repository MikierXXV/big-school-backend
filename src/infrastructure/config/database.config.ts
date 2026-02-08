/**
 * ============================================
 * CONFIG: Database
 * ============================================
 *
 * Configuración de conexión a base de datos PostgreSQL.
 *
 * RESPONSABILIDADES:
 * - Configurar conexión a BD
 * - Pool de conexiones
 * - SSL/TLS para producción
 * - Soporte para DATABASE_URL (Railway/Render)
 */

/**
 * Configuración de conexión a PostgreSQL.
 */
export interface DatabaseConfig {
  /** Host del servidor */
  readonly host: string;
  /** Puerto */
  readonly port: number;
  /** Nombre de la base de datos */
  readonly database: string;
  /** Usuario */
  readonly user: string;
  /** Contraseña */
  readonly password: string;
  /** Configuración SSL */
  readonly ssl: boolean | { rejectUnauthorized: boolean };
  /** Configuración del pool de conexiones */
  readonly pool: PoolConfig;
}

/**
 * Configuración del pool de conexiones.
 */
export interface PoolConfig {
  /** Mínimo de conexiones */
  readonly min: number;
  /** Máximo de conexiones */
  readonly max: number;
  /** Timeout de conexión en ms */
  readonly connectionTimeoutMs: number;
  /** Timeout de idle en ms */
  readonly idleTimeoutMs: number;
}

/**
 * Valores por defecto del pool.
 */
const DEFAULT_POOL_CONFIG: PoolConfig = {
  min: 2,
  max: 10,
  connectionTimeoutMs: 30000,
  idleTimeoutMs: 10000,
};

/**
 * Parsea una DATABASE_URL a DatabaseConfig.
 * Formato: postgresql://user:password@host:port/database?sslmode=require
 *
 * @param url - URL de conexión
 * @returns DatabaseConfig parseada
 */
export function parseDatabaseUrl(url: string): DatabaseConfig {
  const parsed = new URL(url);

  // Check if SSL is required via sslmode parameter
  const sslmode = parsed.searchParams.get('sslmode');
  const requireSsl = sslmode === 'require' || sslmode === 'verify-full' || sslmode === 'verify-ca';

  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    database: parsed.pathname.slice(1), // Remove leading '/'
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl: requireSsl ? { rejectUnauthorized: false } : false,
    pool: {
      ...DEFAULT_POOL_CONFIG,
      min: parseInt(process.env.DATABASE_POOL_MIN ?? '2', 10),
      max: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
    },
  };
}

/**
 * Carga la configuración de base de datos desde variables de entorno.
 *
 * Soporta dos modos:
 * 1. DATABASE_URL (para Railway/Render)
 * 2. Variables individuales (para desarrollo local)
 *
 * @returns Configuración tipada
 */
export function loadDatabaseConfig(): DatabaseConfig {
  // Railway/Render proporcionan DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return parseDatabaseUrl(databaseUrl);
  }

  // Fallback a variables individuales
  const isProduction = process.env.NODE_ENV === 'production';
  const sslEnabled = process.env.DATABASE_SSL === 'true';

  return {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    database: process.env.DATABASE_NAME ?? 'big_school',
    user: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? '',
    ssl: isProduction
      ? { rejectUnauthorized: false }
      : sslEnabled,
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN ?? '2', 10),
      max: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
      connectionTimeoutMs: parseInt(
        process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? '30000',
        10
      ),
      idleTimeoutMs: parseInt(
        process.env.DATABASE_IDLE_TIMEOUT_MS ?? '10000',
        10
      ),
    },
  };
}

/**
 * Construye la URL de conexión desde DatabaseConfig.
 *
 * @param config - Configuración de BD
 * @returns URL de conexión
 */
export function buildConnectionUrl(config: DatabaseConfig): string {
  const ssl = config.ssl ? '?sslmode=require' : '';
  const encodedPassword = encodeURIComponent(config.password);

  return `postgresql://${config.user}:${encodedPassword}@${config.host}:${config.port}/${config.database}${ssl}`;
}

/**
 * Valida que la configuración de base de datos sea correcta.
 *
 * @param config - Configuración a validar
 * @throws Error si la configuración es inválida
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  if (!config.host) {
    throw new Error('DATABASE_HOST is required');
  }

  if (!config.database) {
    throw new Error('DATABASE_NAME is required');
  }

  if (!config.user) {
    throw new Error('DATABASE_USER is required');
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error('DATABASE_PORT must be between 1 and 65535');
  }

  if (config.pool.min < 0) {
    throw new Error('DATABASE_POOL_MIN must be >= 0');
  }

  if (config.pool.max < config.pool.min) {
    throw new Error('DATABASE_POOL_MAX must be >= DATABASE_POOL_MIN');
  }
}
