/**
 * ============================================
 * ADAPTER: Auth Middleware
 * ============================================
 *
 * Adapta AuthMiddleware para ser usado como Express middleware.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthMiddleware, AuthenticatedUser } from '../middlewares/auth.middleware.js';
import { HttpRequest } from '../controllers/auth.controller.js';
import { sendHttpResponse } from './express.adapter.js';

/**
 * Request extendido con información de usuario.
 */
interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Crea un Express middleware a partir de AuthMiddleware.
 *
 * @param authMiddleware - Instancia de AuthMiddleware
 * @returns Express RequestHandler
 */
export function createExpressAuthMiddleware(
  authMiddleware: AuthMiddleware
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

      // Call the framework-agnostic auth middleware
      const result = await authMiddleware.authenticate(httpRequest);

      if (result.success) {
        // Attach user to request for downstream handlers
        (req as RequestWithUser).user = result.user;
        next();
      } else {
        // Send unauthorized response
        sendHttpResponse(res, result.response);
      }
    } catch (error) {
      // Pass errors to Express error handler
      next(error);
    }
  };
}
