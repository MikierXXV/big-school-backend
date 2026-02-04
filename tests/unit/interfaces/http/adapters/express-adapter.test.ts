/**
 * ============================================
 * UNIT TEST: Express Adapter
 * ============================================
 *
 * Tests para los adaptadores que convierten entre
 * Express Request/Response y HttpRequest/HttpResponse.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import {
  toHttpRequest,
  sendHttpResponse,
} from '../../../../../src/interfaces/http/adapters/express.adapter.js';
import { HttpResponse } from '../../../../../src/interfaces/http/controllers/auth.controller.js';

describe('Express Adapter', () => {
  describe('toHttpRequest()', () => {
    it('should convert Express Request body to HttpRequest', () => {
      const mockReq = {
        body: { email: 'test@example.com', password: 'password123' },
        headers: {},
        params: {},
        query: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const result = toHttpRequest(mockReq);

      expect(result.body).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should convert Express Request headers to HttpRequest (lowercase keys)', () => {
      const mockReq = {
        body: {},
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
          'x-correlation-id': 'corr-123',
        },
        params: {},
        query: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const result = toHttpRequest(mockReq);

      expect(result.headers['content-type']).toBe('application/json');
      expect(result.headers['authorization']).toBe('Bearer token123');
      expect(result.headers['x-correlation-id']).toBe('corr-123');
    });

    it('should convert Express Request params to HttpRequest', () => {
      const mockReq = {
        body: {},
        headers: {},
        params: { userId: '123', tokenId: '456' },
        query: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const result = toHttpRequest(mockReq);

      expect(result.params).toEqual({ userId: '123', tokenId: '456' });
    });

    it('should convert Express Request query to HttpRequest', () => {
      const mockReq = {
        body: {},
        headers: {},
        params: {},
        query: { page: '1', limit: '10' },
        ip: '127.0.0.1',
      } as unknown as Request;

      const result = toHttpRequest(mockReq);

      expect(result.query).toEqual({ page: '1', limit: '10' });
    });

    it('should extract IP directly from request', () => {
      const mockReq = {
        body: {},
        headers: {},
        params: {},
        query: {},
        ip: '192.168.1.100',
      } as unknown as Request;

      const result = toHttpRequest(mockReq);

      expect(result.ip).toBe('192.168.1.100');
    });

    it('should extract IP from X-Forwarded-For header when present', () => {
      const mockReq = {
        body: {},
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        },
        params: {},
        query: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const result = toHttpRequest(mockReq);

      // Should extract the first IP (client IP)
      expect(result.ip).toBe('203.0.113.195');
    });

    it('should extract userAgent from headers', () => {
      const mockReq = {
        body: {},
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        params: {},
        query: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const result = toHttpRequest(mockReq);

      expect(result.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    it('should handle missing optional fields gracefully', () => {
      const mockReq = {
        body: {},
        headers: {},
        params: {},
        query: {},
      } as unknown as Request;

      const result = toHttpRequest(mockReq);

      expect(result.ip).toBeUndefined();
      expect(result.userAgent).toBeUndefined();
    });
  });

  describe('sendHttpResponse()', () => {
    let mockRes: Partial<Response>;
    let statusMock: ReturnType<typeof vi.fn>;
    let jsonMock: ReturnType<typeof vi.fn>;
    let setMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      jsonMock = vi.fn();
      setMock = vi.fn();
      statusMock = vi.fn().mockReturnValue({
        json: jsonMock,
        set: setMock,
      });
      mockRes = {
        status: statusMock,
        set: setMock,
        json: jsonMock,
      };
    });

    it('should send response with correct status code', () => {
      const httpResponse: HttpResponse = {
        statusCode: 201,
        body: { success: true, data: { id: '123' } },
      };

      sendHttpResponse(mockRes as Response, httpResponse);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should send response with correct body', () => {
      const httpResponse: HttpResponse = {
        statusCode: 200,
        body: {
          success: true,
          data: { email: 'test@example.com', name: 'Test User' },
        },
      };

      sendHttpResponse(mockRes as Response, httpResponse);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { email: 'test@example.com', name: 'Test User' },
      });
    });

    it('should send error response correctly', () => {
      const httpResponse: HttpResponse = {
        statusCode: 400,
        body: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
          },
        },
      };

      sendHttpResponse(mockRes as Response, httpResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        },
      });
    });

    it('should set custom headers when provided', () => {
      const httpResponse: HttpResponse = {
        statusCode: 401,
        body: {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Token expired' },
        },
        headers: {
          'WWW-Authenticate': 'Bearer',
          'X-Custom-Header': 'custom-value',
        },
      };

      // Update mock to chain properly
      setMock.mockReturnThis();
      statusMock.mockReturnValue({
        json: jsonMock,
        set: setMock,
      });

      sendHttpResponse(mockRes as Response, httpResponse);

      expect(setMock).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer');
      expect(setMock).toHaveBeenCalledWith('X-Custom-Header', 'custom-value');
    });

    it('should handle response without custom headers', () => {
      const httpResponse: HttpResponse = {
        statusCode: 200,
        body: { success: true },
      };

      sendHttpResponse(mockRes as Response, httpResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true });
    });
  });
});
