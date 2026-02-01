/**
 * ============================================
 * CONFIG: Database
 * ============================================
 *
 * Configuración de conexión a base de datos.
 * Soporta PostgreSQL (puede extenderse a otros).
 *
 * RESPONSABILIDADES:
 * - Configurar conexión a BD
 * - Pool de conexiones
 * - SSL/TLS
 * - Timeouts
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
  /** ¿Usar SSL? */
  readonly ssl: boolean;
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
 * Carga la configuración de base de datos.
 *
 * @returns Configuración tipada
 *
 * TODO: Implementar carga desde env
 */
export function loadDatabaseConfig(): DatabaseConfig {
  // TODO: Implementar
  // return {
  //   host: process.env.DATABASE_HOST || 'localhost',
  //   port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  //   database: process.env.DATABASE_NAME || 'big_school',
  //   user: process.env.DATABASE_USER || 'postgres',
  //   password: process.env.DATABASE_PASSWORD || '',
  //   ssl: process.env.DATABASE_SSL === 'true',
  //   pool: {
  //     min: 2,
  //     max: 10,
  //     connectionTimeoutMs: 10000,
  //     idleTimeoutMs: 30000,
  //   },
  // };

  // Placeholder
  throw new Error('loadDatabaseConfig not implemented');
}

/**
 * Construye la URL de conexión.
 *
 * @param config - Configuración de BD
 * @returns URL de conexión
 *
 * TODO: Implementar
 */
export function buildConnectionUrl(_config: DatabaseConfig): string {
  // TODO: Implementar
  // return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;

  // Placeholder
  throw new Error('buildConnectionUrl not implemented');
}
