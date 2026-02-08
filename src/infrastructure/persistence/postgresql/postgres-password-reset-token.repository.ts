/**
 * ============================================
 * REPOSITORY: PostgresPasswordResetTokenRepository
 * ============================================
 *
 * Implementación del PasswordResetTokenRepository para PostgreSQL.
 *
 * TABLA: password_reset_tokens
 * - id: UUID PRIMARY KEY (token_id)
 * - user_id: UUID NOT NULL REFERENCES users(id)
 * - token_hash: VARCHAR(64) NOT NULL (SHA-256 del token)
 * - created_at: TIMESTAMP NOT NULL (issued_at)
 * - expires_at: TIMESTAMP NOT NULL
 * - used_at: TIMESTAMP NULL
 * - revoked_at: TIMESTAMP NULL
 *
 * NOTA: email se obtiene mediante JOIN con users table.
 * NOTA: status se deriva de used_at y revoked_at.
 *
 * ÍNDICES:
 * - token_hash (para búsqueda por valor)
 * - user_id (para búsqueda por usuario)
 * - expires_at (para limpieza)
 */

import { Pool } from 'pg';
import { PasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.interface.js';
import {
  PasswordResetToken,
  PasswordResetTokenStatus,
  PasswordResetTokenMetadata,
} from '../../../domain/value-objects/password-reset-token.value-object.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';

/**
 * Fila de la tabla password_reset_tokens con email del usuario.
 */
interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  email: string;
  created_at: Date;
  expires_at: Date;
  used_at: Date | null;
  revoked_at: Date | null;
}

/**
 * Implementación de PasswordResetTokenRepository para PostgreSQL.
 */
export class PostgresPasswordResetTokenRepository implements PasswordResetTokenRepository {
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
   * Guarda un nuevo password reset token.
   *
   * @param token - Token a guardar
   * @param tokenHash - Hash SHA-256 del valor del token
   */
  public async save(token: PasswordResetToken, tokenHash: string): Promise<void> {
    const query = `
      INSERT INTO password_reset_tokens (
        id, user_id, token_hash, created_at, expires_at, used_at, revoked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await this.pool.query(query, [
      token.tokenId,
      token.userId,
      tokenHash,
      token.issuedAt,
      token.expiresAt,
      token.usedAt,
      token.revokedAt,
    ]);
  }

  /**
   * Marca un token como usado.
   *
   * @param tokenId - ID del token
   * @param usedAt - Fecha de uso
   */
  public async markAsUsed(tokenId: string, usedAt: Date): Promise<void> {
    const query = `
      UPDATE password_reset_tokens
      SET used_at = $2
      WHERE id = $1 AND used_at IS NULL AND revoked_at IS NULL
    `;

    await this.pool.query(query, [tokenId, usedAt]);
  }

  /**
   * Actualiza el estado de un token.
   *
   * @param tokenId - ID del token
   * @param status - Nuevo estado
   */
  public async updateStatus(
    tokenId: string,
    status: PasswordResetTokenStatus
  ): Promise<void> {
    if (status === PasswordResetTokenStatus.USED) {
      await this.markAsUsed(tokenId, new Date());
    } else if (status === PasswordResetTokenStatus.REVOKED) {
      const query = `
        UPDATE password_reset_tokens
        SET revoked_at = NOW()
        WHERE id = $1 AND used_at IS NULL AND revoked_at IS NULL
      `;
      await this.pool.query(query, [tokenId]);
    }
    // ACTIVE status cannot be set once token is used/revoked
  }

  /**
   * Revoca todos los tokens activos de un usuario.
   *
   * @param userId - ID del usuario
   * @param revokedAt - Fecha de revocación
   * @returns Cantidad de tokens revocados
   */
  public async revokeAllByUser(userId: UserId, revokedAt: Date): Promise<number> {
    const query = `
      UPDATE password_reset_tokens
      SET revoked_at = $2
      WHERE user_id = $1 AND used_at IS NULL AND revoked_at IS NULL
    `;

    const result = await this.pool.query(query, [userId.value, revokedAt]);

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
      DELETE FROM password_reset_tokens
      WHERE expires_at < $1
    `;

    const result = await this.pool.query(query, [olderThan]);

    return result.rowCount ?? 0;
  }

