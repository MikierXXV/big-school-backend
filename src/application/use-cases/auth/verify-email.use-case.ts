/**
 * ============================================
 * USE CASE: VerifyEmail
 * ============================================
 *
 * Caso de uso para verificación de email de usuarios.
 *
 * FLUJO:
 * 1. Validar token de verificación
 * 2. Extraer userId del payload
 * 3. Buscar usuario por ID
 * 4. Verificar que el email no esté ya verificado
 * 5. Llamar user.verifyEmail()
 * 6. Persistir usuario actualizado
 * 7. Retornar respuesta exitosa
 *
 * DEPENDENCIAS (inyectadas):
 * - UserRepository: Persistencia de usuarios
 * - TokenService: Validación de tokens
 * - DateTimeService: Fecha/hora actual
 * - Logger: Logging
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import {
  InvalidVerificationTokenError,
  VerificationTokenExpiredError,
  EmailAlreadyVerifiedError,
} from '../../../domain/errors/authentication.errors.js';
import { ITokenService } from '../../ports/token.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { ILogger } from '../../ports/logger.port.js';
import {
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
} from '../../dtos/auth/verify-email.dto.js';

/**
 * Dependencias del caso de uso VerifyEmail.
 * Inyectadas en el constructor.
 */
export interface VerifyEmailDependencies {
  readonly userRepository: UserRepository;
  readonly tokenService: ITokenService;
  readonly dateTimeService: IDateTimeService;
  readonly logger: ILogger;
}

/**
 * Caso de uso: Verificar email de usuario.
 */
export class VerifyEmailUseCase {
  /**
   * Dependencias del caso de uso.
   * @private
   */
  private readonly deps: VerifyEmailDependencies;

  /**
   * Constructor con inyección de dependencias.
   *
   * @param deps - Dependencias requeridas
   */
  constructor(deps: VerifyEmailDependencies) {
    this.deps = deps;
  }

  /**
   * Ejecuta el caso de uso de verificación de email.
   *
   * @param request - DTO con token de verificación
   * @returns DTO con resultado de la verificación
   *
   * @throws InvalidVerificationTokenError si el token es inválido
   * @throws VerificationTokenExpiredError si el token ha expirado
   * @throws UserNotFoundError si el usuario no existe
   * @throws EmailAlreadyVerifiedError si el email ya fue verificado
   */
  public async execute(
    request: VerifyEmailRequestDto
  ): Promise<VerifyEmailResponseDto> {
    // 1. Log inicio de operación
    this.deps.logger.info('Starting email verification', { tokenLength: request.token.length });

    // 2. Validar token
    const validationResult = await this.deps.tokenService.validateAccessToken(request.token);

    if (!validationResult.isValid) {
      if (validationResult.error === 'expired') {
        this.deps.logger.warn('Verification token expired');
        throw new VerificationTokenExpiredError();
      }

      this.deps.logger.warn('Invalid verification token', { error: validationResult.error });
      throw new InvalidVerificationTokenError(validationResult.error);
    }

    // 3. Extraer userId del payload
    const payload = validationResult.payload;
    if (!payload || !payload.userId) {
      this.deps.logger.warn('Verification token missing userId in payload');
      throw new InvalidVerificationTokenError('missing userId in payload');
    }

    // 4. Buscar usuario por ID
    const userId = UserId.create(payload.userId);
    const user = await this.deps.userRepository.findById(userId);

    if (!user) {
      this.deps.logger.warn('User not found for verification', { userId: payload.userId });
      throw new UserNotFoundError(payload.userId, 'id');
    }

    // 5. Verificar que el email no esté ya verificado
    if (user.isEmailVerified()) {
      this.deps.logger.warn('Email already verified', { userId: payload.userId, email: user.email.value });
      throw new EmailAlreadyVerifiedError(user.email.value);
    }

    // 6. Verificar email del usuario
    const now = this.deps.dateTimeService.now();
    const verifiedUser = user.verifyEmail(now);

    // 7. Persistir usuario actualizado
    await this.deps.userRepository.update(verifiedUser);

    // 8. Log éxito
    this.deps.logger.info('Email verified successfully', { userId: userId.value, email: verifiedUser.email.value });

    // 9. Retornar DTO de respuesta
    return {
      success: true,
      message: 'Email verified successfully. You can now log in.',
      user: {
        id: verifiedUser.id.value,
        email: verifiedUser.email.value,
        status: verifiedUser.status,
        emailVerifiedAt: verifiedUser.emailVerifiedAt!.toISOString(),
      },
    };
  }
}
