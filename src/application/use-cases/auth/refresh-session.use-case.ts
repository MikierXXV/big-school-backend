/**
 * ============================================
 * USE CASE: RefreshSession
 * ============================================
 *
 * Caso de uso para renovar la sesión usando refresh token.
 * Implementa rotación de tokens para máxima seguridad.
 *
 * FLUJO:
 * 1. Validar refresh token
 * 2. Verificar que el token está activo en BD
 * 3. Verificar que el usuario existe y está activo
 * 4. Generar nuevo access token
 * 5. Generar nuevo refresh token (ROTACIÓN)
 * 6. Marcar refresh token anterior como ROTATED
 * 7. Almacenar nuevo refresh token
 * 8. Retornar nuevos tokens
 *
 * SEGURIDAD - ROTACIÓN DE TOKENS:
 * - Cada refresh genera un NUEVO refresh token
 * - El anterior se marca como ROTATED (ya no válido)
 * - Si se detecta reuso de token ROTATED → COMPROMISO
 * - En caso de compromiso: revocar TODA la familia
 *
 * DETECCIÓN DE COMPROMISO:
 * Si un atacante roba el refresh token y lo usa, genera uno nuevo.
 * Cuando el usuario legítimo intenta usar su token (ahora ROTATED),
 * se detecta el reuso y se revoca toda la familia.
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { AccessToken } from '../../../domain/value-objects/access-token.value-object.js';
import {
  RefreshToken,
  RefreshTokenStatus,
} from '../../../domain/value-objects/refresh-token.value-object.js';
import {
  InvalidRefreshTokenError,
  RefreshTokenExpiredError,
  RefreshTokenRevokedError,
  RefreshTokenReuseDetectedError,
} from '../../../domain/errors/authentication.errors.js';
import {
  UserNotFoundError,
  UserNotActiveError,
} from '../../../domain/errors/user.errors.js';
import { ITokenService } from '../../ports/token.service.port.js';
import { IUuidGenerator } from '../../ports/uuid-generator.port.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { ILogger } from '../../ports/logger.port.js';
import {
  RefreshSessionRequestDto,
  RefreshSessionResponseDto,
} from '../../dtos/auth/refresh-session.dto.js';

/**
 * Dependencias del caso de uso RefreshSession.
 */
export interface RefreshSessionDependencies {
  readonly userRepository: UserRepository;
  readonly refreshTokenRepository: RefreshTokenRepository;
  readonly tokenService: ITokenService;
  readonly uuidGenerator: IUuidGenerator;
  readonly dateTimeService: IDateTimeService;
  readonly logger: ILogger;
}

/**
 * Caso de uso: Renovar sesión con refresh token.
 */
export class RefreshSessionUseCase {
  /**
   * Dependencias del caso de uso.
   * @private
   */
  private readonly deps: RefreshSessionDependencies;

  /**
   * Constructor con inyección de dependencias.
   *
   * @param deps - Dependencias requeridas
   */
  constructor(deps: RefreshSessionDependencies) {
    this.deps = deps;
  }

  /**
   * Ejecuta el caso de uso de refresh.
   *
   * @param request - DTO con refresh token
   * @returns DTO con nuevos tokens
   *
   * @throws InvalidRefreshTokenError si el token es inválido
   * @throws RefreshTokenExpiredError si el token expiró
   * @throws RefreshTokenRevokedError si el token fue revocado
   * @throws RefreshTokenReuseDetectedError si se detecta reuso (CRÍTICO)
   * @throws UserNotFoundError si el usuario no existe
   * @throws UserNotActiveError si el usuario está inactivo
   */
  public async execute(
    request: RefreshSessionRequestDto
  ): Promise<RefreshSessionResponseDto> {
    // 1. Log inicio de operación
    this.deps.logger.info('Session refresh attempt', { hasToken: !!request.refreshToken });

    // 2. Validar formato del refresh token
    const validationResult = await this.deps.tokenService.validateRefreshToken(
      request.refreshToken
    );
    if (!validationResult.isValid) {
      throw new InvalidRefreshTokenError(validationResult.error);
    }

    // 3. Obtener hash del token para buscar en BD
    const tokenHash = await this.deps.tokenService.hashRefreshToken(
      request.refreshToken
    );

    // 4. Buscar token en BD
    const existingToken = await this.deps.refreshTokenRepository.findByTokenHash(
      tokenHash
    );
    if (!existingToken) {
      throw new InvalidRefreshTokenError('Token not found');
    }

    // 5. CRÍTICO: Verificar si el token ya fue usado (ROTATED)
    if (existingToken.status === RefreshTokenStatus.ROTATED) {
      // ¡ALERTA DE SEGURIDAD! Reuso detectado
      this.deps.logger.error('SECURITY: Refresh token reuse detected', undefined, {
        tokenId: existingToken.tokenId,
        userId: existingToken.userId,
      });

      // Revocar toda la familia de tokens
      const familyRootId = await this.deps.refreshTokenRepository.findFamilyRootId(
        existingToken.tokenId
      );
      await this.deps.refreshTokenRepository.revokeFamily(familyRootId || existingToken.tokenId);

      throw new RefreshTokenReuseDetectedError(
        existingToken.tokenId,
        familyRootId || existingToken.tokenId
      );
    }

    // 6. Verificar si el token fue revocado
    if (existingToken.status === RefreshTokenStatus.REVOKED) {
      throw new RefreshTokenRevokedError(existingToken.tokenId);
    }

    // 7. Verificar expiración
    const now = this.deps.dateTimeService.now();
    if (existingToken.isExpired(now)) {
      throw new RefreshTokenExpiredError();
    }

    // 8. Verificar que el usuario existe y está activo
    const userId = UserId.create(existingToken.userId);
    const user = await this.deps.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(existingToken.userId);
    }

    if (!user.isActive()) {
      throw new UserNotActiveError(user.id.value, user.status);
    }

    // 9. Generar nuevo access token
    const newAccessToken = await this.deps.tokenService.generateAccessToken({
      userId: user.id.value,
      email: user.email.value,
    });

    // 10. Generar nuevo refresh token (ROTACIÓN)
    const newTokenId = this.deps.uuidGenerator.generate();
    const newRefreshToken = await this.deps.tokenService.generateRefreshToken({
      userId: user.id.value,
      tokenId: newTokenId,
      parentTokenId: existingToken.tokenId,
      deviceInfo: existingToken.deviceInfo,
    });

    // 11. Marcar token anterior como ROTATED
    await this.deps.refreshTokenRepository.updateStatus(
      existingToken.tokenId,
      RefreshTokenStatus.ROTATED
    );

    // 12. Almacenar nuevo refresh token
    await this.deps.refreshTokenRepository.save(newRefreshToken);

    // 13. Log éxito
    this.deps.logger.info('Session refreshed successfully', {
      userId: user.id.value,
      oldTokenId: existingToken.tokenId,
      newTokenId,
    });

    // 14. Retornar nuevos tokens
    return {
      success: true,
      message: 'Session refreshed successfully',
      tokens: {
        accessToken: newAccessToken.value,
        tokenType: 'Bearer',
        expiresIn: AccessToken.VALIDITY_SECONDS,
        expiresAt: newAccessToken.expiresAt.toISOString(),
        refreshToken: newRefreshToken.value,
        refreshExpiresIn: RefreshToken.VALIDITY_SECONDS,
      },
    };
  }
}
