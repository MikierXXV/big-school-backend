/**
 * ============================================
 * DTO: Token Response (genérico)
 * ============================================
 *
 * DTOs genéricos para respuestas de tokens.
 * Usados en múltiples endpoints de autenticación.
 */

/**
 * DTO para un access token individual.
 * Útil cuando solo se devuelve el access token.
 */
export interface AccessTokenResponseDto {
  /**
   * El access token.
   */
  readonly accessToken: string;

  /**
   * Tipo del token.
   */
  readonly tokenType: 'Bearer';

  /**
   * Segundos hasta expiración.
   */
  readonly expiresIn: number;

  /**
   * ISO timestamp de expiración.
   */
  readonly expiresAt: string;
}

/**
 * DTO para información de token decodificada.
 * Datos extraídos del token (sin exponer secretos).
 */
export interface TokenInfoDto {
  /**
   * ID del usuario propietario.
   */
  readonly userId: string;

  /**
   * Email del usuario.
   */
  readonly email: string;

  /**
   * Fecha de emisión.
   */
  readonly issuedAt: string;

  /**
   * Fecha de expiración.
   */
  readonly expiresAt: string;

  /**
   * ¿Está expirado?
   */
  readonly isExpired: boolean;

  /**
   * Segundos restantes de validez.
   */
  readonly remainingSeconds: number;
}

/**
 * DTO para estado de validación de token.
 */
export interface TokenValidationResultDto {
  /**
   * ¿Es válido el token?
   */
  readonly isValid: boolean;

  /**
   * Razón si no es válido.
   */
  readonly reason?: 'expired' | 'invalid' | 'revoked' | 'malformed';

  /**
   * Info del token si es válido.
   */
  readonly tokenInfo?: TokenInfoDto;
}
