/**
 * ============================================
 * USE CASE: InitiateOAuth
 * ============================================
 *
 * Caso de uso para iniciar el flujo de autenticación OAuth.
 *
 * FLUJO:
 * 1. Validar que el proveedor es soportado
 * 2. Generar parámetro 'state' firmado (protección CSRF)
 * 3. Construir URL de autorización del proveedor
 * 4. Devolver URL y state al frontend
 *
 * SEGURIDAD:
 * - El 'state' es un JWT de 5min firmado con OAUTH_STATE_SECRET
 * - El frontend debe guardar el state y verificarlo en el callback
 */

import { IOAuthProviderService } from '../../ports/oauth-provider.service.port.js';
import { ILogger } from '../../ports/logger.port.js';
import { OAuthProvider } from '../../../domain/value-objects/oauth-provider.value-object.js';
import {
  InitiateOAuthRequestDto,
  InitiateOAuthResponseDto,
} from '../../dtos/auth/oauth.dto.js';

/**
 * Dependencias del caso de uso InitiateOAuth.
 */
export interface InitiateOAuthDependencies {
  readonly oauthProviderService: IOAuthProviderService;
  readonly logger: ILogger;
}

/**
 * Caso de uso: Iniciar flujo de autenticación OAuth.
 */
export class InitiateOAuthUseCase {
  private readonly deps: InitiateOAuthDependencies;

  constructor(deps: InitiateOAuthDependencies) {
    this.deps = deps;
  }

  /**
   * Ejecuta el inicio del flujo OAuth.
   *
   * @param request - Proveedor y redirectUri
   * @returns URL de autorización y state para verificación CSRF
   *
   * @throws OAuthProviderInvalidError si el proveedor no está soportado
   */
  public execute(request: InitiateOAuthRequestDto): InitiateOAuthResponseDto {
    this.deps.logger.info('Initiating OAuth flow', { provider: request.provider });

    // 1. Validar proveedor (lanza OAuthProviderInvalidError si no es válido)
    OAuthProvider.create(request.provider);

    // 2. Generar state firmado (JWT, exp: 5min)
    const state = this.deps.oauthProviderService.generateState(request.provider);

    // 3. Construir URL de autorización
    const authorizationUrl = this.deps.oauthProviderService.getAuthorizationUrl(
      request.provider,
      request.redirectUri,
      state
    );

    this.deps.logger.info('OAuth flow initiated', { provider: request.provider });

    return { authorizationUrl, state };
  }
}
