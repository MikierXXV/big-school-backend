/**
 * ============================================
 * PORT: IEmailService
 * ============================================
 *
 * Puerto (interfaz) para el servicio de envío de emails.
 * Los adaptadores concretos (Resend, SMTP, etc.) implementan esta interfaz.
 */

/**
 * Opciones para el email de verificación de cuenta.
 */
export interface SendVerificationEmailOptions {
  /** Dirección de destino */
  readonly to: string;
  /** Nombre del usuario para personalización */
  readonly firstName: string;
  /** URL completa con el token de verificación */
  readonly verificationLink: string;
}

/**
 * Opciones para el email de recuperación de contraseña.
 */
export interface SendPasswordResetEmailOptions {
  /** Dirección de destino */
  readonly to: string;
  /** Nombre del usuario para personalización */
  readonly firstName: string;
  /** URL completa con el token de reset */
  readonly resetLink: string;
}

/**
 * Puerto de envío de emails transaccionales.
 */
export interface IEmailService {
  /**
   * Envía el email de verificación de cuenta al usuario recién registrado.
   */
  sendVerificationEmail(options: SendVerificationEmailOptions): Promise<void>;

  /**
   * Envía el email de recuperación de contraseña.
   */
  sendPasswordResetEmail(options: SendPasswordResetEmailOptions): Promise<void>;
}
