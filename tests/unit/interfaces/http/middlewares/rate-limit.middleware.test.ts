/**
 * ============================================
 * UNIT TEST: RateLimitMiddleware
 * ============================================
 *
 * Tests unitarios para el middleware de rate limiting.
 *
 * CASOS TESTEADOS:
 * - Permitir requests dentro del límite
 * - Bloquear requests cuando se excede
 * - Headers de rate limit correctos
 * - Extracción de IP del cliente
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimitMiddleware, createRateLimitMiddleware } from '../../../../../src/interfaces/http/middlewares/rate-limit.middleware.js';
import { IRateLimiter, RateLimitOptions, RateLimitResult } from '../../../../../src/application/ports/rate-limiter.port.js';
import { HttpRequest } from '../../../../../src/interfaces/http/controllers/auth.controller.js';

describe('RateLimitMiddleware', () => {
  let mockRateLimiter: IRateLimiter;
  let middleware: RateLimitMiddleware;

  const options: RateLimitOptions = {
    keyPrefix: 'rl:test',
    limit: 5,
    windowMs: 60000,
  };

  const createRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    ...overrides,
  });

  const createAllowedResult = (remaining: number): RateLimitResult => ({
    allowed: true,
    remaining,
    retryAfterMs: 0,
    total: options.limit,
    resetAt: new Date(Date.now() + options.windowMs),
  });

  const createBlockedResult = (retryAfterMs: number): RateLimitResult => ({
    allowed: false,
    remaining: 0,
    retryAfterMs,
    total: options.limit,
    resetAt: new Date(Date.now() + retryAfterMs),
  });

  beforeEach(() => {
    mockRateLimiter = {
      check: vi.fn().mockResolvedValue(createAllowedResult(4)),
      increment: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockResolvedValue(undefined),
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    middleware = new RateLimitMiddleware(mockRateLimiter, options);
  });

  describe('process()', () => {
    it('should allow request when within limit', async () => {
      const request = createRequest();

      const result = await middleware.process(request);

      expect(result.allowed).toBe(true);
      expect(result.errorResponse).toBeUndefined();
    });

    it('should increment counter when allowed', async () => {
      const request = createRequest();

      await middleware.process(request);

      expect(mockRateLimiter.increment).toHaveBeenCalledWith(
        'rl:test:127.0.0.1',
        options.windowMs
      );
    });

    it('should block request when limit exceeded', async () => {
      (mockRateLimiter.check as ReturnType<typeof vi.fn>).mockResolvedValue(
        createBlockedResult(30000)
      );

      const request = createRequest();

      const result = await middleware.process(request);

      expect(result.allowed).toBe(false);
      expect(result.errorResponse).toBeDefined();
      expect(result.errorResponse?.statusCode).toBe(429);
    });

    it('should not increment counter when blocked', async () => {
      (mockRateLimiter.check as ReturnType<typeof vi.fn>).mockResolvedValue(
        createBlockedResult(30000)
      );

      const request = createRequest();

      await middleware.process(request);

      expect(mockRateLimiter.increment).not.toHaveBeenCalled();
    });

    it('should include rate limit headers in response', async () => {
      const request = createRequest();

      const result = await middleware.process(request);

      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '5');
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining', '4');
      expect(result.headers).toHaveProperty('X-RateLimit-Reset');
    });

    it('should include Retry-After header when blocked', async () => {
      (mockRateLimiter.check as ReturnType<typeof vi.fn>).mockResolvedValue(
        createBlockedResult(30000)
      );

      const request = createRequest();

      const result = await middleware.process(request);

      expect(result.headers).toHaveProperty('Retry-After', '30');
    });

    it('should return error response with correct structure when blocked', async () => {
      (mockRateLimiter.check as ReturnType<typeof vi.fn>).mockResolvedValue(
        createBlockedResult(45000)
      );

      const request = createRequest();

      const result = await middleware.process(request);

      expect(result.errorResponse).toEqual({
        statusCode: 429,
        body: {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: 45,
          },
        },
      });
    });
  });

  describe('IP extraction', () => {
    it('should use request.ip as default', async () => {
      const request = createRequest({ ip: '192.168.1.100' });

      await middleware.process(request);

      expect(mockRateLimiter.check).toHaveBeenCalledWith(
        'rl:test:192.168.1.100',
        options.limit,
        options.windowMs
      );
    });

    it('should extract IP from X-Forwarded-For header', async () => {
      const request = createRequest({
        ip: '127.0.0.1',
        headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18' },
      });

      await middleware.process(request);

      expect(mockRateLimiter.check).toHaveBeenCalledWith(
        'rl:test:203.0.113.50',
        options.limit,
        options.windowMs
      );
    });

    it('should extract IP from X-Real-IP header', async () => {
      const request = createRequest({
        ip: '127.0.0.1',
        headers: { 'x-real-ip': '198.51.100.42' },
      });

      await middleware.process(request);

      expect(mockRateLimiter.check).toHaveBeenCalledWith(
        'rl:test:198.51.100.42',
        options.limit,
        options.windowMs
      );
    });

    it('should prefer X-Forwarded-For over X-Real-IP', async () => {
      const request = createRequest({
        ip: '127.0.0.1',
        headers: {
          'x-forwarded-for': '203.0.113.50',
          'x-real-ip': '198.51.100.42',
        },
      });

      await middleware.process(request);

      expect(mockRateLimiter.check).toHaveBeenCalledWith(
        'rl:test:203.0.113.50',
        options.limit,
        options.windowMs
      );
    });

    it('should use "unknown" when no IP available', async () => {
      const request = createRequest({ ip: undefined });

      await middleware.process(request);

      expect(mockRateLimiter.check).toHaveBeenCalledWith(
        'rl:test:unknown',
        options.limit,
        options.windowMs
      );
    });
  });

  describe('createRateLimitMiddleware factory', () => {
    it('should create middleware instance', () => {
      const middlewareInstance = createRateLimitMiddleware(mockRateLimiter, options);

      expect(middlewareInstance).toBeInstanceOf(RateLimitMiddleware);
    });
  });
});
