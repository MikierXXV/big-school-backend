/**
 * ============================================
 * REPOSITORY: InMemoryOAuthConnectionRepository
 * ============================================
 *
 * Implementación en memoria del repositorio de OAuthConnection.
 * Usada en desarrollo y tests. No persiste entre reinicios.
 *
 * ÍNDICES:
 * - Principal: Map<id, OAuthConnection>
 * - Secundario: Map<provider:providerUserId, OAuthConnection> (para lookup rápido en callback)
 */

import { IOAuthConnectionRepository } from '../../../domain/repositories/oauth-connection.repository.interface.js';
import { OAuthConnection } from '../../../domain/entities/oauth-connection.entity.js';

/**
 * Implementación en memoria de IOAuthConnectionRepository.
 */
export class InMemoryOAuthConnectionRepository implements IOAuthConnectionRepository {
  private readonly store: Map<string, OAuthConnection> = new Map();
  /**
   * Índice secundario: provider:providerUserId → connection
   * Permite búsqueda O(1) durante el flujo de callback.
   */
  private readonly providerIndex: Map<string, OAuthConnection> = new Map();

  /**
   * Persiste una nueva conexión OAuth.
   * Actualiza ambos índices.
   */
  public async save(connection: OAuthConnection): Promise<void> {
    this.store.set(connection.id, connection);

    const key = this.buildKey(
      connection.provider.value,
      connection.providerUserId
    );
    this.providerIndex.set(key, connection);
  }

  /**
   * Busca una conexión por proveedor y providerUserId.
   * Utilizado en el callback OAuth para identificar usuarios existentes.
   */
  public async findByProviderUserId(
    provider: string,
    providerUserId: string
  ): Promise<OAuthConnection | null> {
    const key = this.buildKey(provider, providerUserId);
    return this.providerIndex.get(key) ?? null;
  }

  /**
   * Obtiene todas las conexiones OAuth de un usuario.
   */
  public async findByUserId(userId: string): Promise<OAuthConnection[]> {
    const result: OAuthConnection[] = [];
    for (const connection of this.store.values()) {
      if (connection.userId.value === userId) {
        result.push(connection);
      }
    }
    return result;
  }

  /**
   * Obtiene todas las conexiones OAuth de un conjunto de usuarios.
   */
  public async findByUserIds(userIds: string[]): Promise<OAuthConnection[]> {
    const idSet = new Set(userIds);
    const result: OAuthConnection[] = [];
    for (const connection of this.store.values()) {
      if (idSet.has(connection.userId.value)) {
        result.push(connection);
      }
    }
    return result;
  }

  public async countByProvider(): Promise<{ google: number; microsoft: number }> {
    const googleUsers = new Set<string>();
    const microsoftUsers = new Set<string>();
    for (const conn of this.store.values()) {
      if (conn.provider.value === 'google') googleUsers.add(conn.userId.value);
      if (conn.provider.value === 'microsoft') microsoftUsers.add(conn.userId.value);
    }
    return { google: googleUsers.size, microsoft: microsoftUsers.size };
  }

  // ============================================
  // HELPERS
  // ============================================

  private buildKey(provider: string, providerUserId: string): string {
    return `${provider}:${providerUserId}`;
  }
}
