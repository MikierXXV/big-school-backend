/**
 * ============================================
 * DTO: OAuth
 * ============================================
 *
 * DTOs para los casos de uso de OAuth.
 * Reutiliza LoginUserResponseDto para la respuesta final
 * (la respuesta de OAuth es idéntica a la de login normal).
 */

import { LoginUserResponseDto } from './login.dto.js';

// ============================================
// INITIATE OAUTH
// ============================================

/**
 * DTO de entrada para iniciar el flujo OAuth.
 */
export interface InitiateOAuthRequestDto {
  /** Proveedor OAuth a usar ('google', 'microsoft') */
  readonly provider: string;
  /** URI de redirección donde el proveedor enviará el callback */
  readonly redirectUri: string;
}

/**
 * DTO de respuesta para el inicio del flujo OAuth.
 */
export interface InitiateOAuthResponseDto {
  /** URL completa de autorización del proveedor */
  readonly authorizationUrl: string;
  /**
   * Parámetro state firmado (JWT).
   * El frontend debe almacenarlo en sessionStorage y enviarlo en el callback.
   */
  readonly state: string;
}

// ============================================
// HANDLE OAUTH CALLBACK
// ============================================

/**
 * DTO de entrada para manejar el callback OAuth.
 */
export interface HandleOAuthCallbackRequestDto {
  /** Proveedor OAuth ('google', 'microsoft') */
  readonly provider: string;
  /** Código de autorización recibido del proveedor */
  readonly code: string;
  /** URI de redirección (debe coincidir con el usado en el authorize) */
  readonly redirectUri: string;
}

/**
 * DTO de respuesta del callback OAuth.
 * Idéntico a la respuesta de login normal (user + tokens).
 */
export type HandleOAuthCallbackResponseDto = LoginUserResponseDto;
