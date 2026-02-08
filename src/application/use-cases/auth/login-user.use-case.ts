/**
 * ============================================
 * USE CASE: LoginUser
 * ============================================
 *
 * Caso de uso para autenticación de usuarios.
 *
 * FLUJO:
 * 1. Validar datos de entrada
 * 2. Buscar usuario por email
 * 3. Verificar que el usuario puede hacer login
 * 4. Verificar contraseña
 * 5. Generar access token
 * 6. Generar refresh token
 * 7. Almacenar refresh token
 * 8. Actualizar lastLoginAt
 * 9. Emitir evento LoginSucceeded
 * 10. Retornar tokens y datos del usuario
 *
 * SEGURIDAD:
 * - No revelar si el email existe o no
 * - Usar comparación en tiempo constante para contraseñas
 * - Emitir eventos de login fallido para detección de ataques
 *
 * TOKENS:
 * - Access Token: 5 horas
 * - Refresh Token: 3 días
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface.js';
import { UserStatus } from '../../../domain/entities/user.entity.js';
import { Email } from '../../../domain/value-objects/email.value-object.js';
import { AccessToken } from '../../../domain/value-objects/access-token.value-object.js';
import { RefreshToken } from '../../../domain/value-objects/refresh-token.value-object.js';
import {
  InvalidCredentialsError,
  AccountLockedError,
} from '../../../domain/errors/authentication.errors.js';
import { UserNotActiveError } from '../../../domain/errors/user.errors.js';
import { ITokenService } from '../../ports/token.service.port.js';
import { IHashingService } from '../../ports/hashing.service.port.js';
import { IUuidGenerator } from '../../ports/uuid-generator.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { ILogger } from '../../ports/logger.port.js';
import {
  LoginUserRequestDto,
  LoginUserResponseDto,
} from '../../dtos/auth/login.dto.js';

/**
 * Dependencias del caso de uso LoginUser.
 */
export interface LoginUserDependencies {
  readonly userRepository: UserRepository;
  readonly refreshTokenRepository: RefreshTokenRepository;
  readonly tokenService: ITokenService;
  readonly hashingService: IHashingService;
  readonly uuidGenerator: IUuidGenerator;
  readonly dateTimeService: IDateTimeService;
  readonly logger: ILogger;
}

/**
 * Caso de uso: Autenticar usuario.
 */
export class LoginUserUseCase {
  /**
   * Dependencias del caso de uso.
   * @private
   */
  private readonly deps: LoginUserDependencies;

  /**
   * Constructor con inyección de dependencias.
   *
   * @param deps - Dependencias requeridas
   */
  constructor(deps: LoginUserDependencies) {
    this.deps = deps;
  }

  /**
   * Ejecuta el caso de uso de login.
   *
   * @param request - DTO con credenciales
   * @returns DTO con tokens y datos del usuario
   *
   * @throws InvalidCredentialsError si email o contraseña son incorrectos
   * @throws UserNotActiveError si el usuario está suspendido/desactivado
   */
  public async execute(
    request: LoginUserRequestDto
  ): Promise<LoginUserResponseDto> {
    // 1. Log inicio de operación (sin datos sensibles)
    this.deps.logger.info('Login attempt', { email: request.email });

    // 2. Crear Value Object Email
    const email = Email.create(request.email);

    // 3. Buscar usuario por email
    const user = await this.deps.userRepository.findByEmail(email);

    // 4. Si no existe, lanzar error genérico (seguridad)
    if (!user) {
      this.deps.logger.warn('Login failed: user not found', { email: request.email });
      throw new InvalidCredentialsError();
    }

    // 5. Check if account is locked out
    const now = this.deps.dateTimeService.now();
    if (user.isLockedOut(now)) {
      const remainingSeconds = user.getRemainingLockoutSeconds(now);
      this.deps.logger.warn('Login failed: account locked', {
        userId: user.id.value,
        remainingSeconds,
        lockoutCount: user.lockoutCount,
      });
      throw new AccountLockedError(remainingSeconds);
    }

    // 6. Verificar contraseña
    const isPasswordValid = await this.deps.hashingService.verify(
      request.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      // Record failed login attempt and potentially lock the account
      const updatedUser = user.recordFailedLogin(now);
      await this.deps.userRepository.update(updatedUser);

      this.deps.logger.warn('Login failed: invalid password', {
        userId: user.id.value,
        failedAttempts: updatedUser.failedLoginAttempts,
        isNowLocked: updatedUser.isLockedOut(now),
      });
      throw new InvalidCredentialsError();
    }

    // 7. Verificar que el usuario puede hacer login
    if (!user.canLogin()) {
      // Si está pendiente de verificación, lanzamos error genérico para no revelar estado
      if (user.status === UserStatus.PENDING_VERIFICATION) {
        this.deps.logger.warn('Login failed: email not verified', { userId: user.id.value });
        throw new InvalidCredentialsError();
      }
      // Para usuarios suspendidos o desactivados, revelamos el estado
      throw new UserNotActiveError(user.id.value, user.status);
    }

    // 7. Generar Access Token
    const accessToken = await this.deps.tokenService.generateAccessToken({
      userId: user.id.value,
      email: user.email.value,
    });

    // 8. Generar Refresh Token
    const tokenId = this.deps.uuidGenerator.generate();
    const refreshToken = await this.deps.tokenService.generateRefreshToken({
      userId: user.id.value,
      tokenId,
      deviceInfo: request.deviceInfo,
    });

    // 9. Almacenar refresh token en BD
    await this.deps.refreshTokenRepository.save(refreshToken);

    // 10. Record successful login (resets lockout counters and updates lastLoginAt)
    const loginTime = this.deps.dateTimeService.now();
    const updatedUser = user.recordSuccessfulLogin(loginTime);
    await this.deps.userRepository.update(updatedUser);

    // 11. Log éxito
    this.deps.logger.info('Login successful', { userId: user.id.value });

    // 12. Retornar respuesta
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
        emailVerified: user.isEmailVerified(),
        lastLoginAt: updatedUser.lastLoginAt?.toISOString() ?? null,
      },
      tokens: {
        accessToken: accessToken.value,
        tokenType: 'Bearer',
        expiresIn: AccessToken.VALIDITY_SECONDS,
        expiresAt: accessToken.expiresAt.toISOString(),
        refreshToken: refreshToken.value,
        refreshExpiresIn: RefreshToken.VALIDITY_SECONDS,
      },
    };
  }
}
