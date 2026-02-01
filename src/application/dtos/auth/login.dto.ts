/**
 * ============================================
 * DTO: Login User
 * ============================================
 *
 * DTOs para el caso de uso de login.
 */

/**
 * DTO de entrada para login.
 */
export interface LoginUserRequestDto {
  /**
   * Email del usuario.
   */
  readonly email: string;

  /**
   * Contraseña en texto plano.
   */
  readonly password: string;

  /**
   * Información del dispositivo (opcional).
   * Útil para tracking de sesiones.
   */
  readonly deviceInfo?: string;

  /**
   * Recordar sesión (opcional).
   * Si true, puede extender el refresh token.
   */
  readonly rememberMe?: boolean;
}

/**
 * DTO de respuesta para login exitoso.
 * Incluye ambos tokens y datos básicos del usuario.
 */
export interface LoginUserResponseDto {
  /**
   * Indica si el login fue exitoso.
   */
  readonly success: boolean;

  /**
   * Mensaje descriptivo.
   */
  readonly message: string;

  /**
   * Datos del usuario autenticado.
   */
  readonly user: AuthenticatedUserDto;

  /**
   * Tokens de autenticación.
   */
  readonly tokens: TokenPairDto;
}

/**
 * Datos del usuario autenticado.
 * Información segura para el cliente.
 */
export interface AuthenticatedUserDto {
  /**
   * ID del usuario.
   */
  readonly id: string;

  /**
   * Email del usuario.
   */
  readonly email: string;

  /**
   * Nombre del usuario.
   */
  readonly firstName: string;

  /**
   * Apellido del usuario.
   */
  readonly lastName: string;

  /**
   * Nombre completo.
   */
  readonly fullName: string;

  /**
   * Estado del usuario.
   */
  readonly status: string;

  /**
   * ¿Email verificado?
   */
  readonly emailVerified: boolean;

  /**
   * Fecha del último login.
   */
  readonly lastLoginAt: string | null;
}

/**
 * Par de tokens (access + refresh).
 */
export interface TokenPairDto {
  /**
   * Access token para autenticación.
   */
  readonly accessToken: string;

  /**
   * Tipo del token (siempre "Bearer").
   */
  readonly tokenType: 'Bearer';

  /**
   * Tiempo de expiración del access token en segundos.
   */
  readonly expiresIn: number;

  /**
   * Fecha de expiración del access token.
   */
  readonly expiresAt: string;

  /**
   * Refresh token para renovar la sesión.
   */
  readonly refreshToken: string;

  /**
   * Tiempo de expiración del refresh token en segundos.
   */
  readonly refreshExpiresIn: number;
}
