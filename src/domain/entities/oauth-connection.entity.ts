/**
 * ============================================
 * ENTITY: OAuthConnection
 * ============================================
 *
 * Representa la vinculación entre un usuario del sistema
 * y una identidad externa (Google, Microsoft).
 *
 * RESPONSABILIDADES:
 * - Almacenar la asociación provider <-> usuario local
 * - Permitir búsqueda por providerUserId para login rápido
 *
 * REGLAS DE NEGOCIO:
 * - Un usuario puede tener múltiples OAuthConnections (una por proveedor)
 * - El par (provider, providerUserId) es único en el sistema
 * - El providerEmail se almacena para auditoría / reconciliación
 */

import { UserId } from '../value-objects/user-id.value-object.js';
import { OAuthProvider } from '../value-objects/oauth-provider.value-object.js';

/**
 * Propiedades de una OAuthConnection.
 */
export interface OAuthConnectionProps {
  readonly id: string;
  readonly userId: UserId;
  readonly provider: OAuthProvider;
  readonly providerUserId: string;
  readonly providerEmail: string;
  readonly createdAt: Date;
}

/**
 * Datos necesarios para crear una nueva OAuthConnection.
 */
export interface CreateOAuthConnectionData {
  readonly id: string;
  readonly userId: UserId;
  readonly provider: OAuthProvider;
  readonly providerUserId: string;
  readonly providerEmail: string;
}

/**
 * Entidad OAuthConnection.
 * Vincula una identidad de proveedor externo con un usuario local.
 */
export class OAuthConnection {
  private readonly _props: OAuthConnectionProps;

  private constructor(props: OAuthConnectionProps) {
    this._props = props;
  }

  // ============================================
  // FACTORY METHODS
  // ============================================

  /**
   * Crea una nueva OAuthConnection.
   */
  public static create(data: CreateOAuthConnectionData): OAuthConnection {
    const props: OAuthConnectionProps = {
      id: data.id,
      userId: data.userId,
      provider: data.provider,
      providerUserId: data.providerUserId,
      providerEmail: data.providerEmail,
      createdAt: new Date(),
    };
    return new OAuthConnection(props);
  }

  /**
   * Reconstruye una OAuthConnection desde persistencia.
   */
  public static fromPersistence(props: OAuthConnectionProps): OAuthConnection {
    return new OAuthConnection(props);
  }

  // ============================================
  // GETTERS
  // ============================================

  public get id(): string {
    return this._props.id;
  }

  public get userId(): UserId {
    return this._props.userId;
  }

  public get provider(): OAuthProvider {
    return this._props.provider;
  }

  public get providerUserId(): string {
    return this._props.providerUserId;
  }

  public get providerEmail(): string {
    return this._props.providerEmail;
  }

  public get createdAt(): Date {
    return new Date(this._props.createdAt);
  }

  // ============================================
  // EQUALITY
  // ============================================

  public equals(other: OAuthConnection): boolean {
    return this._props.id === other._props.id;
  }
}
