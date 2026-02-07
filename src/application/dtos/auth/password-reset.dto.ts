/**
 * ============================================
 * DTO: Password Reset
 * ============================================
 *
 * DTOs para los casos de uso de recuperación de contraseña.
 *
 * FLUJO:
 * 1. Usuario solicita reset con su email
 * 2. Sistema genera token y "envía" email (dev: retorna token)
 * 3. Usuario confirma con token + nueva contraseña
 */

// ============================================
// REQUEST PASSWORD RESET
// ============================================

/**
 * DTO de entrada para solicitar recuperación de contraseña.
 */
export interface RequestPasswordResetRequestDto {
  /**
   * Email del usuario que solicita el reset.
   * Se valida que sea un email válido.
   */
  readonly email: string;
}

/**
 * DTO de respuesta para solicitud de reset.
 *
 * SEGURIDAD: La respuesta es siempre igual, sin importar
 * si el email existe o no (evita enumeración de emails).
 */
export interface RequestPasswordResetResponseDto {
  /**
   * Mensaje genérico de éxito.
   * Siempre indica que se enviaron instrucciones (aunque no exista el email).
   */
  readonly message: string;

  /**
   * Token de reset (SOLO en desarrollo).
   * En producción, el token se envía por email.
   */
  readonly resetToken?: string;
}

// ============================================
// CONFIRM PASSWORD RESET
// ============================================

/**
 * DTO de entrada para confirmar el cambio de contraseña.
 */
export interface ConfirmPasswordResetRequestDto {
  /**
   * Token de recuperación recibido por email.
   * JWT firmado con expiración de 30 minutos.
   */
  readonly token: string;

  /**
   * Nueva contraseña.
   * Debe cumplir requisitos de seguridad.
   */
  readonly newPassword: string;

  /**
   * Confirmación de la nueva contraseña.
   * Debe coincidir con newPassword.
   */
  readonly passwordConfirmation: string;
}

/**
 * DTO de respuesta para confirmación exitosa de reset.
 */
export interface ConfirmPasswordResetResponseDto {
  /**
   * Mensaje de éxito.
   */
  readonly message: string;

  /**
   * Datos básicos del usuario.
   */
  readonly user: PasswordResetUserDto;
}

/**
 * Datos del usuario después de resetear contraseña.
 */
export interface PasswordResetUserDto {
  /**
   * ID del usuario.
   */
  readonly id: string;

  /**
   * Email del usuario.
   */
  readonly email: string;
}
