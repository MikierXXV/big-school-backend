/**
 * ============================================
 * UNIT TEST: JwtTokenService
 * ============================================
 *
 * Tests para el servicio de tokens JWT.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { JwtTokenService } from '../../../../src/infrastructure/services/jwt-token.service.js';
import { JwtConfig, TOKEN_EXPIRATION } from '../../../../src/infrastructure/config/jwt.config.js';
import { IDateTimeService } from '../../../../src/application/ports/datetime.service.port.js';
import { AccessToken } from '../../../../src/domain/value-objects/access-token.value-object.js';
import { RefreshToken } from '../../../../src/domain/value-objects/refresh-token.value-object.js';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let mockDateTimeService: IDateTimeService;
  let config: JwtConfig;

  // Use a date in the future to avoid jwt.verify rejecting tokens as expired
  const FIXED_DATE = new Date(Date.now());
  const VALID_USER_ID = '123e4567-e89b-42d3-a456-426614174000';
  const VALID_EMAIL = 'test@example.com';
  const VALID_TOKEN_ID = '987fcdeb-51a2-42d3-b456-426614174999';

  beforeEach(() => {
    config = {
      accessToken: {
        secret: 'access-secret-that-is-at-least-32-characters-long',
        expirationSeconds: TOKEN_EXPIRATION.ACCESS_TOKEN,
        algorithm: 'HS256',
      },
      refreshToken: {
        secret: 'refresh-secret-that-is-at-least-32-characters-long',
        expirationSeconds: TOKEN_EXPIRATION.REFRESH_TOKEN,
        algorithm: 'HS256',
      },
      issuer: 'test-issuer',
      audience: 'test-audience',
    };

    mockDateTimeService = {
      now: vi.fn().mockReturnValue(FIXED_DATE),
      nowTimestamp: vi.fn().mockReturnValue(FIXED_DATE.getTime()),
      nowTimestampSeconds: vi.fn().mockReturnValue(Math.floor(FIXED_DATE.getTime() / 1000)),
      addSeconds: vi.fn().mockImplementation((s) => new Date(FIXED_DATE.getTime() + s * 1000)),
      addMinutes: vi.fn().mockImplementation((m) => new Date(FIXED_DATE.getTime() + m * 60000)),
      addHours: vi.fn().mockImplementation((h) => new Date(FIXED_DATE.getTime() + h * 3600000)),
      addDays: vi.fn().mockImplementation((d) => new Date(FIXED_DATE.getTime() + d * 86400000)),
      isExpired: vi.fn().mockReturnValue(false),
      differenceInSeconds: vi.fn().mockReturnValue(0),
      toISOString: vi.fn().mockImplementation((d) => d.toISOString()),
      fromISOString: vi.fn().mockImplementation((s) => new Date(s)),
    };

    service = new JwtTokenService(config, mockDateTimeService);
  });

  describe('generateAccessToken()', () => {
    it('should return an AccessToken value object', async () => {
      const result = await service.generateAccessToken({
        userId: VALID_USER_ID,
        email: VALID_EMAIL,
      });

      expect(result).toBeInstanceOf(AccessToken);
      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('string');
    });

    it('should generate a valid JWT', async () => {
      const result = await service.generateAccessToken({
        userId: VALID_USER_ID,
        email: VALID_EMAIL,
      });

      // Should be decodable without verification
      const decoded = jwt.decode(result.value);
      expect(decoded).not.toBeNull();
    });

    it('should include userId and email in payload', async () => {
      const result = await service.generateAccessToken({
        userId: VALID_USER_ID,
        email: VALID_EMAIL,
      });

      const decoded = jwt.decode(result.value) as Record<string, unknown>;
      expect(decoded.sub).toBe(VALID_USER_ID);
      expect(decoded.email).toBe(VALID_EMAIL);
    });

    it('should include issuer and audience', async () => {
      const result = await service.generateAccessToken({
        userId: VALID_USER_ID,
        email: VALID_EMAIL,
      });

      const decoded = jwt.decode(result.value) as Record<string, unknown>;
      expect(decoded.iss).toBe(config.issuer);
      expect(decoded.aud).toBe(config.audience);
    });

    it('should set expiration to 5 hours', async () => {
      const result = await service.generateAccessToken({
        userId: VALID_USER_ID,
        email: VALID_EMAIL,
      });

      const decoded = jwt.decode(result.value) as Record<string, unknown>;
      const iat = decoded.iat as number;
      const exp = decoded.exp as number;

      expect(exp - iat).toBe(TOKEN_EXPIRATION.ACCESS_TOKEN);
    });

    it('should include custom claims if provided', async () => {
      const result = await service.generateAccessToken({
        userId: VALID_USER_ID,
        email: VALID_EMAIL,
        claims: { role: 'admin', permissions: ['read', 'write'] },
      });

      const decoded = jwt.decode(result.value) as Record<string, unknown>;
      expect(decoded.role).toBe('admin');
      expect(decoded.permissions).toEqual(['read', 'write']);
    });

    it('should set correct expiresAt on AccessToken', async () => {
      const result = await service.generateAccessToken({
        userId: VALID_USER_ID,
        email: VALID_EMAIL,
      });

      const expectedExpiry = new Date(FIXED_DATE.getTime() + TOKEN_EXPIRATION.ACCESS_TOKEN * 1000);
      expect(result.expiresAt.getTime()).toBe(expectedExpiry.getTime());
    });
  });

  describe('generateRefreshToken()', () => {
    it('should return a RefreshToken value object', async () => {
      const result = await service.generateRefreshToken({
        userId: VALID_USER_ID,
        tokenId: VALID_TOKEN_ID,
      });

      expect(result).toBeInstanceOf(RefreshToken);
      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('string');
    });

    it('should include tokenId in the token', async () => {
      const result = await service.generateRefreshToken({
        userId: VALID_USER_ID,
        tokenId: VALID_TOKEN_ID,
      });

      expect(result.tokenId).toBe(VALID_TOKEN_ID);
    });

    it('should set expiration to 3 days', async () => {
      const result = await service.generateRefreshToken({
        userId: VALID_USER_ID,
        tokenId: VALID_TOKEN_ID,
      });

      const decoded = jwt.decode(result.value) as Record<string, unknown>;
      const iat = decoded.iat as number;
      const exp = decoded.exp as number;

      expect(exp - iat).toBe(TOKEN_EXPIRATION.REFRESH_TOKEN);
    });

    it('should include parentTokenId if provided', async () => {
      const parentTokenId = 'parent-token-id';
      const result = await service.generateRefreshToken({
        userId: VALID_USER_ID,
        tokenId: VALID_TOKEN_ID,
        parentTokenId,
      });

      expect(result.parentTokenId).toBe(parentTokenId);
    });

    it('should include deviceInfo if provided', async () => {
      const deviceInfo = 'Chrome/Windows';
      const result = await service.generateRefreshToken({
        userId: VALID_USER_ID,
        tokenId: VALID_TOKEN_ID,
        deviceInfo,
      });

      expect(result.deviceInfo).toBe(deviceInfo);
    });
  });

  describe('validateAccessToken()', () => {
    it('should return isValid=true for valid token', async () => {
      const token = await service.generateAccessToken({
        userId: VALID_USER_ID,
        email: VALID_EMAIL,
      });

      const result = await service.validateAccessToken(token.value);

      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe(VALID_USER_ID);
      expect(result.payload?.email).toBe(VALID_EMAIL);
    });

    it('should return error=expired for expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { sub: VALID_USER_ID, email: VALID_EMAIL },
        config.accessToken.secret,
        {
          algorithm: config.accessToken.algorithm,
          expiresIn: -1, // Already expired
          issuer: config.issuer,
          audience: config.audience,
        }
      );

      const result = await service.validateAccessToken(expiredToken);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('expired');
    });

    it('should return error=invalid_signature for wrong secret', async () => {
      const tokenWithWrongSecret = jwt.sign(
        { sub: VALID_USER_ID, email: VALID_EMAIL },
        'wrong-secret-that-is-also-32-chars-long',
        { algorithm: 'HS256' }
      );

      const result = await service.validateAccessToken(tokenWithWrongSecret);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_signature');
    });

    it('should return error=malformed for invalid token', async () => {
      const result = await service.validateAccessToken('not-a-valid-jwt');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('malformed');
    });
  });

  describe('validateRefreshToken()', () => {
    it('should return isValid=true for valid token', async () => {
      const token = await service.generateRefreshToken({
        userId: VALID_USER_ID,
        tokenId: VALID_TOKEN_ID,
      });

      const result = await service.validateRefreshToken(token.value);

      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe(VALID_USER_ID);
      expect(result.payload?.tokenId).toBe(VALID_TOKEN_ID);
    });

    it('should return error=expired for expired token', async () => {
      const expiredToken = jwt.sign(
        { sub: VALID_USER_ID, jti: VALID_TOKEN_ID },
        config.refreshToken.secret,
        {
          algorithm: config.refreshToken.algorithm,
          expiresIn: -1,
        }
      );

      const result = await service.validateRefreshToken(expiredToken);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('expired');
    });

    it('should return error=invalid_signature for wrong secret', async () => {
      const tokenWithWrongSecret = jwt.sign(
        { sub: VALID_USER_ID, jti: VALID_TOKEN_ID },
        'wrong-secret-that-is-also-32-chars-long',
        { algorithm: 'HS256' }
      );

      const result = await service.validateRefreshToken(tokenWithWrongSecret);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_signature');
    });
  });

  describe('decodeAccessToken()', () => {
    it('should decode valid token without verifying', () => {
      const token = jwt.sign(
        { sub: VALID_USER_ID, email: VALID_EMAIL },
        config.accessToken.secret,
        { algorithm: 'HS256' }
      );

      const result = service.decodeAccessToken(token);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe(VALID_USER_ID);
      expect(result?.email).toBe(VALID_EMAIL);
    });

    it('should decode expired token', () => {
      const expiredToken = jwt.sign(
        { sub: VALID_USER_ID, email: VALID_EMAIL },
        config.accessToken.secret,
        { algorithm: 'HS256', expiresIn: -1 }
      );

      const result = service.decodeAccessToken(expiredToken);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe(VALID_USER_ID);
    });

    it('should return null for invalid token', () => {
      const result = service.decodeAccessToken('not-a-valid-jwt');

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = service.decodeAccessToken('');

      expect(result).toBeNull();
    });
  });

  describe('hashRefreshToken()', () => {
    it('should return a hash string', async () => {
      const tokenValue = 'some-token-value';

      const result = await service.hashRefreshToken(tokenValue);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return consistent hash for same input', async () => {
      const tokenValue = 'consistent-token-value';

      const hash1 = await service.hashRefreshToken(tokenValue);
      const hash2 = await service.hashRefreshToken(tokenValue);

      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different input', async () => {
      const hash1 = await service.hashRefreshToken('token-1');
      const hash2 = await service.hashRefreshToken('token-2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return SHA256 hex hash (64 characters)', async () => {
      const result = await service.hashRefreshToken('any-token');

      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
