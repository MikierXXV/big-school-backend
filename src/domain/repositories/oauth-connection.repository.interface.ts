/**
 * ============================================
 * REPOSITORY INTERFACE: OAuthConnection
 * ============================================
 *
 * Puerto (interfaz) para el repositorio de conexiones OAuth.
 * Las implementaciones concretas están en la capa de infraestructura.
 *
 * DEPENDENCY RULE: Esta interfaz vive en Domain y NO importa nada
 * de capas externas.
 */

import { OAuthConnection } from '../entities/oauth-connection.entity.js';

/**
 * Contrato para el repositorio de OAuthConnection.
 */
export interface IOAuthConnectionRepository {
  /**
   * Persiste una nueva conexión OAuth.
   * @param connection - La conexión a guardar
   */
  save(connection: OAuthConnection): Promise<void>;

  /**
   * Busca una conexión por proveedor y ID de usuario del proveedor.
   * Utilizado durante el flujo de callback para identificar usuarios existentes.
   *
   * @param provider - Nombre del proveedor ('google', 'microsoft')
   * @param providerUserId - ID del usuario en el proveedor
   * @returns La conexión si existe, null si no
   */
  findByProviderUserId(
    provider: string,
    providerUserId: string
  ): Promise<OAuthConnection | null>;

  /**
   * Obtiene todas las conexiones OAuth de un usuario.
   * Útil para mostrar proveedores vinculados en el perfil.
   *
   * @param userId - ID del usuario local
   * @returns Array de conexiones (puede ser vacío)
   */
  findByUserId(userId: string): Promise<OAuthConnection[]>;
}
