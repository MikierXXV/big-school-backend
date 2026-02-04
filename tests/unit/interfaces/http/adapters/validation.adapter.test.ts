/**
 * ============================================
 * UNIT TEST: Validation Adapter
 * ============================================
 *
 * Tests para el adaptador que convierte funciones de validación
 * a Express middleware.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createValidationMiddleware } from '../../../../../src/interfaces/http/adapters/validation.adapter.js';
import { ValidationResult } from '../../../../../src/interfaces/http/validators/auth.validators.js';

describe('Validation Adapter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let setMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {
      body: { email: 'test@example.com', password: 'password123' },
      headers: {},
      params: {},
      query: {},
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

  describe('createValidationMiddleware()', () => {
    it('should call next() when validation passes', () => {
      const validValidator = vi.fn().mockReturnValue({
        isValid: true,
        errors: [],
      } as ValidationResult);

      const middleware = createValidationMiddleware(validValidator);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(validValidator).toHaveBeenCalledWith(mockReq.body);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when validation fails', () => {
      const invalidValidator = vi.fn().mockReturnValue({
        isValid: false,
        errors: [{ field: 'email', message: 'Email is required' }],
      } as ValidationResult);

      const middleware = createValidationMiddleware(invalidValidator);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include validation errors in response', () => {
      const errors = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' },
      ];
      const invalidValidator = vi.fn().mockReturnValue({
        isValid: false,
        errors,
      } as ValidationResult);

      const middleware = createValidationMiddleware(invalidValidator);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.details).toEqual(errors);
    });

    it('should pass request body to validator', () => {
      const body = { email: 'test@test.com', password: 'secret' };
      mockReq.body = body;

      const validator = vi.fn().mockReturnValue({
        isValid: true,
        errors: [],
      } as ValidationResult);

      const middleware = createValidationMiddleware(validator);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(validator).toHaveBeenCalledWith(body);
    });

    it('should handle empty body gracefully', () => {
      mockReq.body = undefined;

      const validator = vi.fn().mockReturnValue({
        isValid: false,
        errors: [{ field: 'body', message: 'Request body is required' }],
      } as ValidationResult);

      const middleware = createValidationMiddleware(validator);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(validator).toHaveBeenCalledWith(undefined);
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should include error message in response', () => {
      const validator = vi.fn().mockReturnValue({
        isValid: false,
        errors: [{ field: 'email', message: 'Invalid email format' }],
      } as ValidationResult);

      const middleware = createValidationMiddleware(validator);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.message).toBe('Validation failed');
    });
  });
});
