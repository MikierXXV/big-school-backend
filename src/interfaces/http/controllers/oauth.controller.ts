/**
 * ============================================
 * CONTROLLER: OAuthController
 * ============================================
 *
 * Controlador para endpoints de autenticación OAuth.
 *
 * ENDPOINTS:
 * - GET /auth/oauth/:provider/authorize?redirect_uri=... - Inicia flujo OAuth
 * - POST /auth/oauth/callback - Maneja callback OAuth
 *
 * RESPONSABILIDADES:
 * - Extraer datos del request
 * - Delegar al caso de uso correspondiente
 * - Verificar el state en el callback (protección CSRF)
 * - Formatear respuesta HTTP
 */

import { InitiateOAuthUseCase } from '../../../application/use-cases/auth/initiate-oauth.use-case.js';
import { HandleOAuthCallbackUseCase } from '../../../application/use-cases/auth/handle-oauth-callback.use-case.js';
import { IOAuthProviderService } from '../../../application/ports/oauth-provider.service.port.js';
import {
  InitiateOAuthRequestDto,
  InitiateOAuthResponseDto,
  HandleOAuthCallbackRequestDto,
  HandleOAuthCallbackResponseDto,
} from '../../../application/dtos/auth/oauth.dto.js';
import { HttpRequest, HttpResponse } from './auth.controller.js';

/**
 * Dependencias del OAuthController.
 */
export interface OAuthControllerDependencies {
  readonly initiateOAuthUseCase: InitiateOAuthUseCase;
  readonly handleOAuthCallbackUseCase: HandleOAuthCallbackUseCase;
  readonly oauthProviderService: IOAuthProviderService;
}

/**
 * Body del endpoint de callback OAuth.
 */
interface OAuthCallbackBody {
  provider: string;
  code: string;
  redirectUri: string;
}

/**
 * Controlador OAuth.
 * Independiente del framework HTTP.
 */
export class OAuthController {
  private readonly deps: OAuthControllerDependencies;

  constructor(deps: OAuthControllerDependencies) {
    this.deps = deps;
  }

  /**
   * Maneja GET /auth/oauth/:provider/authorize
   *
   * Query params:
   * - redirect_uri: URI donde el proveedor enviará el callback
   *
   * @returns { authorizationUrl, state }
   */
  public initiateOAuth(
    request: HttpRequest<never>
  ): HttpResponse<InitiateOAuthResponseDto> {
    const provider = request.params['provider'] ?? '';
    const redirectUri = request.query['redirect_uri'] ?? '';

    const dto: InitiateOAuthRequestDto = { provider, redirectUri };
    const result = this.deps.initiateOAuthUseCase.execute(dto);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja POST /auth/oauth/callback
   *
   * Body: { provider, code, redirectUri }
   *
   * Verifica el state (CSRF) antes de procesar el callback.
   *
   * @returns Respuesta idéntica a login normal (user + tokens)
   */
  public async handleOAuthCallback(
    request: HttpRequest<OAuthCallbackBody>
  ): Promise<HttpResponse<HandleOAuthCallbackResponseDto>> {
    const dto: HandleOAuthCallbackRequestDto = {
      provider: request.body.provider,
      code: request.body.code,
      redirectUri: request.body.redirectUri,
    };

    const result = await this.deps.handleOAuthCallbackUseCase.execute(dto);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }
}
