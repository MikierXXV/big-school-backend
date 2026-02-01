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
import { Email } from '../../../domain/value-objects/email.value-object.js';
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
   * @throws EmailNotVerifiedError si se requiere verificación
   *
   * TODO: Implementar la lógica del caso de uso
   */
  public async execute(
    request: LoginUserRequestDto
  ): Promise<LoginUserResponseDto> {
    // TODO: Implementar los siguientes pasos:

    // 1. Log inicio de operación (sin datos sensibles)
    // this.deps.logger.info('Login attempt', { email: request.email });

    // 2. Crear Value Object Email
    // const email = Email.create(request.email);

    // 3. Buscar usuario por email
    // const user = await this.deps.userRepository.findByEmail(email);

    // 4. Si no existe, lanzar error genérico (seguridad)
    // if (!user) {
    //   this.deps.logger.warn('Login failed: user not found', { email: request.email });
    //   throw new InvalidCredentialsError();
    // }

    // 5. Verificar que el usuario puede hacer login
    // if (!user.canLogin()) {
    //   if (!user.isActive()) {
    //     throw new UserNotActiveError(user.id.value, user.status);
    //   }
    //   if (!user.isEmailVerified()) {
    //     throw new EmailNotVerifiedError(user.id.value);
    //   }
    // }

    // 6. Verificar contraseña
    // const isPasswordValid = await this.deps.hashingService.verify(
    //   request.password,
    //   user.passwordHash
    // );
    // if (!isPasswordValid) {
    //   this.deps.logger.warn('Login failed: invalid password', { userId: user.id.value });
    //   throw new InvalidCredentialsError();
    // }

    // 7. Generar Access Token
    // const accessToken = await this.deps.tokenService.generateAccessToken({
    //   userId: user.id.value,
    //   email: user.email.value,
    // });

    // 8. Generar Refresh Token
    // const tokenId = this.deps.uuidGenerator.generate();
    // const refreshToken = await this.deps.tokenService.generateRefreshToken({
    //   userId: user.id.value,
    //   tokenId,
    //   deviceInfo: request.deviceInfo,
    // });

    // 9. Almacenar refresh token en BD
    // await this.deps.refreshTokenRepository.save(refreshToken);

    // 10. Actualizar lastLoginAt
    // const now = this.deps.dateTimeService.now();
    // const updatedUser = user.recordLogin(now);
    // await this.deps.userRepository.update(updatedUser);

    // 11. Log éxito
    // this.deps.logger.info('Login successful', { userId: user.id.value });

    // 12. Retornar respuesta
    // return {
    //   success: true,
    //   message: 'Login successful',
    //   user: {
    //     id: user.id.value,
    //     email: user.email.value,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     fullName: user.fullName,
    //     status: user.status,
    //     emailVerified: user.isEmailVerified(),
    //     lastLoginAt: now.toISOString(),
    //   },
    //   tokens: {
    //     accessToken: accessToken.value,
    //     tokenType: 'Bearer',
    //     expiresIn: AccessToken.VALIDITY_SECONDS,
    //     expiresAt: accessToken.expiresAt.toISOString(),
    //     refreshToken: refreshToken.value,
    //     refreshExpiresIn: RefreshToken.VALIDITY_SECONDS,
    //   },
    // };

    // Placeholder hasta implementar
    throw new Error('LoginUserUseCase not implemented');
  }
}
