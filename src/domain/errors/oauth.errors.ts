/**
 * ============================================
 * DOMAIN ERRORS: OAuth
 * ============================================
 *
 * Errores relacionados con el flujo de autenticación OAuth.
 *
 * SEGURIDAD: Los mensajes no deben revelar detalles internos
 * del proveedor ni información sensible del usuario.
 */

import { DomainError } from './domain.error.js';

/**
 * Error: Error genérico del proveedor OAuth.
 * Se lanza cuando el proveedor devuelve un error durante el flujo.
 */
export class OAuthProviderError extends DomainError {
  public readonly code = 'DOMAIN_OAUTH_PROVIDER_ERROR';

  constructor(provider: string, reason?: string) {
    super(
      `OAuth authentication with ${provider} failed`,
      { provider, reason }
    );
  }
}

/**
 * Error: State OAuth inválido o expirado.
 * Se lanza cuando el parámetro 'state' no puede verificarse.
 *
 * SEGURIDAD: Protección CSRF. Si el state no coincide, rechazar la solicitud.
 */
export class OAuthInvalidStateError extends DomainError {
  public readonly code = 'DOMAIN_OAUTH_INVALID_STATE';

  constructor(reason?: string) {
    super(
      `Invalid or expired OAuth state parameter`,
      { reason }
    );
  }
}

/**
 * Error: El proveedor OAuth no devolvió email del usuario.
 * Algunos proveedores pueden no incluir email si el usuario no lo autorizó.
 */
export class OAuthEmailNotProvidedError extends DomainError {
  public readonly code = 'DOMAIN_OAUTH_EMAIL_NOT_PROVIDED';

  constructor(provider: string) {
    super(
      `OAuth provider '${provider}' did not provide an email address. Please ensure email access is granted.`,
      { provider }
    );
  }
}
