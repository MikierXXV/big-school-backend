/**
 * ============================================
 * PORT: TokenService
 * ============================================
 *
 * Define el contrato para el servicio de tokens.
 * La implementación real (JWT, PASETO, etc.) está en infraestructura.
 *
 * RESPONSABILIDADES:
 * - Generar access tokens
 * - Generar refresh tokens
 * - Validar tokens
 * - Extraer información de tokens
 *
 * IMPORTANTE:
 * - La aplicación NO conoce JWT ni ninguna implementación específica
 * - Este port abstrae completamente la tecnología de tokens
 *
 * CONFIGURACIÓN DE TOKENS:
 * - Access Token: 5 horas (18000 segundos)
 * - Refresh Token: 3 días (259200 segundos)
 */

import { AccessToken } from '../../domain/value-objects/access-token.value-object.js';
import { RefreshToken } from '../../domain/value-objects/refresh-token.value-object.js';

/**
 * Payload para generar un access token.
 */
export interface AccessTokenPayload {
  /** ID del usuario */
  readonly userId: string;
  /** Email del usuario */
  readonly email: string;
  /** Claims adicionales (roles, permisos, etc.) */
  readonly claims?: Record<string, unknown>;
}

/**
 * Payload para generar un refresh token.
 */
export interface RefreshTokenPayload {
  /** ID del usuario */
  readonly userId: string;
  /** ID único del token (para tracking) */
  readonly tokenId: string;
  /** ID del token padre (para rotación) */
  readonly parentTokenId?: string;
  /** Info del dispositivo */
  readonly deviceInfo?: string;
}

/**
 * Resultado de validar un access token.
 */
export interface AccessTokenValidationResult {
  /** ¿Es válido? */
  readonly isValid: boolean;
  /** Payload si es válido */
  readonly payload?: AccessTokenPayload;
  /** Razón si es inválido */
  readonly error?: 'expired' | 'invalid_signature' | 'malformed' | 'unknown';
}

/**
 * Resultado de validar un refresh token.
 */
export interface RefreshTokenValidationResult {
  /** ¿Es válido? */
  readonly isValid: boolean;
  /** Payload si es válido */
  readonly payload?: RefreshTokenPayload;
  /** Razón si es inválido */
  readonly error?: 'expired' | 'invalid_signature' | 'malformed' | 'unknown';
}

/**
 * Port del servicio de tokens.
 * Implementado en infraestructura (ej: JwtTokenService).
 */
export interface ITokenService {
  // ============================================
  // GENERACIÓN DE TOKENS
  // ============================================

  /**
   * Genera un nuevo access token.
   *
   * @param payload - Datos para incluir en el token
   * @returns AccessToken con valor y metadatos
   *
   * CONFIGURACIÓN:
   * - Expiración: 5 horas
   * - Algoritmo: RS256 o HS256 (definido en implementación)
   *
   * TODO: Implementar en JwtTokenService
   */
  generateAccessToken(payload: AccessTokenPayload): Promise<AccessToken>;

  /**
   * Genera un nuevo refresh token.
   *
   * @param payload - Datos para incluir en el token
   * @returns RefreshToken con valor y metadatos
   *
   * CONFIGURACIÓN:
   * - Expiración: 3 días
   * - Debe ser opaco y aleatorio (no JWT necesariamente)
   *
   * TODO: Implementar en JwtTokenService
   */
  generateRefreshToken(payload: RefreshTokenPayload): Promise<RefreshToken>;

  // ============================================
  // VALIDACIÓN DE TOKENS
  // ============================================

  /**
   * Valida un access token.
   *
   * @param token - El token a validar
   * @returns Resultado de validación con payload o error
   *
   * VALIDACIONES:
   * - Firma válida
   * - No expirado
   * - Formato correcto
   * - Issuer y audience correctos
   *
   * TODO: Implementar en JwtTokenService
   */
  validateAccessToken(token: string): Promise<AccessTokenValidationResult>;

  /**
   * Valida un refresh token.
   *
   * @param token - El token a validar
   * @returns Resultado de validación con payload o error
   *
   * TODO: Implementar en JwtTokenService
   */
  validateRefreshToken(token: string): Promise<RefreshTokenValidationResult>;

  // ============================================
  // EXTRACCIÓN DE INFORMACIÓN
  // ============================================

  /**
   * Decodifica un access token SIN validar.
   * Útil para extraer información incluso de tokens expirados.
   *
   * @param token - El token a decodificar
   * @returns Payload o null si no es decodificable
   *
   * ADVERTENCIA: No usar para autenticación, solo para info.
   *
   * TODO: Implementar en JwtTokenService
   */
  decodeAccessToken(token: string): AccessTokenPayload | null;

  /**
   * Calcula el hash de un refresh token para almacenamiento.
   * El valor real del token solo lo tiene el cliente.
   *
   * @param tokenValue - Valor del token
   * @returns Hash del token
   *
   * TODO: Implementar en JwtTokenService
   */
  hashRefreshToken(tokenValue: string): Promise<string>;
}

/**
 * Símbolo para inyección de dependencias.
 * Usado para identificar la implementación concreta.
 */
export const TOKEN_SERVICE = Symbol('ITokenService');
