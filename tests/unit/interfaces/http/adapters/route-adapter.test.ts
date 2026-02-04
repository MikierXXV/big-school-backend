/**
 * ============================================
 * UNIT TEST: Route Adapter
 * ============================================
 *
 * Tests para el adaptador que wrappea métodos de controller
 * para ser usados como handlers de Express.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { adaptRoute } from '../../../../../src/interfaces/http/adapters/route-adapter.js';
import { HttpRequest, HttpResponse } from '../../../../../src/interfaces/http/controllers/auth.controller.js';

describe('Route Adapter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let setMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {
      body: { email: 'test@example.com' },
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

  describe('adaptRoute()', () => {
    it('should call controller method with HttpRequest', async () => {
      const mockController = {
        testMethod: vi.fn().mockResolvedValue({
          statusCode: 200,
          body: { success: true },
        }),
      };

      const handler = adaptRoute(mockController, 'testMethod');
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockController.testMethod).toHaveBeenCalledTimes(1);
      const callArg = mockController.testMethod.mock.calls[0][0];
      expect(callArg.body).toEqual({ email: 'test@example.com' });
    });

    it('should send HttpResponse through Express response', async () => {
      const mockController = {
        testMethod: vi.fn().mockResolvedValue({
          statusCode: 201,
          body: { success: true, data: { id: '123' } },
        }),
      };

      const handler = adaptRoute(mockController, 'testMethod');
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { id: '123' },
      });
    });

    it('should catch thrown errors and forward to next()', async () => {
      const testError = new Error('Test error');
      const mockController = {
        testMethod: vi.fn().mockRejectedValue(testError),
      };

      const handler = adaptRoute(mockController, 'testMethod');
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should preserve original error type when forwarding', async () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: string
        ) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const customError = new CustomError('Custom error', 'CUSTOM_CODE');
      const mockController = {
        testMethod: vi.fn().mockRejectedValue(customError),
      };

      const handler = adaptRoute(mockController, 'testMethod');
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(customError);
      const passedError = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(passedError).toBeInstanceOf(CustomError);
      expect(passedError.code).toBe('CUSTOM_CODE');
    });

    it('should handle controller returning HttpResponse with custom headers', async () => {
      const mockController = {
        testMethod: vi.fn().mockResolvedValue({
          statusCode: 401,
          body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } },
          headers: { 'WWW-Authenticate': 'Bearer' },
        }),
      };

      const handler = adaptRoute(mockController, 'testMethod');
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(setMock).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer');
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should handle different status codes correctly', async () => {
      // Test 200
      let mockController = {
        testMethod: vi.fn().mockResolvedValue({
          statusCode: 200,
          body: { success: true },
        }),
      };
      let handler = adaptRoute(mockController, 'testMethod');
      await handler(mockReq as Request, mockRes as Response, mockNext);
      expect(statusMock).toHaveBeenCalledWith(200);

      // Reset mocks
      statusMock.mockClear();

      // Test 400
      mockController = {
        testMethod: vi.fn().mockResolvedValue({
          statusCode: 400,
          body: { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid' } },
        }),
      };
      handler = adaptRoute(mockController, 'testMethod');
      await handler(mockReq as Request, mockRes as Response, mockNext);
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should not call next() on successful response', async () => {
      const mockController = {
        testMethod: vi.fn().mockResolvedValue({
          statusCode: 200,
          body: { success: true },
        }),
      };

      const handler = adaptRoute(mockController, 'testMethod');
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass request data including IP and userAgent', async () => {
      mockReq = {
        body: { data: 'test' },
        headers: { 'user-agent': 'TestAgent/1.0' },
        params: { id: '123' },
        query: { filter: 'active' },
        ip: '10.0.0.1',
      };

      const mockController = {
        testMethod: vi.fn().mockResolvedValue({
          statusCode: 200,
          body: { success: true },
        }),
      };

      const handler = adaptRoute(mockController, 'testMethod');
      await handler(mockReq as Request, mockRes as Response, mockNext);

      const callArg = mockController.testMethod.mock.calls[0][0] as HttpRequest;
      expect(callArg.body).toEqual({ data: 'test' });
      expect(callArg.params).toEqual({ id: '123' });
      expect(callArg.query).toEqual({ filter: 'active' });
      expect(callArg.ip).toBe('10.0.0.1');
      expect(callArg.userAgent).toBe('TestAgent/1.0');
    });
  });
});
