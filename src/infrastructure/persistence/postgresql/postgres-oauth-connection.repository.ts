/**
 * ============================================
 * REPOSITORY: PostgresOAuthConnectionRepository
 * ============================================
 *
 * Implementación del IOAuthConnectionRepository para PostgreSQL.
 *
 * TABLA: oauth_connections
 * - id: UUID PRIMARY KEY
 * - user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
 * - provider: VARCHAR(50) NOT NULL
 * - provider_user_id: VARCHAR(255) NOT NULL
 * - provider_email: VARCHAR(255) NULL
 * - created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *
 * ÍNDICES:
 * - (provider, provider_user_id) UNIQUE — lookup rápido en callback OAuth
 * - user_id — para obtener conexiones de un usuario
 */

import { Pool } from 'pg';
import { IOAuthConnectionRepository } from '../../../domain/repositories/oauth-connection.repository.interface.js';
import { OAuthConnection } from '../../../domain/entities/oauth-connection.entity.js';
import { OAuthProvider } from '../../../domain/value-objects/oauth-provider.value-object.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';

/**
 * Fila de la tabla oauth_connections.
 */
interface OAuthConnectionRow {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  provider_email: string | null;
  created_at: Date;
}

/**
 * Implementación de IOAuthConnectionRepository para PostgreSQL.
 */
export class PostgresOAuthConnectionRepository implements IOAuthConnectionRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Persiste una nueva conexión OAuth.
   * Si ya existe el par (provider, provider_user_id) no falla — la ignora.
   */
  public async save(connection: OAuthConnection): Promise<void> {
    const query = `
      INSERT INTO oauth_connections (id, user_id, provider, provider_user_id, provider_email, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (provider, provider_user_id) DO NOTHING
    `;

    await this.pool.query(query, [
      connection.id,
      connection.userId.value,
      connection.provider.value,
      connection.providerUserId,
      connection.providerEmail || null,
      connection.createdAt,
    ]);
  }

  /**
   * Busca una conexión por proveedor y providerUserId.
   * Utilizado en el callback OAuth para identificar usuarios existentes.
   */
  public async findByProviderUserId(
    provider: string,
    providerUserId: string
  ): Promise<OAuthConnection | null> {
    const query = `
      SELECT id, user_id, provider, provider_user_id, provider_email, created_at
      FROM oauth_connections
      WHERE provider = $1 AND provider_user_id = $2
      LIMIT 1
    `;

    const result = await this.pool.query<OAuthConnectionRow>(query, [provider, providerUserId]);

    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.rowToEntity(result.rows[0]);
  }

  /**
   * Obtiene todas las conexiones OAuth de un usuario.
   */
  public async findByUserId(userId: string): Promise<OAuthConnection[]> {
    const query = `
      SELECT id, user_id, provider, provider_user_id, provider_email, created_at
      FROM oauth_connections
      WHERE user_id = $1
    `;

    const result = await this.pool.query<OAuthConnectionRow>(query, [userId]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Obtiene todas las conexiones OAuth de un conjunto de usuarios.
   * Evita el problema N+1 al listar usuarios.
   */
  public async findByUserIds(userIds: string[]): Promise<OAuthConnection[]> {
    if (userIds.length === 0) return [];

    const query = `
      SELECT id, user_id, provider, provider_user_id, provider_email, created_at
      FROM oauth_connections
      WHERE user_id = ANY($1)
    `;

    const result = await this.pool.query<OAuthConnectionRow>(query, [userIds]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Cuenta conexiones OAuth agrupadas por proveedor (DISTINCT user_id).
   */
  public async countByProvider(): Promise<{ google: number; microsoft: number }> {
    const query = `
      SELECT provider, COUNT(DISTINCT user_id) AS count
      FROM oauth_connections
      GROUP BY provider
    `;

    const result = await this.pool.query<{ provider: string; count: string }>(query);

    const counts = { google: 0, microsoft: 0 };
    for (const row of result.rows) {
      if (row.provider === 'google' || row.provider === 'microsoft') {
        counts[row.provider] = parseInt(row.count, 10);
      }
    }
    return counts;
  }

  // ============================================
  // HELPERS
  // ============================================

  private rowToEntity(row: OAuthConnectionRow): OAuthConnection {
    return OAuthConnection.fromPersistence({
      id: row.id,
      userId: UserId.create(row.user_id),
      provider: OAuthProvider.create(row.provider),
      providerUserId: row.provider_user_id,
      providerEmail: row.provider_email ?? '',
      createdAt: new Date(row.created_at),
    });
  }
}
