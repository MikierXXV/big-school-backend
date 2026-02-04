/**
 * ============================================
 * ADAPTER: Express Error Handler
 * ============================================
 *
 * Adapta ErrorHandlerMiddleware para ser usado
 * como Express error handler.
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ErrorHandlerMiddleware } from '../middlewares/error-handler.middleware.js';
import { sendHttpResponse } from './express.adapter.js';

/**
 * Request extendido con correlation ID.
 */
interface RequestWithContext extends Request {
  correlationId?: string;
}

/**
 * Crea un Express error handler a partir de ErrorHandlerMiddleware.
 *
 * @param errorHandler - Instancia de ErrorHandlerMiddleware
 * @returns Express ErrorRequestHandler
 */
export function createExpressErrorHandler(
  errorHandler: ErrorHandlerMiddleware
): ErrorRequestHandler {
  return (
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    // Extract correlation ID if present
    const correlationId = (req as RequestWithContext).correlationId;

    // Use ErrorHandlerMiddleware to handle the error
    const httpResponse = errorHandler.handle(error, correlationId);

    // Send response through Express
    sendHttpResponse(res, httpResponse);
  };
}
