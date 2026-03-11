/**
 * ============================================
 * VALUE OBJECT: OAuthProvider
 * ============================================
 *
 * Representa un proveedor de OAuth soportado.
 *
 * REGLAS DE NEGOCIO:
 * - Solo se admiten proveedores registrados: 'google', 'microsoft'
 * - El valor es inmutable una vez creado
 */

import { DomainError } from '../errors/domain.error.js';

/** Proveedores OAuth soportados */
export type OAuthProviderValue = 'google' | 'microsoft';

const SUPPORTED_PROVIDERS: OAuthProviderValue[] = ['google', 'microsoft'];

/**
 * Error: Proveedor OAuth no soportado.
 */
export class OAuthProviderInvalidError extends DomainError {
  public readonly code = 'DOMAIN_OAUTH_PROVIDER_INVALID';

  constructor(provider: string) {
    super(
      `OAuth provider '${provider}' is not supported. Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`,
      { provider }
    );
  }
}

/**
 * Value Object que representa un proveedor OAuth.
 * Inmutable y auto-validante.
 */
export class OAuthProvider {
  private readonly _value: OAuthProviderValue;

  private constructor(value: OAuthProviderValue) {
    this._value = value;
  }

  public static create(value: string): OAuthProvider {
    if (!SUPPORTED_PROVIDERS.includes(value as OAuthProviderValue)) {
      throw new OAuthProviderInvalidError(value);
    }
    return new OAuthProvider(value as OAuthProviderValue);
  }

  public static GOOGLE(): OAuthProvider {
    return new OAuthProvider('google');
  }

  public static MICROSOFT(): OAuthProvider {
    return new OAuthProvider('microsoft');
  }

  public get value(): OAuthProviderValue {
    return this._value;
  }

  public equals(other: OAuthProvider): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
