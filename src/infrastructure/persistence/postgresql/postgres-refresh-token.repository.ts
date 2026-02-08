/**
 * ============================================
 * REPOSITORY: PostgresRefreshTokenRepository
 * ============================================
 *
 * Implementación del RefreshTokenRepository para PostgreSQL.
 *
 * TABLA: refresh_tokens
 * - id: UUID PRIMARY KEY (token_id)
 * - user_id: UUID NOT NULL REFERENCES users(id)
 * - token_hash: VARCHAR(64) NOT NULL (SHA-256 del token)
 * - parent_token_id: UUID NULL REFERENCES refresh_tokens(id)
 * - status: VARCHAR(20) NOT NULL
 * - device_info: VARCHAR(500) NULL
 * - issued_at: TIMESTAMP NOT NULL
 * - expires_at: TIMESTAMP NOT NULL
 * - created_at: TIMESTAMP NOT NULL
 *
 * ÍNDICES:
 * - token_hash (para búsqueda por valor)
 * - user_id (para búsqueda por usuario)
 * - status (para filtrar activos)
 * - expires_at (para limpieza)
 */

import { Pool } from 'pg';
import { createHash } from 'crypto';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface.js';
import {
  RefreshToken,
  RefreshTokenStatus,
  RefreshTokenMetadata,
} from '../../../domain/value-objects/refresh-token.value-object.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';

/**
 * Fila de la tabla refresh_tokens.
 */
interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  parent_token_id: string | null;
  status: string;
  device_info: string | null;
  issued_at: Date;
  expires_at: Date;
  created_at: Date;
}

/**
 * Implementación de RefreshTokenRepository para PostgreSQL.
 */
export class PostgresRefreshTokenRepository implements RefreshTokenRepository {
  /**
   * Pool de conexiones a PostgreSQL.
   */
  private readonly pool: Pool;

  /**
   * Constructor con inyección del pool de conexiones.
   *
   * @param pool - Pool de conexiones PostgreSQL
   */
  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Guarda un nuevo refresh token.
   *
   * @param token - Token a guardar
   */
  public async save(token: RefreshToken): Promise<void> {
    // Compute SHA-256 hash of the token value (same algorithm as JwtTokenService)
    const tokenHash = createHash('sha256').update(token.value).digest('hex');

    // Calculate issuedAt from expiresAt (expiresAt = issuedAt + VALIDITY_MS)
    const issuedAt = new Date(token.expiresAt.getTime() - RefreshToken.VALIDITY_MS);

    const query = `
      INSERT INTO refresh_tokens (
        id, user_id, token_hash, parent_token_id, status,
        device_info, issued_at, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;

    await this.pool.query(query, [
      token.tokenId,
      token.userId,
      tokenHash,
      token.parentTokenId,
      token.status,
      token.deviceInfo,
      issuedAt,
      token.expiresAt,
    ]);
  }

  /**
   * Actualiza el estado de un token.
   *
   * @param tokenId - ID del token
   * @param status - Nuevo estado
   */
  public async updateStatus(
    tokenId: string,
    status: RefreshTokenStatus
  ): Promise<void> {
    const query = 'UPDATE refresh_tokens SET status = $2 WHERE id = $1';

    const result = await this.pool.query(query, [tokenId, status]);

    if (result.rowCount === 0) {
      throw new Error(`RefreshToken with id ${tokenId} not found`);
    }
  }

  /**
   * Revoca un token específico.
   *
   * @param tokenId - ID del token
   */
  public async revoke(tokenId: string): Promise<void> {
    await this.updateStatus(tokenId, RefreshTokenStatus.REVOKED);
  }

  /**
   * Revoca todos los tokens de un usuario.
   *
   * @param userId - ID del usuario
   * @returns Cantidad de tokens revocados
   */
  public async revokeAllByUser(userId: UserId): Promise<number> {
    const query = `
      UPDATE refresh_tokens
      SET status = 'REVOKED'
      WHERE user_id = $1 AND status = 'ACTIVE'
    `;

    const result = await this.pool.query(query, [userId.value]);

    return result.rowCount ?? 0;
  }

  /**
   * Revoca toda la familia de tokens usando CTE recursivo.
   *
   * @param familyRootTokenId - ID del token raíz
   * @returns Cantidad de tokens revocados
   */
  public async revokeFamily(familyRootTokenId: string): Promise<number> {
    const query = `
      WITH RECURSIVE family AS (
        -- Token raíz
        SELECT id FROM refresh_tokens WHERE id = $1
        UNION ALL
        -- Tokens hijos (descendientes)
        SELECT rt.id
        FROM refresh_tokens rt
        INNER JOIN family f ON rt.parent_token_id = f.id
      )
      UPDATE refresh_tokens
      SET status = 'REVOKED'
      WHERE id IN (SELECT id FROM family) AND status = 'ACTIVE'
    `;

    const result = await this.pool.query(query, [familyRootTokenId]);

    return result.rowCount ?? 0;
  }

  /**
   * Elimina tokens expirados.
   *
   * @param olderThan - Fecha límite
   * @returns Cantidad eliminada
   */
  public async deleteExpired(olderThan: Date): Promise<number> {
    const query = `
      DELETE FROM refresh_tokens
      WHERE expires_at < $1 AND status != 'ACTIVE'
    `;

    const result = await this.pool.query(query, [olderThan]);

    return result.rowCount ?? 0;
  }

  /**
   * Busca un token por ID.
   * Nota: No podemos reconstruir el valor del token, solo los metadatos.
   *
   * @param tokenId - ID del token
   * @returns RefreshToken o null
   */
  public async findById(tokenId: string): Promise<RefreshToken | null> {
    const query = `
      SELECT id, user_id, token_hash, parent_token_id, status,
             device_info, issued_at, expires_at, created_at
      FROM refresh_tokens
      WHERE id = $1
    `;

    const result = await this.pool.query<RefreshTokenRow>(query, [tokenId]);

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    // No tenemos el valor original del token, solo el hash
    // Usamos el hash como valor temporal (solo para lectura)
    return this.rowToEntity(row, row.token_hash);
  }

  /**
   * Busca un token por su hash.
   *
   * @param tokenHash - Hash del token
   * @returns RefreshToken o null
   */
  public async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const query = `
      SELECT id, user_id, token_hash, parent_token_id, status,
             device_info, issued_at, expires_at, created_at
      FROM refresh_tokens
      WHERE token_hash = $1
    `;

    const result = await this.pool.query<RefreshTokenRow>(query, [tokenHash]);

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return this.rowToEntity(row, row.token_hash);
  }

  /**
   * Obtiene tokens activos de un usuario.
   *
   * @param userId - ID del usuario
   * @returns Array de tokens activos
   */
  public async findActiveByUser(userId: UserId): Promise<RefreshToken[]> {
    const query = `
      SELECT id, user_id, token_hash, parent_token_id, status,
             device_info, issued_at, expires_at, created_at
      FROM refresh_tokens
      WHERE user_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
      ORDER BY issued_at DESC
    `;

    const result = await this.pool.query<RefreshTokenRow>(query, [userId.value]);

    return result.rows.map((row) => this.rowToEntity(row, row.token_hash));
  }

  /**
   * Cuenta sesiones activas.
   *
   * @param userId - ID del usuario
   * @returns Cantidad
   */
  public async countActiveByUser(userId: UserId): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM refresh_tokens
      WHERE user_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
    `;

    const result = await this.pool.query<{ count: string }>(query, [userId.value]);

    const row = result.rows[0];
    return row ? parseInt(row.count, 10) : 0;
  }

