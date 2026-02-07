/**
 * ============================================
 * REPOSITORY INTERFACE: PasswordResetTokenRepository
 * ============================================
 *
 * Define el contrato para la persistencia de Password Reset Tokens.
 *
 * RESPONSABILIDADES:
 * - Almacenar tokens de recuperación de contraseña
 * - Buscar tokens por hash o por usuario
 * - Marcar tokens como usados
 * - Revocar tokens anteriores al generar uno nuevo
 * - Limpiar tokens expirados
 *
 * SEGURIDAD:
 * - Almacenar HASH del token, no el valor real
 * - Tokens de un solo uso
 * - Nueva solicitud invalida tokens anteriores
 * - Expiración corta (30 minutos)
 */

import {
  PasswordResetToken,
  PasswordResetTokenStatus,
} from '../value-objects/password-reset-token.value-object.js';
import { UserId } from '../value-objects/user-id.value-object.js';

/**
 * Interfaz del repositorio de password reset tokens.
 * Port de salida para persistencia de tokens de recuperación.
 */
export interface PasswordResetTokenRepository {
  // ============================================
  // COMANDOS (modifican estado)
  // ============================================

  /**
   * Guarda un nuevo password reset token.
   *
   * @param token - PasswordResetToken a guardar
   * @param tokenHash - Hash SHA-256 del valor del token
   * @returns Promise<void>
   *
   * SEGURIDAD: Se guarda el hash, no el valor real del token.
   */
  save(token: PasswordResetToken, tokenHash: string): Promise<void>;

  /**
   * Marca un token como usado.
   * Previene el reuso del mismo token.
   *
   * @param tokenId - ID del token
   * @param usedAt - Fecha de uso
   * @returns Promise<void>
   */
  markAsUsed(tokenId: string, usedAt: Date): Promise<void>;

  /**
   * Actualiza el estado de un token.
   *
   * @param tokenId - ID del token
   * @param status - Nuevo estado
   * @returns Promise<void>
   */
  updateStatus(tokenId: string, status: PasswordResetTokenStatus): Promise<void>;

  /**
   * Revoca todos los tokens activos de un usuario.
   * Se usa cuando se genera un nuevo token (invalida anteriores).
   *
   * @param userId - ID del usuario
   * @param revokedAt - Fecha de revocación
   * @returns Promise<number> - Cantidad de tokens revocados
   */
  revokeAllByUser(userId: UserId, revokedAt: Date): Promise<number>;

  /**
   * Elimina tokens expirados (limpieza periódica).
   *
   * @param olderThan - Eliminar tokens expirados antes de esta fecha
   * @returns Promise<number> - Cantidad de tokens eliminados
   */
  deleteExpired(olderThan: Date): Promise<number>;

  // ============================================
  // QUERIES (solo lectura)
  // ============================================

  /**
   * Busca un token por su ID único.
   *
   * @param tokenId - ID del token
   * @returns Promise<PasswordResetToken | null>
   */
  findById(tokenId: string): Promise<PasswordResetToken | null>;

  /**
   * Busca un token por su hash.
   * Usado para validar un token recibido.
   *
   * @param tokenHash - Hash SHA-256 del valor del token
   * @returns Promise<PasswordResetToken | null>
   */
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;

  /**
   * Busca el token activo más reciente de un usuario.
   * Puede no existir si no hay solicitudes pendientes.
   *
   * @param userId - ID del usuario
   * @returns Promise<PasswordResetToken | null>
   */
  findActiveByUserId(userId: UserId): Promise<PasswordResetToken | null>;

  /**
   * Verifica si existe un token activo para el usuario.
   *
   * @param userId - ID del usuario
   * @returns Promise<boolean>
   */
  hasActiveToken(userId: UserId): Promise<boolean>;

  /**
   * Cuenta la cantidad de solicitudes de reset en un período.
   * Útil para rate limiting.
   *
   * @param userId - ID del usuario
   * @param since - Desde qué fecha contar
   * @returns Promise<number>
   */
  countRequestsSince(userId: UserId, since: Date): Promise<number>;
}
