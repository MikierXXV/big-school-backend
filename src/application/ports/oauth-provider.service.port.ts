/**
 * ============================================
 * PORT: IOAuthProviderService
 * ============================================
 *
 * Interfaz (puerto) para el servicio de proveedores OAuth.
 * Abstrae las llamadas específicas a Google, Microsoft, etc.
 *
 * DEPENDENCY RULE: Esta interfaz vive en Application y NO importa
 * nada de infraestructura. La implementación concreta está en
 * src/infrastructure/services/oauth-provider.service.ts
 */

/**
 * Tokens devueltos por el proveedor OAuth tras intercambio de code.
 */
export interface OAuthProviderTokens {
  /** Access token del proveedor (para llamar a la API del proveedor) */
  readonly accessToken: string;
  /** ID token JWT (contiene claims del usuario, presente en OIDC). undefined si no aplica. */
  readonly idToken: string | undefined;
}

/**
 * Perfil de usuario obtenido del proveedor OAuth.
 */
export interface OAuthUserProfile {
  /** ID del usuario en el proveedor (estable, no cambia) */
  readonly providerUserId: string;
  /** Email del usuario (puede no estar presente si no se autorizó) */
  readonly email: string;
  /** Nombre del usuario */
  readonly firstName: string;
  /** Apellido del usuario */
  readonly lastName: string;
  /** Si el email ya está verificado por el proveedor */
  readonly emailVerified: boolean;
}

/**
 * Contrato del servicio de proveedores OAuth.
 */
export interface IOAuthProviderService {
  /**
   * Genera la URL de autorización para redirigir al usuario al proveedor.
   *
   * @param provider - Nombre del proveedor ('google', 'microsoft')
   * @param redirectUri - URI de redirección registrada en el proveedor
   * @param state - Parámetro state para protección CSRF
   * @returns URL completa de autorización
   */
  getAuthorizationUrl(
    provider: string,
    redirectUri: string,
    state: string
  ): string;

  /**
   * Intercambia el código de autorización por tokens del proveedor.
   *
   * @param provider - Nombre del proveedor
   * @param code - Código de autorización recibido en el callback
   * @param redirectUri - URI de redirección (debe coincidir con el registro)
   * @returns Tokens del proveedor
   * @throws OAuthProviderError si el intercambio falla
   */
  exchangeCode(
    provider: string,
    code: string,
    redirectUri: string
  ): Promise<OAuthProviderTokens>;

  /**
   * Obtiene el perfil del usuario usando el access token del proveedor.
   *
   * @param provider - Nombre del proveedor
   * @param accessToken - Access token del proveedor
   * @returns Perfil del usuario normalizado
   * @throws OAuthProviderError si la llamada al proveedor falla
   * @throws OAuthEmailNotProvidedError si el proveedor no devuelve email
   */
  getUserProfile(
    provider: string,
    accessToken: string
  ): Promise<OAuthUserProfile>;

  /**
   * Genera un parámetro 'state' firmado para protección CSRF.
   * Implementado como JWT de corta duración para evitar almacenamiento server-side.
   *
   * @param provider - Proveedor para incluir en el state
   * @returns State firmado (JWT, exp: 5min)
   */
  generateState(provider: string): string;

  /**
   * Verifica y decodifica el parámetro 'state'.
   *
   * @param state - El state recibido en el callback
   * @returns Payload del state (incluye provider)
   * @throws OAuthInvalidStateError si el state es inválido o expirado
   */
  verifyState(state: string): { provider: string };
}
