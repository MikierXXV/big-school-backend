/**
 * ============================================
 * UNIT TEST: Error Handler Adapter
 * ============================================
 *
 * Tests para el adaptador que convierte ErrorHandlerMiddleware
 * a un Express error handler.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createExpressErrorHandler } from '../../../../../src/interfaces/http/adapters/error-handler.adapter.js';
import { ErrorHandlerMiddleware } from '../../../../../src/interfaces/http/middlewares/error-handler.middleware.js';
import { DomainError } from '../../../../../src/domain/errors/domain.error.js';
import { ApplicationError } from '../../../../../src/application/errors/application.error.js';
import { ILogger } from '../../../../../src/application/ports/logger.port.js';

// Test domain error
class TestDomainError extends DomainError {
  public readonly code = 'TEST_DOMAIN_ERROR';

  constructor(message: string) {
    super(message);
  }
}

// Test application error
class TestApplicationError extends ApplicationError {
  public readonly code = 'TEST_APP_ERROR';
  public readonly httpStatusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

describe('Error Handler Adapter', () => {
  let mockLogger: ILogger;
  let errorHandler: ErrorHandlerMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let setMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn().mockReturnThis(),
      setLevel: vi.fn(),
    };

    errorHandler = new ErrorHandlerMiddleware(mockLogger, false);

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

  describe('createExpressErrorHandler()', () => {
    it('should convert DomainError to appropriate HTTP response', () => {
      const adapter = createExpressErrorHandler(errorHandler);
      const domainError = new TestDomainError('Test domain error');

      adapter(domainError, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
      const jsonArg = jsonMock.mock.calls[0][0];
      expect(jsonArg.success).toBe(false);
      expect(jsonArg.error).toBeDefined();
    });

    it('should convert ApplicationError to appropriate HTTP response', () => {
      const adapter = createExpressErrorHandler(errorHandler);
      const appError = new TestApplicationError('Test app error');

      adapter(appError, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should convert unknown errors to 500 response', () => {
      const adapter = createExpressErrorHandler(errorHandler);
      const unknownError = new Error('Unknown error');

      adapter(unknownError, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should extract correlationId from request context if present', () => {
      const adapter = createExpressErrorHandler(errorHandler);
      const error = new TestDomainError('Test error');

      // Add correlation ID to request
      (mockReq as Record<string, unknown>).correlationId = 'test-correlation-123';

      adapter(error, mockReq as Request, mockRes as Response, mockNext);

      // Verify logger was called (which uses correlation ID)
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should call ErrorHandlerMiddleware.handle with error', () => {
      const handleSpy = vi.spyOn(errorHandler, 'handle');
      const adapter = createExpressErrorHandler(errorHandler);
      const error = new TestDomainError('Test error');

      adapter(error, mockReq as Request, mockRes as Response, mockNext);

      expect(handleSpy).toHaveBeenCalledWith(error, undefined);
    });

    it('should send response through Express', () => {
      const adapter = createExpressErrorHandler(errorHandler);
      const error = new TestDomainError('Test error');

      adapter(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should log errors with correlation context', () => {
      const adapter = createExpressErrorHandler(errorHandler);
      const error = new TestDomainError('Test error');
      (mockReq as Record<string, unknown>).correlationId = 'corr-456';

      adapter(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should hide error details in production mode', () => {
      const prodErrorHandler = new ErrorHandlerMiddleware(mockLogger, true);
      const adapter = createExpressErrorHandler(prodErrorHandler);
      const unknownError = new Error('Sensitive internal error');

      adapter(unknownError, mockReq as Request, mockRes as Response, mockNext);

      const jsonArg = jsonMock.mock.calls[0][0];
      // In production, should not expose internal error message
      expect(jsonArg.error?.message).not.toContain('Sensitive');
    });
  });
});
