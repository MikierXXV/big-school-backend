/**
 * ============================================
 * UNIT TEST: App Factory
 * ============================================
 *
 * Tests para la factory que crea la aplicación Express.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, AppDependencies } from '../../../../src/interfaces/http/app.factory.js';
import { ILogger } from '../../../../src/application/ports/logger.port.js';
import { IUuidGenerator } from '../../../../src/application/ports/uuid-generator.port.js';
import { ITokenService } from '../../../../src/application/ports/token.service.port.js';

describe('App Factory', () => {
  let mockLogger: ILogger;
  let mockUuidGenerator: IUuidGenerator;
  let mockTokenService: ITokenService;
  let mockRegisterUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockLoginUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockRefreshUseCase: { execute: ReturnType<typeof vi.fn> };
  let deps: AppDependencies;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn().mockReturnThis(),
      setLevel: vi.fn(),
    };

    mockUuidGenerator = {
      generate: vi.fn().mockReturnValue('test-uuid-123'),
      isValid: vi.fn().mockReturnValue(true),
    };

    mockTokenService = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      validateAccessToken: vi.fn(),
      validateRefreshToken: vi.fn(),
      decodeAccessToken: vi.fn(),
      hashRefreshToken: vi.fn(),
    };

    mockRegisterUseCase = { execute: vi.fn() };
    mockLoginUseCase = { execute: vi.fn() };
    mockRefreshUseCase = { execute: vi.fn() };

    deps = {
      logger: mockLogger,
      uuidGenerator: mockUuidGenerator,
      tokenService: mockTokenService,
      registerUserUseCase: mockRegisterUseCase as any,
      loginUserUseCase: mockLoginUseCase as any,
      refreshSessionUseCase: mockRefreshUseCase as any,
      isProduction: false,
    };
  });

  describe('createApp()', () => {
    it('should return an Express application', () => {
      const app = createApp(deps);

      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });

    it('should configure JSON body parser', async () => {
      // Setup login to succeed
      mockLoginUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Login successful',
        user: { id: 'user-123', email: 'test@example.com' },
        tokens: {
          accessToken: 'token',
          tokenType: 'Bearer',
          expiresIn: 18000,
          expiresAt: new Date().toISOString(),
          refreshToken: 'refresh',
          refreshExpiresIn: 259200,
        },
      });

      const app = createApp(deps);

      // Send JSON to login endpoint and verify it was parsed
      await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .set('Content-Type', 'application/json');

      // Verify login use case received the parsed body
      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
        })
      );
    });

    it('should register health routes', async () => {
      const app = createApp(deps);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
    });

    it('should register health/live route', async () => {
      const app = createApp(deps);

      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('ok');
    });

    it('should register health/ready route', async () => {
      const app = createApp(deps);

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
    });

    it('should register auth routes under /auth prefix', async () => {
      // Setup login to succeed
      mockLoginUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Login successful',
        user: { id: 'user-123', email: 'test@example.com' },
        tokens: {
          accessToken: 'token',
          tokenType: 'Bearer',
          expiresIn: 18000,
          expiresAt: new Date().toISOString(),
          refreshToken: 'refresh',
          refreshExpiresIn: 259200,
        },
      });

      const app = createApp(deps);

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      // Should not be 404
      expect(response.status).not.toBe(404);
    });

    it('should apply validation middleware to auth routes', async () => {
      const app = createApp(deps);

      // Send invalid register request (missing fields)
      const response = await request(app)
        .post('/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should apply error handler middleware', async () => {
      mockLoginUseCase.execute.mockRejectedValue(new Error('Test error'));

      const app = createApp(deps);

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should generate correlation ID for requests', async () => {
      const app = createApp(deps);

      await request(app).get('/health');

      // Verify UUID generator was called
      expect(mockUuidGenerator.generate).toHaveBeenCalled();
    });

    it('should use existing correlation ID from header', async () => {
      const app = createApp(deps);
      const correlationId = 'existing-correlation-id';

      await request(app)
        .get('/health')
        .set('x-correlation-id', correlationId);

      // Logger should have been called with correlation context
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should return 404 for unknown routes', async () => {
      const app = createApp(deps);

      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });

    it('should apply auth middleware to logout route', async () => {
      (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        isValid: false,
        error: 'invalid_signature',
      });

      const app = createApp(deps);

      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'some-token' });

      expect(response.status).toBe(401);
    });

    it('should allow logout with valid token', async () => {
      (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        isValid: true,
        payload: { userId: 'user-123', email: 'test@example.com' },
      });

      const app = createApp(deps);

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .send({ refreshToken: 'some-token' });

      expect(response.status).toBe(200);
    });
  });
});
