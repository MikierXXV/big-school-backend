/**
 * ============================================
 * USE CASE: RequestPasswordReset
 * ============================================
 *
 * Caso de uso para solicitar recuperación de contraseña.
 *
 * FLUJO:
 * 1. Recibir email del usuario
 * 2. Buscar usuario por email
 * 3. Si existe y está activo:
 *    - Revocar tokens anteriores
 *    - Generar nuevo token (30 min)
 *    - Guardar hash del token
 *    - "Enviar" email (dev: retornar token)
 * 4. Retornar respuesta genérica (sin revelar si existe)
 *
 * SEGURIDAD:
 * - NO revelar si el email existe
 * - Respuesta idéntica para email existente/inexistente
 * - Solo generar token para usuarios ACTIVE o PENDING_VERIFICATION
 *
 * DEPENDENCIAS (inyectadas):
 * - UserRepository: Buscar usuario
 * - PasswordResetTokenRepository: Persistir tokens
 * - TokenService: Generar y hashear tokens
 * - UuidGenerator: IDs únicos
 * - DateTimeService: Fecha/hora actual
 * - Logger: Logging de auditoría
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.interface.js';
import { Email } from '../../../domain/value-objects/email.value-object.js';
import { PasswordResetToken } from '../../../domain/value-objects/password-reset-token.value-object.js';
import { UserStatus } from '../../../domain/entities/user.entity.js';
import { ITokenService } from '../../ports/token.service.port.js';
import { IUuidGenerator } from '../../ports/uuid-generator.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { ILogger } from '../../ports/logger.port.js';
import {
  RequestPasswordResetRequestDto,
  RequestPasswordResetResponseDto,
} from '../../dtos/auth/password-reset.dto.js';

/**
 * Dependencias del caso de uso.
 */
export interface RequestPasswordResetDependencies {
  readonly userRepository: UserRepository;
  readonly passwordResetTokenRepository: PasswordResetTokenRepository;
  readonly tokenService: ITokenService;
  readonly uuidGenerator: IUuidGenerator;
  readonly dateTimeService: IDateTimeService;
  readonly logger: ILogger;
}

/**
 * Mensaje genérico de respuesta.
 * Siempre el mismo para no revelar existencia de email.
 */
const GENERIC_SUCCESS_MESSAGE =
  'If an account exists with this email, you will receive password reset instructions shortly.';

/**
 * Caso de uso: Solicitar recuperación de contraseña.
 */
export class RequestPasswordResetUseCase {
  private readonly deps: RequestPasswordResetDependencies;

  constructor(deps: RequestPasswordResetDependencies) {
    this.deps = deps;
  }

  /**
   * Ejecuta el caso de uso.
   *
   * @param request - DTO con email del usuario
   * @returns DTO con mensaje genérico (y token en desarrollo)
   */
  public async execute(
    request: RequestPasswordResetRequestDto
  ): Promise<RequestPasswordResetResponseDto> {
    // 1. Log inicio (sin datos sensibles)
    this.deps.logger.info('Processing password reset request', {
      emailDomain: request.email.split('@')[1],
    });

    // 2. Normalizar email y buscar usuario
    const email = Email.create(request.email);
    const user = await this.deps.userRepository.findByEmail(email);

    // 3. Si no existe el usuario, retornar respuesta genérica
    if (!user) {
      this.deps.logger.info('Password reset requested for non-existent email', {
        emailDomain: request.email.split('@')[1],
      });
      return {
        message: GENERIC_SUCCESS_MESSAGE,
      };
    }

    // 4. Verificar que el usuario puede resetear contraseña
    // Solo ACTIVE y PENDING_VERIFICATION pueden resetear
    if (!this.canResetPassword(user.status)) {
      this.deps.logger.info('Password reset requested for inactive user', {
        userId: user.id.value,
        status: user.status,
      });
      // Misma respuesta genérica (no revelar estado)
      return {
        message: GENERIC_SUCCESS_MESSAGE,
      };
    }

    // 5. Revocar tokens de reset anteriores
    const now = this.deps.dateTimeService.now();
    const revokedCount = await this.deps.passwordResetTokenRepository.revokeAllByUser(
      user.id,
      now
    );

    if (revokedCount > 0) {
      this.deps.logger.info('Revoked previous password reset tokens', {
        userId: user.id.value,
        count: revokedCount,
      });
    }

    // 6. Generar nuevo token
    const tokenId = this.deps.uuidGenerator.generate();
    const expiresAt = new Date(now.getTime() + PasswordResetToken.VALIDITY_MS);

    const accessToken = await this.deps.tokenService.generateAccessToken({
      userId: user.id.value,
      email: user.email.value,
      claims: {
        purpose: 'password_reset',
        tokenId,
      },
    });

    // 7. Crear value object del token
    const resetToken = PasswordResetToken.createNew(
      accessToken.value,
      tokenId,
      user.id.value,
      user.email.value,
      now,
      expiresAt
    );

    // 8. Hashear y guardar token
    const tokenHash = await this.deps.tokenService.hashRefreshToken(accessToken.value);
    await this.deps.passwordResetTokenRepository.save(resetToken, tokenHash);

    // 9. Log éxito (sin token)
    this.deps.logger.info('Password reset token generated', {
      userId: user.id.value,
      tokenId,
      expiresAt: expiresAt.toISOString(),
    });

    // 10. Retornar respuesta
    // En desarrollo incluimos el token para testing
    const isDevelopment = process.env['NODE_ENV'] !== 'production';

    return {
      message: GENERIC_SUCCESS_MESSAGE,
      ...(isDevelopment && { resetToken: accessToken.value }),
    };
  }

  /**
   * Verifica si un usuario puede resetear su contraseña.
   * Solo ACTIVE y PENDING_VERIFICATION pueden.
   */
  private canResetPassword(status: UserStatus): boolean {
    return (
      status === UserStatus.ACTIVE ||
      status === UserStatus.PENDING_VERIFICATION
    );
  }
}
