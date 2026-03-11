/**
 * ============================================
 * USE CASE: HandleOAuthCallback
 * ============================================
 *
 * Caso de uso para manejar el callback de autenticación OAuth.
 *
 * FLUJO:
 * 1. Intercambiar código de autorización por tokens del proveedor
 * 2. Obtener perfil del usuario desde el proveedor
 * 3. Buscar OAuthConnection existente (provider + providerUserId)
 *    a. Si existe → obtener usuario vinculado
 *    b. Si no existe → buscar por email
 *       - Si hay usuario con ese email → vincular
 *       - Si no → crear nuevo usuario (ACTIVE, emailVerified=true)
 *       - Crear OAuthConnection
 * 4. Verificar que el usuario puede hacer login (canLogin())
 * 5. Generar access token y refresh token propios
 * 6. Devolver respuesta idéntica a login normal
 *
 * SEGURIDAD:
 * - El state se verifica antes de llamar a este use case (en el controller)
 * - Los usuarios OAuth se crean como ACTIVE (proveedor ya verificó email)
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface.js';
import { IOAuthConnectionRepository } from '../../../domain/repositories/oauth-connection.repository.interface.js';
import { IOAuthProviderService } from '../../ports/oauth-provider.service.port.js';
import { ITokenService } from '../../ports/token.service.port.js';
import { IUuidGenerator } from '../../ports/uuid-generator.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { ILogger } from '../../ports/logger.port.js';
import { User } from '../../../domain/entities/user.entity.js';
import { OAuthConnection } from '../../../domain/entities/oauth-connection.entity.js';
import { Email } from '../../../domain/value-objects/email.value-object.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { OAuthProvider } from '../../../domain/value-objects/oauth-provider.value-object.js';
import { AccountLockedError } from '../../../domain/errors/authentication.errors.js';
import { UserNotActiveError } from '../../../domain/errors/user.errors.js';
import { OAuthEmailNotProvidedError } from '../../../domain/errors/oauth.errors.js';
import { AccessToken } from '../../../domain/value-objects/access-token.value-object.js';
import { RefreshToken } from '../../../domain/value-objects/refresh-token.value-object.js';
import {
  HandleOAuthCallbackRequestDto,
  HandleOAuthCallbackResponseDto,
} from '../../dtos/auth/oauth.dto.js';

/**
 * Dependencias del caso de uso HandleOAuthCallback.
 */
export interface HandleOAuthCallbackDependencies {
  readonly userRepository: UserRepository;
  readonly refreshTokenRepository: RefreshTokenRepository;
  readonly oauthConnectionRepository: IOAuthConnectionRepository;
  readonly oauthProviderService: IOAuthProviderService;
  readonly tokenService: ITokenService;
  readonly uuidGenerator: IUuidGenerator;
  readonly dateTimeService: IDateTimeService;
  readonly logger: ILogger;
}

/**
 * Caso de uso: Manejar callback OAuth y autenticar usuario.
 */
export class HandleOAuthCallbackUseCase {
  private readonly deps: HandleOAuthCallbackDependencies;

  constructor(deps: HandleOAuthCallbackDependencies) {
    this.deps = deps;
  }

