/**
 * ============================================
 * USE CASE: ConfirmPasswordReset
 * ============================================
 *
 * Caso de uso para confirmar el cambio de contraseña.
 *
 * FLUJO:
 * 1. Validar token JWT (firma, expiración)
 * 2. Verificar propósito = 'password_reset'
 * 3. Buscar token por hash en repositorio
 * 4. Verificar token no usado/revocado
 * 5. Verificar usuario existe
 * 6. Validar fortaleza de nueva contraseña
 * 7. Actualizar contraseña del usuario
 * 8. Marcar token como usado
 * 9. Revocar todas las sesiones activas
 * 10. Retornar éxito
 *
 * SEGURIDAD:
 * - Token de un solo uso
 * - Revoca todas las sesiones tras reset
 * - Valida fortaleza de contraseña
 *
 * DEPENDENCIAS (inyectadas):
 * - UserRepository: Buscar y actualizar usuario
 * - PasswordResetTokenRepository: Gestionar tokens
 * - RefreshTokenRepository: Revocar sesiones
 * - TokenService: Validar y hashear tokens
 * - HashingService: Hashear nueva contraseña
 * - DateTimeService: Fecha/hora actual
 * - Logger: Logging de auditoría
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.interface.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { PasswordResetTokenStatus } from '../../../domain/value-objects/password-reset-token.value-object.js';
import {
  InvalidPasswordResetTokenError,
  PasswordResetTokenExpiredError,
  PasswordResetTokenAlreadyUsedError,
  WeakPasswordError,
} from '../../../domain/errors/authentication.errors.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import { PasswordMismatchError } from '../../errors/validation.errors.js';
import { ITokenService } from '../../ports/token.service.port.js';
import { IHashingService } from '../../ports/hashing.service.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { ILogger } from '../../ports/logger.port.js';
import {
  ConfirmPasswordResetRequestDto,
  ConfirmPasswordResetResponseDto,
} from '../../dtos/auth/password-reset.dto.js';

/**
 * Dependencias del caso de uso.
 */
export interface ConfirmPasswordResetDependencies {
  readonly userRepository: UserRepository;
  readonly passwordResetTokenRepository: PasswordResetTokenRepository;
  readonly refreshTokenRepository: RefreshTokenRepository;
  readonly tokenService: ITokenService;
  readonly hashingService: IHashingService;
  readonly dateTimeService: IDateTimeService;
  readonly logger: ILogger;
}

/**
 * Caso de uso: Confirmar recuperación de contraseña.
 */
export class ConfirmPasswordResetUseCase {
  private readonly deps: ConfirmPasswordResetDependencies;

  constructor(deps: ConfirmPasswordResetDependencies) {
    this.deps = deps;
  }

  /**
   * Ejecuta el caso de uso.
   *
   * @param request - DTO con token y nueva contraseña
   * @returns DTO con mensaje de éxito y datos del usuario
   *
   * @throws InvalidPasswordResetTokenError si el token es inválido
   * @throws PasswordResetTokenExpiredError si el token expiró
   * @throws PasswordResetTokenAlreadyUsedError si el token ya fue usado
   * @throws UserNotFoundError si el usuario no existe
   * @throws PasswordMismatchError si las contraseñas no coinciden
   * @throws WeakPasswordError si la contraseña es débil
   */
  public async execute(
    request: ConfirmPasswordResetRequestDto
  ): Promise<ConfirmPasswordResetResponseDto> {
    // 1. Log inicio (sin datos sensibles)
    this.deps.logger.info('Processing password reset confirmation');

    // 2. Validar que las contraseñas coincidan
    if (request.newPassword !== request.passwordConfirmation) {
      throw new PasswordMismatchError();
    }

    // 3. Validar fortaleza de contraseña
    this.validatePasswordStrength(request.newPassword);

    // 4. Validar token JWT (firma, expiración)
    const validationResult = await this.deps.tokenService.validateAccessToken(request.token);

    if (!validationResult.isValid) {
      if (validationResult.error === 'expired') {
        throw new PasswordResetTokenExpiredError();
      }
      throw new InvalidPasswordResetTokenError(validationResult.error);
    }

    // 5. Verificar propósito del token
    const payload = validationResult.payload!;
    const claims = payload.claims as Record<string, unknown> | undefined;

    if (!claims || claims['purpose'] !== 'password_reset') {
      throw new InvalidPasswordResetTokenError('invalid purpose');
    }

    const tokenId = claims['tokenId'] as string | undefined;
    if (!tokenId) {
      throw new InvalidPasswordResetTokenError('missing token ID');
    }

    // 6. Buscar token por hash en repositorio
    const tokenHash = await this.deps.tokenService.hashRefreshToken(request.token);
    const storedToken = await this.deps.passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new InvalidPasswordResetTokenError('token not found');
    }

    // 7. Verificar estado del token
    if (storedToken.status === PasswordResetTokenStatus.USED) {
      throw new PasswordResetTokenAlreadyUsedError();
    }

    if (storedToken.status === PasswordResetTokenStatus.REVOKED) {
      throw new InvalidPasswordResetTokenError('token revoked');
    }

    // 8. Buscar usuario
    const userId = UserId.create(payload.userId);
    const user = await this.deps.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(payload.userId);
    }

    // 9. Hashear nueva contraseña
    const newPasswordHash = await this.deps.hashingService.hash(request.newPassword);

    // 10. Obtener fecha actual
    const now = this.deps.dateTimeService.now();

    // 11. Actualizar contraseña del usuario
    const updatedUser = user.updatePassword(newPasswordHash, now);
    await this.deps.userRepository.update(updatedUser);

    // 13. Marcar token como usado
    await this.deps.passwordResetTokenRepository.markAsUsed(tokenId, now);

    // 14. Revocar todas las sesiones del usuario
    const revokedSessions = await this.deps.refreshTokenRepository.revokeAllByUser(userId);

    // 15. Log éxito
    this.deps.logger.info('Password reset completed successfully', {
      userId: user.id.value,
      revokedSessions,
    });

    // 14. Retornar respuesta
    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
      user: {
        id: user.id.value,
        email: user.email.value,
      },
    };
  }

  /**
   * Valida la fortaleza de la contraseña.
   *
   * @param password - Contraseña a validar
   * @throws WeakPasswordError si no cumple requisitos
   *
   * REQUISITOS:
   * - Mínimo 8 caracteres
   * - Al menos una mayúscula
   * - Al menos una minúscula
   * - Al menos un número
   * - Al menos un carácter especial
   */
  private validatePasswordStrength(password: string): void {
    const missingRequirements: string[] = [];

    if (password.length < 8) {
      missingRequirements.push('Minimum 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      missingRequirements.push('At least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      missingRequirements.push('At least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      missingRequirements.push('At least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      missingRequirements.push('At least one special character');
    }

    if (missingRequirements.length > 0) {
      throw new WeakPasswordError(missingRequirements);
    }
  }
}
