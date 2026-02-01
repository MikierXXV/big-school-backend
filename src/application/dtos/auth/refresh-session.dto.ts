/**
 * ============================================
 * DTO: Refresh Session
 * ============================================
 *
 * DTOs para el caso de uso de renovación de sesión.
 * Permite obtener un nuevo access token usando el refresh token.
 */

import { TokenPairDto } from './login.dto.js';

/**
 * DTO de entrada para refresh session.
 */
export interface RefreshSessionRequestDto {
  /**
   * Refresh token actual.
   * Será validado y rotado.
   */
  readonly refreshToken: string;
}

/**
 * DTO de respuesta para refresh exitoso.
 * Incluye nuevos tokens (el refresh token también se rota).
 */
export interface RefreshSessionResponseDto {
  /**
   * Indica si el refresh fue exitoso.
   */
  readonly success: boolean;

  /**
   * Mensaje descriptivo.
   */
  readonly message: string;

  /**
   * Nuevos tokens.
   * El refresh token SIEMPRE es nuevo (rotación).
   */
  readonly tokens: TokenPairDto;
}
