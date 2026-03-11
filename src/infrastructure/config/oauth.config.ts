/**
 * ============================================
 * CONFIG: OAuth
 * ============================================
 *
 * Configuración para los proveedores OAuth (Google y Microsoft).
 *
 * SEGURIDAD:
 * - Los client_secret NUNCA se exponen al cliente
 * - El OAUTH_STATE_SECRET debe ser de al menos 32 caracteres
 * - Los redirect URIs deben estar registrados en los portales de desarrollador
 */

/**
 * Configuración de un proveedor OAuth.
 */
export interface OAuthProviderConfig {
  /** Client ID de la app registrada en el proveedor */
  readonly clientId: string;
  /** Client Secret de la app registrada en el proveedor */
  readonly clientSecret: string;
  /** Scopes a solicitar */
  readonly scopes: string[];
  /** Tenant ID para Microsoft (usa 'common' para cuentas mixtas) */
  readonly tenantId?: string;
}

/**
 * Configuración global de OAuth.
 */
export interface OAuthConfig {
  readonly google: OAuthProviderConfig;
  readonly microsoft: OAuthProviderConfig;
  /** Clave secreta para firmar el parámetro 'state' (protección CSRF) */
  readonly stateSecret: string;
  /** Duración del state en segundos (default: 300 = 5 minutos) */
  readonly stateExpiresInSeconds: number;
}

/**
 * Carga la configuración de OAuth desde variables de entorno.
 *
 * @returns Configuración tipada de OAuth
 * @throws Error si faltan variables requeridas
 */
export function loadOAuthConfig(): OAuthConfig {
  const stateSecret = process.env.OAUTH_STATE_SECRET;
  if (!stateSecret || stateSecret.length < 32) {
    throw new Error(
      'OAUTH_STATE_SECRET environment variable is required and must be at least 32 characters'
    );
  }

  // Google credentials (requeridas si se usa Google OAuth)
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  // Microsoft credentials (requeridas si se usa Microsoft OAuth)
  const microsoftClientId = process.env.MICROSOFT_CLIENT_ID || '';
  const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
  const microsoftTenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  return {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      scopes: ['openid', 'email', 'profile'],
    },
    microsoft: {
      clientId: microsoftClientId,
      clientSecret: microsoftClientSecret,
      tenantId: microsoftTenantId,
      scopes: ['openid', 'email', 'profile', 'User.Read'],
    },
    stateSecret,
    stateExpiresInSeconds: parseInt(
      process.env.OAUTH_STATE_EXPIRES_IN || '300',
      10
    ),
  };
}
