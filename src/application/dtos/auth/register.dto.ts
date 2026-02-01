/**
 * ============================================
 * DTO: Register User
 * ============================================
 *
 * DTOs para el caso de uso de registro de usuarios.
 */

/**
 * DTO de entrada para registro de usuario.
 * Datos requeridos para crear una nueva cuenta.
 */
export interface RegisterUserRequestDto {
  /**
   * Email del usuario.
   * Debe ser único y tener formato válido.
   */
  readonly email: string;

  /**
   * Contraseña en texto plano.
   * Será hasheada antes de almacenarse.
   *
   * REQUISITOS MÍNIMOS (a validar):
   * - Mínimo 8 caracteres
   * - Al menos una mayúscula
   * - Al menos una minúscula
   * - Al menos un número
   * - Al menos un carácter especial
   */
  readonly password: string;

  /**
   * Confirmación de contraseña.
   * Debe coincidir con password.
   */
  readonly passwordConfirmation: string;

  /**
   * Nombre del usuario.
   */
  readonly firstName: string;

  /**
   * Apellido del usuario.
   */
  readonly lastName: string;

  /**
   * Aceptación de términos y condiciones.
   * Debe ser true para completar el registro.
   */
  readonly acceptTerms: boolean;
}

/**
 * DTO de respuesta para registro exitoso.
 * NO incluye tokens - el usuario debe hacer login
 * después de verificar el email (o según política).
 */
export interface RegisterUserResponseDto {
  /**
   * Indica si el registro fue exitoso.
   */
  readonly success: boolean;

  /**
   * Mensaje descriptivo.
   */
  readonly message: string;

  /**
   * Datos del usuario creado.
   */
  readonly user: RegisteredUserDto;
}

/**
 * Datos del usuario recién registrado.
 * Información segura para devolver al cliente.
 */
export interface RegisteredUserDto {
  /**
   * ID del usuario creado.
   */
  readonly id: string;

  /**
   * Email del usuario.
   */
  readonly email: string;

  /**
   * Nombre completo.
   */
  readonly fullName: string;

  /**
   * Estado del usuario (siempre PENDING_VERIFICATION al registrar).
   */
  readonly status: string;

  /**
   * Fecha de creación.
   */
  readonly createdAt: string;

  /**
   * ¿Requiere verificación de email?
   */
  readonly requiresEmailVerification: boolean;
}