  /**
   * Busca un token por ID.
   *
   * @param tokenId - ID del token
   * @returns PasswordResetToken o null
   */
  public async findById(tokenId: string): Promise<PasswordResetToken | null> {
    const query = `
      SELECT prt.id, prt.user_id, prt.token_hash, u.email,
             prt.created_at, prt.expires_at, prt.used_at, prt.revoked_at
      FROM password_reset_tokens prt
      INNER JOIN users u ON u.id = prt.user_id
      WHERE prt.id = $1
    `;

    const result = await this.pool.query<PasswordResetTokenRow>(query, [tokenId]);

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return this.rowToEntity(row);
  }

  /**
   * Busca un token por su hash.
   *
   * @param tokenHash - Hash del token
   * @returns PasswordResetToken o null
   */
  public async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const query = `
      SELECT prt.id, prt.user_id, prt.token_hash, u.email,
             prt.created_at, prt.expires_at, prt.used_at, prt.revoked_at
      FROM password_reset_tokens prt
      INNER JOIN users u ON u.id = prt.user_id
      WHERE prt.token_hash = $1
    `;

    const result = await this.pool.query<PasswordResetTokenRow>(query, [tokenHash]);

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return this.rowToEntity(row);
  }

  /**
   * Busca el token activo más reciente de un usuario.
   *
   * @param userId - ID del usuario
   * @returns PasswordResetToken o null
   */
  public async findActiveByUserId(userId: UserId): Promise<PasswordResetToken | null> {
    const query = `
      SELECT prt.id, prt.user_id, prt.token_hash, u.email,
             prt.created_at, prt.expires_at, prt.used_at, prt.revoked_at
      FROM password_reset_tokens prt
      INNER JOIN users u ON u.id = prt.user_id
      WHERE prt.user_id = $1
        AND prt.used_at IS NULL
        AND prt.revoked_at IS NULL
        AND prt.expires_at > NOW()
      ORDER BY prt.created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query<PasswordResetTokenRow>(query, [userId.value]);

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return this.rowToEntity(row);
  }

  /**
   * Verifica si existe un token activo para el usuario.
   *
   * @param userId - ID del usuario
   * @returns true si existe un token activo
   */
  public async hasActiveToken(userId: UserId): Promise<boolean> {
    const query = `
      SELECT 1 FROM password_reset_tokens
      WHERE user_id = $1
        AND used_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `;

    const result = await this.pool.query(query, [userId.value]);

    return result.rows.length > 0;
  }

  /**
   * Cuenta la cantidad de solicitudes de reset en un período.
   *
   * @param userId - ID del usuario
   * @param since - Desde qué fecha contar
   * @returns Cantidad de solicitudes
   */
  public async countRequestsSince(userId: UserId, since: Date): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM password_reset_tokens
      WHERE user_id = $1 AND created_at >= $2
    `;

    const result = await this.pool.query<{ count: string }>(query, [userId.value, since]);

    const row = result.rows[0];
    return row ? parseInt(row.count, 10) : 0;
  }

  /**
   * Convierte una fila de BD a PasswordResetToken.
   * Deriva el status de used_at y revoked_at.
   *
   * @param row - Fila de la tabla con JOIN a users
   * @returns PasswordResetToken
   */
  private rowToEntity(row: PasswordResetTokenRow): PasswordResetToken {
    // Derivar status de las columnas used_at y revoked_at
    let status: PasswordResetTokenStatus;
    if (row.used_at !== null) {
      status = PasswordResetTokenStatus.USED;
    } else if (row.revoked_at !== null) {
      status = PasswordResetTokenStatus.REVOKED;
    } else {
      status = PasswordResetTokenStatus.ACTIVE;
    }

    const metadata: PasswordResetTokenMetadata = {
      tokenId: row.id,
      userId: row.user_id,
      email: row.email,
      issuedAt: row.created_at,
      expiresAt: row.expires_at,
      status,
      usedAt: row.used_at,
      revokedAt: row.revoked_at,
    };

    // El valor real del token no se almacena, usamos el hash como placeholder
    // Solo se usa para reconstrucción desde BD (el valor no es necesario para validación)
    return PasswordResetToken.fromPersistence(row.token_hash, metadata);
  }
}
