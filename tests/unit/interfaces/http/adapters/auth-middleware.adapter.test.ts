/**
 * ============================================
 * UNIT TEST: Auth Middleware Adapter
 * ============================================
 *
 * Tests para el adaptador que convierte AuthMiddleware
 * a Express middleware.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createExpressAuthMiddleware } from '../../../../../src/interfaces/http/adapters/auth-middleware.adapter.js';
import { AuthMiddleware, AuthenticatedUser } from '../../../../../src/interfaces/http/middlewares/auth.middleware.js';
import { ITokenService } from '../../../../../src/application/ports/token.service.port.js';

describe('Auth Middleware Adapter', () => {
  let mockTokenService: ITokenService;
  let authMiddleware: AuthMiddleware;
  let mockReq: Partial<Request> & { user?: AuthenticatedUser };
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let setMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTokenService = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      validateAccessToken: vi.fn(),
      validateRefreshToken: vi.fn(),
      decodeAccessToken: vi.fn(),
      hashRefreshToken: vi.fn(),
    };

    authMiddleware = new AuthMiddleware(mockTokenService);

    mockReq = {
      body: {},
      headers: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
    };

    jsonMock = vi.fn();
    setMock = vi.fn().mockReturnThis();
    statusMock = vi.fn().mockReturnValue({
      json: jsonMock,
      set: setMock,
    });
    mockRes = {
      status: statusMock,
      set: setMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  describe('createExpressAuthMiddleware()', () => {
    it('should call next() when authentication succeeds', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        isValid: true,
        payload: { userId: 'user-123', email: 'test@example.com' },
      });

      const middleware = createExpressAuthMiddleware(authMiddleware);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should attach user to request when authenticated', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        isValid: true,
        payload: { userId: 'user-123', email: 'test@example.com' },
      });

      const middleware = createExpressAuthMiddleware(authMiddleware);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('user-123');
      expect(mockReq.user?.email).toBe('test@example.com');
    });

    it('should return 401 when authorization header is missing', async () => {
      mockReq.headers = {};

      const middleware = createExpressAuthMiddleware(authMiddleware);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        isValid: false,
        error: 'invalid_signature',
      });

      const middleware = createExpressAuthMiddleware(authMiddleware);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', async () => {
      mockReq.headers = { authorization: 'Bearer expired-token' };

      (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        isValid: false,
        error: 'expired',
      });

      const middleware = createExpressAuthMiddleware(authMiddleware);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      const response = jsonMock.mock.calls[0][0];
      expect(response.error.message).toContain('expired');
    });

    it('should include WWW-Authenticate header in 401 response', async () => {
      mockReq.headers = {};

      const middleware = createExpressAuthMiddleware(authMiddleware);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(setMock).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer');
    });

    it('should return 401 when Bearer prefix is missing', async () => {
      mockReq.headers = { authorization: 'some-token-without-bearer' };

      const middleware = createExpressAuthMiddleware(authMiddleware);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle async errors gracefully', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Token service error')
      );

      const middleware = createExpressAuthMiddleware(authMiddleware);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Should call next with error for error handler to process
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
