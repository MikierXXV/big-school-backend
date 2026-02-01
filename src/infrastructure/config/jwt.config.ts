/**
 * ============================================
 * CONFIG: JWT
 * ============================================
 *
 * Configuración para JSON Web Tokens.
 *
 * IMPORTANTE - TIEMPOS DE EXPIRACIÓN:
 * - Access Token: 5 HORAS (18000 segundos)
 * - Refresh Token: 3 DÍAS (259200 segundos)
 *
 * SEGURIDAD:
 * - Usar claves diferentes para access y refresh
 * - Claves de al menos 32 caracteres
 * - Algoritmo seguro (RS256 o HS256 con clave fuerte)
 */

/**
 * Configuración de JWT.
 */
export interface JwtConfig {
  /** Configuración del Access Token */
  readonly accessToken: TokenConfig;
  /** Configuración del Refresh Token */
  readonly refreshToken: TokenConfig;
  /** Issuer del token (quien lo emite) */
  readonly issuer: string;
  /** Audience del token (para quién es) */
  readonly audience: string;
}

/**
 * Configuración individual de un tipo de token.
 */
export interface TokenConfig {
  /** Clave secreta para firmar */
  readonly secret: string;
  /** Tiempo de expiración en segundos */
  readonly expirationSeconds: number;
  /** Algoritmo de firma */
  readonly algorithm: JwtAlgorithm;
}

/**
 * Algoritmos de firma soportados.
 */
export type JwtAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';

/**
 * Tiempos de expiración predefinidos (en segundos).
 */
export const TOKEN_EXPIRATION = {
  /** 5 horas para access token */
  ACCESS_TOKEN: 18000,
  /** 3 días para refresh token */
  REFRESH_TOKEN: 259200,
} as const;

/**
 * Carga la configuración de JWT.
 *
 * @returns Configuración tipada
 *
 * TODO: Implementar carga desde env
 * TODO: Validar que las claves sean suficientemente fuertes
 */
export function loadJwtConfig(): JwtConfig {
  // TODO: Implementar
  // const accessSecret = process.env.JWT_ACCESS_SECRET;
  // const refreshSecret = process.env.JWT_REFRESH_SECRET;
  //
  // if (!accessSecret || accessSecret.length < 32) {
  //   throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  // }
  // if (!refreshSecret || refreshSecret.length < 32) {
  //   throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
  // }
  //
  // return {
  //   accessToken: {
  //     secret: accessSecret,
  //     expirationSeconds: parseInt(
  //       process.env.JWT_ACCESS_EXPIRATION || String(TOKEN_EXPIRATION.ACCESS_TOKEN),
  //       10
  //     ),
  //     algorithm: 'HS256',
  //   },
  //   refreshToken: {
  //     secret: refreshSecret,
  //     expirationSeconds: parseInt(
  //       process.env.JWT_REFRESH_EXPIRATION || String(TOKEN_EXPIRATION.REFRESH_TOKEN),
  //       10
  //     ),
  //     algorithm: 'HS256',
  //   },
  //   issuer: process.env.JWT_ISSUER || 'big-school-api',
  //   audience: process.env.JWT_AUDIENCE || 'big-school-client',
  // };

  // Placeholder
  throw new Error('loadJwtConfig not implemented');
}

/**
 * Valida que una clave JWT sea suficientemente fuerte.
 *
 * @param secret - Clave a validar
 * @param minLength - Longitud mínima (default 32)
 * @returns true si es válida
 */
export function isValidJwtSecret(secret: string, minLength = 32): boolean {
  return secret.length >= minLength;
}