  /**
   * Verifica si un token está activo.
   *
   * @param tokenHash - Hash del token
   * @returns true si está activo
   */
  public async isActiveToken(tokenHash: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM refresh_tokens
      WHERE token_hash = $1 AND status = 'ACTIVE' AND expires_at > NOW()
      LIMIT 1
    `;

    const result = await this.pool.query(query, [tokenHash]);

    return result.rows.length > 0;
  }

  /**
   * Encuentra el ID del token raíz de una familia usando CTE recursivo ascendente.
   *
   * @param tokenId - ID de cualquier token de la familia
   * @returns ID del raíz o null
   */
  public async findFamilyRootId(tokenId: string): Promise<string | null> {
    const query = `
      WITH RECURSIVE ancestors AS (
        -- Token inicial
        SELECT id, parent_token_id FROM refresh_tokens WHERE id = $1
        UNION ALL
        -- Ancestros (hacia arriba)
        SELECT rt.id, rt.parent_token_id
        FROM refresh_tokens rt
        INNER JOIN ancestors a ON rt.id = a.parent_token_id
      )
      SELECT id FROM ancestors WHERE parent_token_id IS NULL
    `;

    const result = await this.pool.query<{ id: string }>(query, [tokenId]);

    const row = result.rows[0];
    return row?.id ?? null;
  }

  /**
   * Convierte una fila de BD a RefreshToken.
   *
   * @param row - Fila de la tabla
   * @param tokenValue - Valor del token (o hash si no se conoce)
   * @returns RefreshToken
   */
  private rowToEntity(row: RefreshTokenRow, tokenValue: string): RefreshToken {
    const metadata: RefreshTokenMetadata = {
      tokenId: row.id,
      userId: row.user_id,
      issuedAt: row.issued_at,
      expiresAt: row.expires_at,
      parentTokenId: row.parent_token_id,
      status: row.status as RefreshTokenStatus,
      deviceInfo: row.device_info ?? undefined,
    };

    return RefreshToken.fromPersistence(tokenValue, metadata);
  }
}
