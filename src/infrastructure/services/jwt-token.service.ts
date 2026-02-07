/**
 * ============================================
 * SERVICE: JwtTokenService
 * ============================================
 *
 * Implementación del ITokenService usando JWT.
 * Este es el ADAPTADOR que implementa el PORT definido en aplicación.
 *
 * RESPONSABILIDADES:
 * - Generar JWT access tokens
 * - Generar refresh tokens
 * - Validar tokens
 * - Decodificar tokens
 *
 * CONFIGURACIÓN:
 * - Access Token: 5 horas, firmado con JWT_ACCESS_SECRET
 * - Refresh Token: 3 días, firmado con JWT_REFRESH_SECRET
 *
 * DEPENDENCIAS (a instalar):
 * - jsonwebtoken (o similar)
 * - crypto (built-in Node.js)
 */

import jwt from 'jsonwebtoken';

// Extract error classes from the default export (CommonJS compatibility)
const { JsonWebTokenError, TokenExpiredError } = jwt;
import { createHash } from 'crypto';
import {
  ITokenService,
  AccessTokenPayload,
  RefreshTokenPayload,
  AccessTokenValidationResult,
  RefreshTokenValidationResult,
} from '../../application/ports/token.service.port.js';
import { AccessToken } from '../../domain/value-objects/access-token.value-object.js';
import { RefreshToken, RefreshTokenStatus } from '../../domain/value-objects/refresh-token.value-object.js';
import { JwtConfig } from '../config/jwt.config.js';
import { IDateTimeService } from '../../application/ports/datetime.service.port.js';

/**
 * Implementación de ITokenService usando JWT.
 */
export class JwtTokenService implements ITokenService {
  /**
   * Configuración de JWT.
   * @private
   */
  private readonly config: JwtConfig;

  /**
   * Servicio de fecha/hora.
   * @private
   */
  private readonly dateTimeService: IDateTimeService;

  /**
   * Constructor con inyección de dependencias.
   *
   * @param config - Configuración de JWT
   * @param dateTimeService - Servicio de fecha/hora
   */
  constructor(config: JwtConfig, dateTimeService: IDateTimeService) {
    this.config = config;
    this.dateTimeService = dateTimeService;
  }

  /**
   * Genera un access token JWT.
   *
   * @param payload - Datos a incluir en el token
   * @returns AccessToken con valor y metadatos
   *
   * TODO: Implementar usando jsonwebtoken
   */
  public async generateAccessToken(
    payload: AccessTokenPayload
  ): Promise<AccessToken> {
    const now = this.dateTimeService.now();
    const expiresAt = this.dateTimeService.addSeconds(
      this.config.accessToken.expirationSeconds
    );

    const tokenPayload = {
      sub: payload.userId,
      email: payload.email,
      ...payload.claims,
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      iss: this.config.issuer,
      aud: this.config.audience,
    };

    const token = jwt.sign(tokenPayload, this.config.accessToken.secret, {
      algorithm: this.config.accessToken.algorithm,
    });

    return AccessToken.create(token, payload.userId, now, expiresAt);
  }

  /**
   * Genera un refresh token.
   *
   * @param payload - Datos a incluir
   * @returns RefreshToken con valor y metadatos
   *
   * TODO: Implementar generación
   */
  public async generateRefreshToken(
    payload: RefreshTokenPayload
  ): Promise<RefreshToken> {
    const now = this.dateTimeService.now();
    const expiresAt = this.dateTimeService.addSeconds(
      this.config.refreshToken.expirationSeconds
    );

    const tokenPayload = {
      sub: payload.userId,
      jti: payload.tokenId,
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const token = jwt.sign(tokenPayload, this.config.refreshToken.secret, {
      algorithm: this.config.refreshToken.algorithm,
    });

    // Use fromPersistence to support both initial and rotated tokens
    return RefreshToken.fromPersistence(token, {
      tokenId: payload.tokenId,
      userId: payload.userId,
      issuedAt: now,
      expiresAt,
      parentTokenId: payload.parentTokenId ?? null,
      status: RefreshTokenStatus.ACTIVE,
      deviceInfo: payload.deviceInfo,
    });
  }

  /**
   * Valida un access token.
   *
   * @param token - Token a validar
   * @returns Resultado de validación
   *
   * TODO: Implementar validación
   */
  public async validateAccessToken(
    token: string
  ): Promise<AccessTokenValidationResult> {
    try {
      const decoded = jwt.verify(token, this.config.accessToken.secret, {
        algorithms: [this.config.accessToken.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience,
      }) as Record<string, unknown>;

      // Extract standard claims
      const { sub, email, iat, exp, iss, aud, ...customClaims } = decoded;

      return {
        isValid: true,
        payload: {
          userId: sub as string,
          email: email as string,
          // Include any custom claims (like purpose, tokenId)
          claims: Object.keys(customClaims).length > 0 ? customClaims : undefined,
        },
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return { isValid: false, error: 'expired' };
      }
      if (error instanceof JsonWebTokenError) {
        // JsonWebTokenError covers malformed and invalid signature
        if ((error.message || '').includes('malformed')) {
          return { isValid: false, error: 'malformed' };
        }
        return { isValid: false, error: 'invalid_signature' };
      }
      return { isValid: false, error: 'unknown' };
    }
  }

  /**
   * Valida un refresh token.
   *
   * @param token - Token a validar
   * @returns Resultado de validación
   *
   * TODO: Implementar validación
   */
  public async validateRefreshToken(
    token: string
  ): Promise<RefreshTokenValidationResult> {
    try {
      const decoded = jwt.verify(token, this.config.refreshToken.secret, {
        algorithms: [this.config.refreshToken.algorithm],
      }) as Record<string, unknown>;

      return {
        isValid: true,
        payload: {
          userId: decoded.sub as string,
          tokenId: decoded.jti as string,
        },
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return { isValid: false, error: 'expired' };
      }
      if (error instanceof JsonWebTokenError) {
        if ((error.message || '').includes('malformed')) {
          return { isValid: false, error: 'malformed' };
        }
        return { isValid: false, error: 'invalid_signature' };
      }
      return { isValid: false, error: 'unknown' };
    }
  }

  /**
   * Decodifica un access token sin validar.
   *
   * @param token - Token a decodificar
   * @returns Payload o null
   *
   * TODO: Implementar decodificación
   */
  public decodeAccessToken(token: string): AccessTokenPayload | null {
    try {
      if (!token) {
        return null;
      }
      const decoded = jwt.decode(token);
      if (!decoded || typeof decoded === 'string') {
        return null;
      }
      return {
        userId: decoded.sub as string,
        email: decoded.email as string,
      };
    } catch {
      return null;
    }
  }

  /**
   * Hashea un refresh token para almacenamiento.
   *
   * @param tokenValue - Valor del token
   * @returns Hash del token
   *
   * TODO: Implementar hashing con crypto
   */
  public async hashRefreshToken(tokenValue: string): Promise<string> {
    return createHash('sha256').update(tokenValue).digest('hex');
  }
}
