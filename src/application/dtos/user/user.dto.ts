/**
 * ============================================
 * DTO: User
 * ============================================
 *
 * DTOs para representación de usuarios.
 * Diferentes vistas según el contexto.
 */

/**
 * DTO público de usuario.
 * Información segura para mostrar a otros usuarios.
 */
export interface PublicUserDto {
  /**
   * ID del usuario.
   */
  readonly id: string;

  /**
   * Nombre para mostrar.
   */
  readonly displayName: string;

  /**
   * Fecha de registro.
   */
  readonly memberSince: string;
}

/**
 * DTO privado de usuario.
 * Información completa para el propio usuario.
 */
export interface PrivateUserDto {
  /**
   * ID del usuario.
   */
  readonly id: string;

  /**
   * Email del usuario.
   */
  readonly email: string;

  /**
   * Nombre.
   */
  readonly firstName: string;

  /**
   * Apellido.
   */
  readonly lastName: string;

  /**
   * Nombre completo.
   */
  readonly fullName: string;

  /**
   * Estado de la cuenta.
   */
  readonly status: string;

  /**
   * ¿Email verificado?
   */
  readonly emailVerified: boolean;

  /**
   * Fecha de verificación del email.
   */
  readonly emailVerifiedAt: string | null;

  /**
   * Fecha de creación.
   */
  readonly createdAt: string;

  /**
   * Fecha de última actualización.
   */
  readonly updatedAt: string;

  /**
   * Fecha del último login.
   */
  readonly lastLoginAt: string | null;
}

/**
 * DTO para actualización de perfil.
 */
export interface UpdateUserProfileRequestDto {
  /**
   * Nuevo nombre (opcional).
   */
  readonly firstName?: string;

  /**
   * Nuevo apellido (opcional).
   */
  readonly lastName?: string;
}

/**
 * DTO de respuesta para actualización de perfil.
 */
export interface UpdateUserProfileResponseDto {
  /**
   * Éxito de la operación.
   */
  readonly success: boolean;

  /**
   * Mensaje descriptivo.
   */
  readonly message: string;

  /**
   * Datos actualizados del usuario.
   */
  readonly user: PrivateUserDto;
}
