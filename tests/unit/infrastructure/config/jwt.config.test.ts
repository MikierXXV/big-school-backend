/**
 * ============================================
 * UNIT TEST: JWT Configuration
 * ============================================
 *
 * Tests para la configuración de JWT.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadJwtConfig,
  isValidJwtSecret,
  TOKEN_EXPIRATION,
} from '../../../../src/infrastructure/config/jwt.config.js';

describe('JWT Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment for each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('TOKEN_EXPIRATION constants', () => {
    it('should have ACCESS_TOKEN expiration of 5 hours (18000 seconds)', () => {
      expect(TOKEN_EXPIRATION.ACCESS_TOKEN).toBe(18000);
    });

    it('should have REFRESH_TOKEN expiration of 3 days (259200 seconds)', () => {
      expect(TOKEN_EXPIRATION.REFRESH_TOKEN).toBe(259200);
    });
  });

  describe('isValidJwtSecret()', () => {
    it('should return true for secret >= 32 characters', () => {
      const validSecret = 'a'.repeat(32);
      expect(isValidJwtSecret(validSecret)).toBe(true);
    });

    it('should return false for secret < 32 characters', () => {
      const shortSecret = 'a'.repeat(31);
      expect(isValidJwtSecret(shortSecret)).toBe(false);
    });

    it('should accept custom minimum length', () => {
      const secret = 'a'.repeat(20);
      expect(isValidJwtSecret(secret, 20)).toBe(true);
      expect(isValidJwtSecret(secret, 21)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidJwtSecret('')).toBe(false);
    });
  });

  describe('loadJwtConfig()', () => {
    const validAccessSecret = 'access-secret-that-is-at-least-32-chars-long';
    const validRefreshSecret = 'refresh-secret-that-is-at-least-32-chars-long';

    it('should load config from environment variables', () => {
      process.env.JWT_ACCESS_SECRET = validAccessSecret;
      process.env.JWT_REFRESH_SECRET = validRefreshSecret;

      const config = loadJwtConfig();

      expect(config.accessToken.secret).toBe(validAccessSecret);
      expect(config.refreshToken.secret).toBe(validRefreshSecret);
    });

    it('should use default expiration times', () => {
      process.env.JWT_ACCESS_SECRET = validAccessSecret;
      process.env.JWT_REFRESH_SECRET = validRefreshSecret;

      const config = loadJwtConfig();

      expect(config.accessToken.expirationSeconds).toBe(TOKEN_EXPIRATION.ACCESS_TOKEN);
      expect(config.refreshToken.expirationSeconds).toBe(TOKEN_EXPIRATION.REFRESH_TOKEN);
    });

    it('should allow custom expiration times from env', () => {
      process.env.JWT_ACCESS_SECRET = validAccessSecret;
      process.env.JWT_REFRESH_SECRET = validRefreshSecret;
      process.env.JWT_ACCESS_EXPIRATION = '3600';
      process.env.JWT_REFRESH_EXPIRATION = '86400';

      const config = loadJwtConfig();

      expect(config.accessToken.expirationSeconds).toBe(3600);
      expect(config.refreshToken.expirationSeconds).toBe(86400);
    });

    it('should use default issuer and audience', () => {
      process.env.JWT_ACCESS_SECRET = validAccessSecret;
      process.env.JWT_REFRESH_SECRET = validRefreshSecret;

      const config = loadJwtConfig();

      expect(config.issuer).toBe('big-school-api');
      expect(config.audience).toBe('big-school-client');
    });

    it('should allow custom issuer and audience from env', () => {
      process.env.JWT_ACCESS_SECRET = validAccessSecret;
      process.env.JWT_REFRESH_SECRET = validRefreshSecret;
      process.env.JWT_ISSUER = 'custom-issuer';
      process.env.JWT_AUDIENCE = 'custom-audience';

      const config = loadJwtConfig();

      expect(config.issuer).toBe('custom-issuer');
      expect(config.audience).toBe('custom-audience');
    });

    it('should use HS256 algorithm by default', () => {
      process.env.JWT_ACCESS_SECRET = validAccessSecret;
      process.env.JWT_REFRESH_SECRET = validRefreshSecret;

      const config = loadJwtConfig();

      expect(config.accessToken.algorithm).toBe('HS256');
      expect(config.refreshToken.algorithm).toBe('HS256');
    });

    it('should throw error if JWT_ACCESS_SECRET is missing', () => {
      process.env.JWT_REFRESH_SECRET = validRefreshSecret;
      delete process.env.JWT_ACCESS_SECRET;

      expect(() => loadJwtConfig()).toThrow('JWT_ACCESS_SECRET');
    });

    it('should throw error if JWT_REFRESH_SECRET is missing', () => {
      process.env.JWT_ACCESS_SECRET = validAccessSecret;
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => loadJwtConfig()).toThrow('JWT_REFRESH_SECRET');
    });

    it('should throw error if JWT_ACCESS_SECRET is too short', () => {
      process.env.JWT_ACCESS_SECRET = 'short';
      process.env.JWT_REFRESH_SECRET = validRefreshSecret;

      expect(() => loadJwtConfig()).toThrow('32 characters');
    });

    it('should throw error if JWT_REFRESH_SECRET is too short', () => {
      process.env.JWT_ACCESS_SECRET = validAccessSecret;
      process.env.JWT_REFRESH_SECRET = 'short';

      expect(() => loadJwtConfig()).toThrow('32 characters');
    });
  });
});
