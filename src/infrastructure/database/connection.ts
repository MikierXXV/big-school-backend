/**
 * ============================================
 * DATABASE: Connection Pool
 * ============================================
 *
 * Gestión del pool de conexiones PostgreSQL.
 *
 * RESPONSABILIDADES:
 * - Crear y gestionar el pool de conexiones
 * - Proveer acceso global al pool
 * - Manejar cierre graceful
 * - Pruebas de conexión
 */

import { Pool, PoolConfig, PoolClient, QueryResult } from 'pg';
import {
  DatabaseConfig,
  loadDatabaseConfig,
  validateDatabaseConfig,
} from '../config/database.config.js';

/**
 * Pool de conexiones singleton.
 */
let pool: Pool | null = null;

/**
 * Crea un nuevo pool de conexiones.
 *
 * @param config - Configuración opcional (usa loadDatabaseConfig si no se provee)
 * @returns Pool de conexiones
 */
export function createPool(config?: DatabaseConfig): Pool {
  const dbConfig = config ?? loadDatabaseConfig();

  // Validar configuración
  validateDatabaseConfig(dbConfig);

  const poolConfig: PoolConfig = {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: dbConfig.ssl,
    min: dbConfig.pool.min,
    max: dbConfig.pool.max,
    connectionTimeoutMillis: dbConfig.pool.connectionTimeoutMs,
    idleTimeoutMillis: dbConfig.pool.idleTimeoutMs,
  };

  return new Pool(poolConfig);
}

/**
 * Obtiene el pool de conexiones singleton.
 * Crea uno nuevo si no existe.
 *
 * @returns Pool de conexiones
 */
export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

/**
 * Cierra el pool de conexiones.
 * Útil para graceful shutdown.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Prueba la conexión a la base de datos.
 *
 * @returns true si la conexión es exitosa
 * @throws Error si la conexión falla
 */
export async function testConnection(): Promise<boolean> {
  const currentPool = getPool();
  const client = await currentPool.connect();

  try {
    await client.query('SELECT 1 AS connection_test');
    return true;
  } finally {
    client.release();
  }
}

/**
 * Obtiene un cliente del pool para una transacción.
 *
 * @returns Cliente de conexión
 */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Ejecuta una query en el pool.
 *
 * @param text - Query SQL
 * @param params - Parámetros de la query
 * @returns Resultado de la query
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

/**
 * Ejecuta una función dentro de una transacción.
 *
 * @param fn - Función a ejecutar dentro de la transacción
 * @returns Resultado de la función
 * @throws Error si la transacción falla (hace rollback automático)
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Información del estado del pool.
 */
export interface PoolStatus {
  /** Total de clientes en el pool */
  totalCount: number;
  /** Clientes idle (disponibles) */
  idleCount: number;
  /** Clientes activos (en uso) */
  activeCount: number;
  /** Clientes esperando */
  waitingCount: number;
}

/**
 * Obtiene el estado actual del pool de conexiones.
 *
 * @returns Estado del pool
 */
export function getPoolStatus(): PoolStatus {
  const currentPool = getPool();

  return {
    totalCount: currentPool.totalCount,
    idleCount: currentPool.idleCount,
    activeCount: currentPool.totalCount - currentPool.idleCount,
    waitingCount: currentPool.waitingCount,
  };
}