  /**
   * Ejecuta el flujo completo de callback OAuth.
   *
   * @param request - Proveedor, código de autorización y redirectUri
   * @returns Respuesta idéntica a login normal (user + tokens)
   *
   * @throws OAuthProviderError si el intercambio de código falla
   * @throws OAuthEmailNotProvidedError si el proveedor no devuelve email
   * @throws AccountLockedError si la cuenta está bloqueada
   * @throws UserNotActiveError si el usuario está suspendido/desactivado
   */
  public async execute(
    request: HandleOAuthCallbackRequestDto
  ): Promise<HandleOAuthCallbackResponseDto> {
    this.deps.logger.info('Handling OAuth callback', { provider: request.provider });

    // 1. Intercambiar código por tokens del proveedor
    const providerTokens = await this.deps.oauthProviderService.exchangeCode(
      request.provider,
      request.code,
      request.redirectUri
    );

    // 2. Obtener perfil del usuario del proveedor
    const profile = await this.deps.oauthProviderService.getUserProfile(
      request.provider,
      providerTokens.accessToken
    );

    // Validar que el proveedor devolvió email
    if (!profile.email) {
      throw new OAuthEmailNotProvidedError(request.provider);
    }

    // 3. Buscar OAuthConnection existente
    let user = await this.findOrCreateUser(request.provider, profile);

    // 4. Verificar que la cuenta puede hacer login
    const now = this.deps.dateTimeService.now();

    if (user.isLockedOut(now)) {
      const remainingSeconds = user.getRemainingLockoutSeconds(now);
      this.deps.logger.warn('OAuth login failed: account locked', {
        userId: user.id.value,
        remainingSeconds,
      });
      throw new AccountLockedError(remainingSeconds);
    }

    if (!user.canLogin()) {
      throw new UserNotActiveError(user.id.value, user.status);
    }

    // 5. Generar Access Token
    const accessToken = await this.deps.tokenService.generateAccessToken({
      userId: user.id.value,
      email: user.email.value,
    });

    // 6. Generar Refresh Token
    const tokenId = this.deps.uuidGenerator.generate();
    const refreshToken = await this.deps.tokenService.generateRefreshToken({
      userId: user.id.value,
      tokenId,
    });

    // 7. Almacenar refresh token
    await this.deps.refreshTokenRepository.save(refreshToken);

    // 8. Registrar login exitoso
    const updatedUser = user.recordSuccessfulLogin(now);
    await this.deps.userRepository.update(updatedUser);

    this.deps.logger.info('OAuth login successful', {
      userId: user.id.value,
      provider: request.provider,
    });

    // 9. Retornar respuesta (idéntica a login normal)
    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id.value,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        status: user.status,
        systemRole: user.systemRole.getValue(),
        emailVerified: user.isEmailVerified(),
        lastLoginAt: updatedUser.lastLoginAt
          ? this.deps.dateTimeService.toLocalString(updatedUser.lastLoginAt)
          : null,
      },
      tokens: {
        accessToken: accessToken.value,
        tokenType: 'Bearer',
        expiresIn: AccessToken.VALIDITY_SECONDS,
        expiresAt: this.deps.dateTimeService.toLocalString(accessToken.expiresAt),
        refreshToken: refreshToken.value,
        refreshExpiresIn: RefreshToken.VALIDITY_SECONDS,
      },
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Encuentra el usuario vinculado a la conexión OAuth o lo crea.
   *
   * Estrategia:
   * 1. Busca por (provider, providerUserId) → login directo
   * 2. Busca por email → vincula conexión OAuth a cuenta existente
   * 3. Crea usuario nuevo + conexión
   */
  private async findOrCreateUser(
    provider: string,
    profile: { providerUserId: string; email: string; firstName: string; lastName: string; emailVerified: boolean }
  ): Promise<User> {
    // Paso 1: buscar conexión existente
    const existingConnection =
      await this.deps.oauthConnectionRepository.findByProviderUserId(
        provider,
        profile.providerUserId
      );

    if (existingConnection) {
      const user = await this.deps.userRepository.findById(
        existingConnection.userId
      );
      if (user) {
        this.deps.logger.info('OAuth: found existing connection', {
          userId: user.id.value,
          provider,
        });
        return user;
      }
    }

    // Paso 2: buscar usuario por email
    const email = Email.create(profile.email);
    const userByEmail = await this.deps.userRepository.findByEmail(email);

    if (userByEmail) {
      // Vincular nueva conexión OAuth al usuario existente
      await this.createOAuthConnection(provider, profile, userByEmail.id);
      this.deps.logger.info('OAuth: linked to existing user by email', {
        userId: userByEmail.id.value,
        provider,
      });
      return userByEmail;
    }

    // Paso 3: crear usuario nuevo (OAuth) + conexión
    const newUser = await this.createOAuthUser(email, profile);
    await this.createOAuthConnection(provider, profile, newUser.id);

    this.deps.logger.info('OAuth: created new user', {
      userId: newUser.id.value,
      provider,
    });

    return newUser;
  }

  /**
   * Crea un usuario nuevo para login OAuth.
   * Los usuarios OAuth se crean ACTIVE y con emailVerified=true.
   */
  private async createOAuthUser(
    email: Email,
    profile: { firstName: string; lastName: string; emailVerified: boolean }
  ): Promise<User> {
    const newUserId = UserId.fromGenerated(this.deps.uuidGenerator.generate());
    const now = this.deps.dateTimeService.now();

    // Construimos el user directamente con status ACTIVE
    // y emailVerifiedAt = now (proveedor ya verificó el email)
    const user = User.createOAuth({
      id: newUserId,
      email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      verifiedAt: now,
    });

    await this.deps.userRepository.save(user);
    return user;
  }

  /**
   * Crea y persiste una OAuthConnection.
   */
  private async createOAuthConnection(
    provider: string,
    profile: { providerUserId: string; email: string },
    userId: UserId
  ): Promise<void> {
    const connectionId = this.deps.uuidGenerator.generate();
    const connection = OAuthConnection.create({
      id: connectionId,
      userId,
      provider: OAuthProvider.create(provider),
      providerUserId: profile.providerUserId,
      providerEmail: profile.email,
    });

    await this.deps.oauthConnectionRepository.save(connection);
  }
}
