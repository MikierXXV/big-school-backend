/**
 * ============================================
 * UNIT TEST: AuthMiddleware
 * ============================================
 *
 * Tests para el middleware de autenticación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthMiddleware, extractBearerToken } from '../../../../../src/interfaces/http/middlewares/auth.middleware.js';
import { HttpRequest } from '../../../../../src/interfaces/http/controllers/auth.controller.js';
import { ITokenService } from '../../../../../src/application/ports/token.service.port.js';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let mockTokenService: {
    validateAccessToken: ReturnType<typeof vi.fn>;
  };

  const VALID_USER_ID = '123e4567-e89b-42d3-a456-426614174000';
  const VALID_EMAIL = 'test@example.com';
  const VALID_TOKEN = 'valid.jwt.token';

  beforeEach(() => {
    mockTokenService = {
      validateAccessToken: vi.fn(),
    };

    middleware = new AuthMiddleware(mockTokenService as unknown as ITokenService);
  });

  describe('authenticate()', () => {
    it('should return success with user when token is valid', async () => {
      const request: HttpRequest = {
        body: {},
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        params: {},
        query: {},
      };

      mockTokenService.validateAccessToken.mockResolvedValue({
        isValid: true,
        payload: {
          userId: VALID_USER_ID,
          email: VALID_EMAIL,
        },
      });

      const result = await middleware.authenticate(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.userId).toBe(VALID_USER_ID);
        expect(result.user.email).toBe(VALID_EMAIL);
      }
    });

    it('should extract token from Authorization header with "Bearer" prefix', async () => {
      const request: HttpRequest = {
        body: {},
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        params: {},
        query: {},
      };

      mockTokenService.validateAccessToken.mockResolvedValue({
        isValid: true,
        payload: { userId: VALID_USER_ID, email: VALID_EMAIL },
      });

      await middleware.authenticate(request);

      expect(mockTokenService.validateAccessToken).toHaveBeenCalledWith(VALID_TOKEN);
    });

    it('should return 401 when Authorization header is missing', async () => {
      const request: HttpRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
      };

      const result = await middleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.statusCode).toBe(401);
        expect(result.response.body.error?.message).toContain('authorization');
      }
    });

    it('should return 401 when Authorization header has wrong format', async () => {
      const request: HttpRequest = {
        body: {},
        headers: { authorization: 'InvalidFormat token' },
        params: {},
        query: {},
      };

      const result = await middleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.statusCode).toBe(401);
      }
    });

    it('should return 401 when token is invalid', async () => {
      const request: HttpRequest = {
        body: {},
        headers: { authorization: `Bearer invalid-token` },
        params: {},
        query: {},
      };

      mockTokenService.validateAccessToken.mockResolvedValue({
        isValid: false,
        error: 'invalid_signature',
      });

      const result = await middleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.statusCode).toBe(401);
      }
    });

    it('should return 401 with specific message when token is expired', async () => {
      const request: HttpRequest = {
        body: {},
        headers: { authorization: `Bearer expired-token` },
        params: {},
        query: {},
      };

      mockTokenService.validateAccessToken.mockResolvedValue({
        isValid: false,
        error: 'expired',
      });

      const result = await middleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.statusCode).toBe(401);
        expect(result.response.body.error?.message).toContain('expired');
      }
    });

    it('should return 401 with specific message when token has invalid signature', async () => {
      const request: HttpRequest = {
        body: {},
        headers: { authorization: `Bearer bad-signature-token` },
        params: {},
        query: {},
      };

      mockTokenService.validateAccessToken.mockResolvedValue({
        isValid: false,
        error: 'invalid_signature',
      });

      const result = await middleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.statusCode).toBe(401);
        expect(result.response.body.error?.message).toContain('Invalid');
      }
    });

    it('should include WWW-Authenticate header in 401 responses', async () => {
      const request: HttpRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
      };

      const result = await middleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.headers?.['WWW-Authenticate']).toBe('Bearer');
      }
    });

    it('should call tokenService.validateAccessToken with extracted token', async () => {
      const request: HttpRequest = {
        body: {},
        headers: { authorization: `Bearer my-special-token` },
        params: {},
        query: {},
      };

      mockTokenService.validateAccessToken.mockResolvedValue({
        isValid: true,
        payload: { userId: VALID_USER_ID, email: VALID_EMAIL },
      });

      await middleware.authenticate(request);

      expect(mockTokenService.validateAccessToken).toHaveBeenCalledWith('my-special-token');
    });

    it('should map token payload to AuthenticatedUser object', async () => {
      const request: HttpRequest = {
        body: {},
        headers: { authorization: `Bearer ${VALID_TOKEN}` },
        params: {},
        query: {},
      };

      mockTokenService.validateAccessToken.mockResolvedValue({
        isValid: true,
        payload: {
          userId: VALID_USER_ID,
          email: VALID_EMAIL,
        },
      });

      const result = await middleware.authenticate(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual({
          userId: VALID_USER_ID,
          email: VALID_EMAIL,
        });
      }
    });

    it('should handle malformed tokens gracefully', async () => {
      const request: HttpRequest = {
        body: {},
        headers: { authorization: `Bearer not.a.valid.jwt.format` },
        params: {},
        query: {},
      };

      mockTokenService.validateAccessToken.mockResolvedValue({
        isValid: false,
        error: 'malformed',
      });

      const result = await middleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.statusCode).toBe(401);
      }
    });
  });

  describe('extractBearerToken()', () => {
    it('should extract token from valid Bearer header', () => {
      const token = extractBearerToken('Bearer my-token');
      expect(token).toBe('my-token');
    });

    it('should return null for missing header', () => {
      const token = extractBearerToken(undefined);
      expect(token).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(extractBearerToken('Basic token')).toBeNull();
      expect(extractBearerToken('Bearertoken')).toBeNull();
      expect(extractBearerToken('token')).toBeNull();
    });

    it('should return null for empty token', () => {
      const token = extractBearerToken('Bearer ');
      expect(token).toBeNull();
    });
  });
});
