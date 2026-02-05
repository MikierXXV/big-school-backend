/**
 * ============================================
 * DTO: Verify Email
 * ============================================
 *
 * DTOs para el caso de uso de verificación de email.
 */

/**
 * DTO de entrada para verificación de email.
 * El token es generado durante el registro y enviado por email.
 */
export interface VerifyEmailRequestDto {
  /**
   * Token de verificación.
   * JWT que contiene userId y email.
   */
  readonly token: string;
}

/**
 * DTO de respuesta para verificación exitosa.
 */
export interface VerifyEmailResponseDto {
  /**
   * Indica si la verificación fue exitosa.
   */
  readonly success: boolean;

  /**
   * Mensaje descriptivo.
   */
  readonly message: string;

  /**
   * Datos del usuario verificado.
   */
  readonly user: VerifiedUserDto;
}

/**
 * Datos del usuario después de verificar email.
 */
export interface VerifiedUserDto {
  /**
   * ID del usuario.
   */
  readonly id: string;

  /**
   * Email del usuario.
   */
  readonly email: string;

  /**
   * Estado del usuario (debería ser ACTIVE después de verificar).
   */
  readonly status: string;

  /**
   * Fecha de verificación del email.
   */
  readonly emailVerifiedAt: string;
}
