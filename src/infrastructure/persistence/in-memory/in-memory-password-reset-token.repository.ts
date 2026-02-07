/**
 * ============================================
 * REPOSITORY: InMemoryPasswordResetTokenRepository
 * ============================================
 *
 * Implementación del PasswordResetTokenRepository en memoria.
 * SOLO para tests - NO usar en producción.
 *
 * SEGURIDAD:
 * - Almacena hash del token, no el valor real
 * - Tokens de un solo uso (se marcan como USED)
 * - Revocación automática de tokens anteriores
 */

import { PasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.interface.js';
import {
  PasswordResetToken,
  PasswordResetTokenStatus,
} from '../../../domain/value-objects/password-reset-token.value-object.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';

/**
 * Estructura interna para almacenar tokens.
 */
interface StoredToken {
  token: PasswordResetToken;
  tokenHash: string;
}

/**
 * Implementación en memoria del PasswordResetTokenRepository.
 * Solo para tests.
 */
export class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
  /**
   * Almacén de tokens (Map por tokenId).
   * @private
   */
  private tokens: Map<string, StoredToken> = new Map();

  /**
   * Índice por hash para búsquedas rápidas.
   * @private
   */
  private hashIndex: Map<string, string> = new Map(); // hash -> tokenId

  /**
   * Guarda un nuevo password reset token.
   *
   * @param token - PasswordResetToken a guardar
   * @param tokenHash - Hash SHA-256 del valor del token
   */
  public async save(token: PasswordResetToken, tokenHash: string): Promise<void> {
    this.tokens.set(token.tokenId, { token, tokenHash });
    this.hashIndex.set(tokenHash, token.tokenId);
  }

  /**
   * Busca un token por su ID único.
   *
   * @param tokenId - ID del token
   * @returns El token o null si no existe
   */
  public async findById(tokenId: string): Promise<PasswordResetToken | null> {
    const stored = this.tokens.get(tokenId);
    return stored?.token ?? null;
  }

  /**
   * Busca un token por su hash.
   *
   * @param tokenHash - Hash SHA-256 del valor del token
   * @returns El token o null si no existe
   */
  public async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const tokenId = this.hashIndex.get(tokenHash);
    if (!tokenId) {
      return null;
    }
    return this.tokens.get(tokenId)?.token ?? null;
  }

  /**
   * Busca el token activo más reciente de un usuario.
   *
   * @param userId - ID del usuario
   * @returns El token activo o null si no existe
   */
  public async findActiveByUserId(userId: UserId): Promise<PasswordResetToken | null> {
    for (const stored of this.tokens.values()) {
      if (
        stored.token.userId === userId.value &&
        stored.token.status === PasswordResetTokenStatus.ACTIVE
      ) {
        return stored.token;
      }
    }
    return null;
  }

  /**
   * Marca un token como usado.
   *
   * @param tokenId - ID del token
   * @param usedAt - Fecha de uso
   */
  public async markAsUsed(tokenId: string, usedAt: Date): Promise<void> {
    const stored = this.tokens.get(tokenId);
    if (!stored) {
      return;
    }

    const updatedToken = stored.token.markAsUsed(usedAt);
    this.tokens.set(tokenId, { ...stored, token: updatedToken });
  }

  /**
   * Actualiza el estado de un token.
   *
   * @param tokenId - ID del token
   * @param status - Nuevo estado
   */
  public async updateStatus(tokenId: string, status: PasswordResetTokenStatus): Promise<void> {
    const stored = this.tokens.get(tokenId);
    if (!stored) {
      return;
    }

    let updatedToken: PasswordResetToken;
    if (status === PasswordResetTokenStatus.USED) {
      updatedToken = stored.token.markAsUsed(new Date());
    } else if (status === PasswordResetTokenStatus.REVOKED) {
      updatedToken = stored.token.markAsRevoked(new Date());
    } else {
      return; // No soportamos cambio a ACTIVE
    }

    this.tokens.set(tokenId, { ...stored, token: updatedToken });
  }

  /**
   * Revoca todos los tokens activos de un usuario.
   *
   * @param userId - ID del usuario
   * @param revokedAt - Fecha de revocación
   * @returns Cantidad de tokens revocados
   */
  public async revokeAllByUser(userId: UserId, revokedAt: Date): Promise<number> {
    let count = 0;

    for (const [tokenId, stored] of this.tokens) {
      if (
        stored.token.userId === userId.value &&
        stored.token.status === PasswordResetTokenStatus.ACTIVE
      ) {
        const revokedToken = stored.token.markAsRevoked(revokedAt);
        this.tokens.set(tokenId, { ...stored, token: revokedToken });
        count++;
      }
    }

    return count;
  }

  /**
   * Elimina tokens expirados.
   *
   * @param olderThan - Eliminar tokens expirados antes de esta fecha
   * @returns Cantidad de tokens eliminados
   */
  public async deleteExpired(olderThan: Date): Promise<number> {
    let count = 0;

    for (const [tokenId, stored] of this.tokens) {
      if (stored.token.expiresAt < olderThan) {
        this.hashIndex.delete(stored.tokenHash);
        this.tokens.delete(tokenId);
        count++;
      }
    }

    return count;
  }

  /**
   * Verifica si existe un token activo para el usuario.
   *
   * @param userId - ID del usuario
   * @returns true si existe un token activo
   */
  public async hasActiveToken(userId: UserId): Promise<boolean> {
    const active = await this.findActiveByUserId(userId);
    return active !== null;
  }

  /**
   * Cuenta la cantidad de solicitudes de reset en un período.
   *
   * @param userId - ID del usuario
   * @param since - Desde qué fecha contar
   * @returns Cantidad de solicitudes
   */
  public async countRequestsSince(userId: UserId, since: Date): Promise<number> {
    let count = 0;

    for (const stored of this.tokens.values()) {
      if (stored.token.userId === userId.value && stored.token.issuedAt >= since) {
        count++;
      }
    }

    return count;
  }

  // ============================================
  // TEST HELPERS
  // ============================================

  /**
   * Resetea el repositorio.
   */
  public reset(): void {
    this.tokens.clear();
    this.hashIndex.clear();
  }

  /**
   * Obtiene la cantidad de tokens.
   */
  public count(): number {
    return this.tokens.size;
  }
}
