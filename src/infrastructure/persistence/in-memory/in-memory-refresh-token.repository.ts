/**
 * ============================================
 * REPOSITORY: InMemoryRefreshTokenRepository
 * ============================================
 *
 * Implementación del RefreshTokenRepository en memoria.
 * SOLO para tests - NO usar en producción.
 */

import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface.js';
import {
  RefreshToken,
  RefreshTokenStatus,
} from '../../../domain/value-objects/refresh-token.value-object.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';

/**
 * Estructura interna para almacenar tokens.
 */
interface StoredToken {
  token: RefreshToken;
  tokenHash: string;
}

/**
 * Implementación en memoria del RefreshTokenRepository.
 * Solo para tests.
 */
export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
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
   * Guarda un nuevo refresh token.
   */
  public async save(token: RefreshToken): Promise<void> {
    // Simular hash (en tests reales, usar el mismo algoritmo)
    const hash = `hash_${token.value}`;

    this.tokens.set(token.tokenId, { token, tokenHash: hash });
    this.hashIndex.set(hash, token.tokenId);
  }

  /**
   * Actualiza el estado de un token.
   */
  public async updateStatus(
    tokenId: string,
    status: RefreshTokenStatus
  ): Promise<void> {
    const stored = this.tokens.get(tokenId);
    if (!stored) {
      return;
    }

    // Crear copia con nuevo estado
    let updatedToken: RefreshToken;
    if (status === RefreshTokenStatus.ROTATED) {
      updatedToken = stored.token.markAsRotated();
    } else if (status === RefreshTokenStatus.REVOKED) {
      updatedToken = stored.token.markAsRevoked();
    } else {
      return; // No soportamos otros cambios de estado
    }

    this.tokens.set(tokenId, { ...stored, token: updatedToken });
  }

  /**
   * Revoca un token específico.
   */
  public async revoke(tokenId: string): Promise<void> {
    await this.updateStatus(tokenId, RefreshTokenStatus.REVOKED);
  }

  /**
   * Revoca todos los tokens de un usuario.
   */
  public async revokeAllByUser(userId: UserId): Promise<number> {
    let count = 0;
    for (const [tokenId, stored] of this.tokens) {
      if (stored.token.userId === userId.value && stored.token.isActive()) {
        await this.revoke(tokenId);
        count++;
      }
    }
    return count;
  }

  /**
   * Revoca toda la familia de tokens.
   */
  public async revokeFamily(familyRootTokenId: string): Promise<number> {
    let count = 0;

    // Encontrar todos los tokens de la familia
    const familyTokenIds = this.findFamilyMembers(familyRootTokenId);

    for (const tokenId of familyTokenIds) {
      const stored = this.tokens.get(tokenId);
      if (stored && stored.token.isActive()) {
        await this.revoke(tokenId);
        count++;
      }
    }

    return count;
  }

  /**
   * Elimina tokens expirados.
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
   * Busca un token por ID.
   */
  public async findById(tokenId: string): Promise<RefreshToken | null> {
    const stored = this.tokens.get(tokenId);
    return stored?.token ?? null;
  }

  /**
   * Busca un token por su hash.
   */
  public async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const tokenId = this.hashIndex.get(tokenHash);
    if (!tokenId) {
      return null;
    }
    return this.tokens.get(tokenId)?.token ?? null;
  }

  /**
   * Obtiene tokens activos de un usuario.
   */
  public async findActiveByUser(userId: UserId): Promise<RefreshToken[]> {
    const result: RefreshToken[] = [];
    for (const stored of this.tokens.values()) {
      if (stored.token.userId === userId.value && stored.token.isActive()) {
        result.push(stored.token);
      }
    }
    return result;
  }

  /**
   * Cuenta sesiones activas.
   */
  public async countActiveByUser(userId: UserId): Promise<number> {
    const active = await this.findActiveByUser(userId);
    return active.length;
  }

  /**
   * Verifica si un token está activo.
   */
  public async isActiveToken(tokenHash: string): Promise<boolean> {
    const token = await this.findByTokenHash(tokenHash);
    return token?.isActive() ?? false;
  }

  /**
   * Encuentra el ID del token raíz de una familia.
   */
  public async findFamilyRootId(tokenId: string): Promise<string | null> {
    let currentToken = this.tokens.get(tokenId)?.token;
    if (!currentToken) {
      return null;
    }

    // Subir hasta encontrar el raíz (sin parent)
    while (currentToken.parentTokenId) {
      const parent = this.tokens.get(currentToken.parentTokenId)?.token;
      if (!parent) {
        break;
      }
      currentToken = parent;
    }

    return currentToken.tokenId;
  }

  /**
   * Encuentra todos los miembros de una familia.
   * @private
   */
  private findFamilyMembers(rootTokenId: string): string[] {
    const members: string[] = [rootTokenId];

    // BFS para encontrar todos los descendientes
    const queue = [rootTokenId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      for (const [tokenId, stored] of this.tokens) {
        if (stored.token.parentTokenId === currentId && !members.includes(tokenId)) {
          members.push(tokenId);
          queue.push(tokenId);
        }
      }
    }

    return members;
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

  /**
   * Simula el hash de un token (para tests).
   */
  public simulateHash(tokenValue: string): string {
    return `hash_${tokenValue}`;
  }
}
