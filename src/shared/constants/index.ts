/**
 * ============================================
 * SHARED CONSTANTS
 * ============================================
 *
 * Constantes globales de la aplicación.
 */

/**
 * Constantes de autenticación.
 */
export const AUTH_CONSTANTS = {
  /**
   * Tiempo de expiración del Access Token en segundos.
   * 5 horas = 18000 segundos
   */
  ACCESS_TOKEN_EXPIRATION_SECONDS: 18000,

  /**
   * Tiempo de expiración del Refresh Token en segundos.
   * 3 días = 259200 segundos
   */
  REFRESH_TOKEN_EXPIRATION_SECONDS: 259200,

  /**
   * Longitud mínima de contraseña.
   */
  MIN_PASSWORD_LENGTH: 8,

  /**
   * Número de salt rounds para bcrypt.
   */
  BCRYPT_SALT_ROUNDS: 12,
} as const;

/**
 * Constantes de validación.
 */
export const VALIDATION_CONSTANTS = {
  /**
   * Longitud máxima de email según RFC 5321.
   */
  MAX_EMAIL_LENGTH: 254,

  /**
   * Longitud máxima de nombre.
   */
  MAX_NAME_LENGTH: 100,

  /**
   * Longitud máxima de contraseña.
   */
  MAX_PASSWORD_LENGTH: 128,
} as const;

/**
 * Headers HTTP personalizados.
 */
export const HTTP_HEADERS = {
  /**
   * Header para correlation ID.
   */
  CORRELATION_ID: 'x-correlation-id',

  /**
   * Header para request ID.
   */
  REQUEST_ID: 'x-request-id',
} as const;
