/**
 * ============================================
 * REPOSITORY INTERFACE: RefreshTokenRepository
 * ============================================
 *
 * Define el contrato para la persistencia de Refresh Tokens.
 * Necesario para implementar:
 * - Rotación de tokens (seguridad)
 * - Revocación de tokens (logout, compromiso)
 * - Detección de reuso (ataque)
 *
 * RESPONSABILIDADES:
 * - Almacenar refresh tokens
 * - Buscar tokens por ID o valor
 * - Revocar tokens individuales o por familia
 * - Limpiar tokens expirados
 *
 * SEGURIDAD:
 * - Almacenar HASH del token, no el valor real
 * - Permitir revocar toda la familia si se detecta reuso
 * - Registrar intentos de uso de tokens revocados
 */

import {
  RefreshToken,
  RefreshTokenStatus,
} from '../value-objects/refresh-token.value-object.js';
import { UserId } from '../value-objects/user-id.value-object.js';

/**
 * Interfaz del repositorio de refresh tokens.
 * Port de salida para persistencia de tokens de refresco.
 */
export interface RefreshTokenRepository {
  // ============================================
  // COMANDOS (modifican estado)
  // ============================================

  /**
   * Guarda un nuevo refresh token.
   *
   * @param token - RefreshToken a guardar
   * @returns Promise<void>
   *
   * SEGURIDAD: Almacenar hash del valor, no el valor real.
   *
   * TODO: Implementar en infraestructura
   */
  save(token: RefreshToken): Promise<void>;

  /**
   * Actualiza el estado de un refresh token.
   * Usado para marcar como ROTATED o REVOKED.
   *
   * @param tokenId - ID del token
   * @param status - Nuevo estado
   * @returns Promise<void>
   *
   * TODO: Implementar en infraestructura
   */
  updateStatus(tokenId: string, status: RefreshTokenStatus): Promise<void>;

  /**
   * Revoca un token específico.
   *
   * @param tokenId - ID del token a revocar
   * @returns Promise<void>
   *
   * TODO: Implementar en infraestructura
   */
  revoke(tokenId: string): Promise<void>;

  /**
   * Revoca todos los tokens de un usuario.
   * Usado en logout de todas las sesiones o compromiso de cuenta.
   *
   * @param userId - ID del usuario
   * @returns Promise<number> - Cantidad de tokens revocados
   *
   * TODO: Implementar en infraestructura
   */
  revokeAllByUser(userId: UserId): Promise<number>;

  /**
   * Revoca toda la familia de tokens.
   * Una "familia" comparte el mismo token raíz.
   * Usado cuando se detecta reuso de token rotado.
   *
   * @param familyRootTokenId - ID del token raíz de la familia
   * @returns Promise<number> - Cantidad de tokens revocados
   *
   * SEGURIDAD: Si un token rotado se usa de nuevo, toda la familia
   * está comprometida y debe revocarse.
   *
   * TODO: Implementar en infraestructura
   */
  revokeFamily(familyRootTokenId: string): Promise<number>;

  /**
   * Elimina tokens expirados (limpieza periódica).
   *
   * @param olderThan - Eliminar tokens expirados antes de esta fecha
   * @returns Promise<number> - Cantidad de tokens eliminados
   *
   * TODO: Implementar en infraestructura (job periódico)
   */
  deleteExpired(olderThan: Date): Promise<number>;

  // ============================================
  // QUERIES (solo lectura)
  // ============================================

  /**
   * Busca un token por su ID único.
   *
   * @param tokenId - ID del token
   * @returns Promise<RefreshToken | null>
   *
   * TODO: Implementar en infraestructura
   */
  findById(tokenId: string): Promise<RefreshToken | null>;

  /**
   * Busca un token por su valor (hash).
   * Usado para validar un refresh token recibido.
   *
   * @param tokenHash - Hash del valor del token
   * @returns Promise<RefreshToken | null>
   *
   * TODO: Implementar en infraestructura
   */
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  /**
   * Obtiene todos los tokens activos de un usuario.
   * Útil para mostrar sesiones activas.
   *
   * @param userId - ID del usuario
   * @returns Promise<RefreshToken[]>
   *
   * TODO: Implementar en infraestructura
   */
  findActiveByUser(userId: UserId): Promise<RefreshToken[]>;

  /**
   * Cuenta las sesiones activas de un usuario.
   *
   * @param userId - ID del usuario
   * @returns Promise<number>
   *
   * TODO: Implementar en infraestructura
   */
  countActiveByUser(userId: UserId): Promise<number>;

  /**
   * Verifica si un token (por su valor hasheado) existe y está activo.
   *
   * @param tokenHash - Hash del valor del token
   * @returns Promise<boolean>
   *
   * TODO: Implementar en infraestructura
   */
  isActiveToken(tokenHash: string): Promise<boolean>;

  /**
   * Encuentra el token raíz de una familia.
   * Necesario para revocar toda la familia.
   *
   * @param tokenId - ID de cualquier token de la familia
   * @returns Promise<string | null> - ID del token raíz
   *
   * TODO: Implementar en infraestructura (traversar parentTokenId)
   */
  findFamilyRootId(tokenId: string): Promise<string | null>;
}
