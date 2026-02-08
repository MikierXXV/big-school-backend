/**
 * ============================================
 * ADAPTER: Rate Limit Middleware
 * ============================================
 *
 * Adapta RateLimitMiddleware para ser usado como Express middleware.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { RateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';
import { HttpRequest } from '../controllers/auth.controller.js';
import { sendHttpResponse } from './express.adapter.js';

/**
 * Crea un Express middleware a partir de RateLimitMiddleware.
 *
 * @param rateLimitMiddleware - Instancia de RateLimitMiddleware
 * @returns Express RequestHandler
 */
export function createExpressRateLimitMiddleware(
  rateLimitMiddleware: RateLimitMiddleware
): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Convert Express request to framework-agnostic HttpRequest
      const userAgent = req.headers['user-agent'];
      const httpRequest: HttpRequest = {
        body: req.body,
        headers: req.headers as Record<string, string | undefined>,
        params: req.params as Record<string, string>,
        query: req.query as Record<string, string>,
        ...(req.ip ? { ip: req.ip } : {}),
        ...(userAgent ? { userAgent } : {}),
      };

      // Call the framework-agnostic rate limit middleware
      const result = await rateLimitMiddleware.process(httpRequest);

      // Set rate limit headers
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value);
      }

      if (result.allowed) {
        next();
      } else {
        // Send rate limit exceeded response
        sendHttpResponse(res, result.errorResponse!);
      }
    } catch (error) {
      // Pass errors to Express error handler
      next(error);
    }
  };
}
