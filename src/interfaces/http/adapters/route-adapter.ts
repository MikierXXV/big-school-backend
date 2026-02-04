/**
 * ============================================
 * ADAPTER: Route Adapter
 * ============================================
 *
 * Wrappea métodos de controller para ser usados
 * como handlers de Express.
 *
 * Convierte:
 * - Express Request → HttpRequest
 * - HttpResponse → Express Response
 * - Errores → next(error)
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { toHttpRequest, sendHttpResponse } from './express.adapter.js';
import { HttpRequest, HttpResponse } from '../controllers/auth.controller.js';

/**
 * Tipo para un método de controller.
 */
type ControllerMethod<TBody = unknown, TData = unknown> = (
  request: HttpRequest<TBody>
) => Promise<HttpResponse<TData>>;

/**
 * Adapta un método de controller para ser usado como handler de Express.
 *
 * @param controller - Instancia del controller
 * @param methodName - Nombre del método a adaptar
 * @returns Express RequestHandler
 */
export function adaptRoute(
  controller: object,
  methodName: string
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Convert Express Request to HttpRequest
      const httpRequest = toHttpRequest(req);

      // Call controller method
      const method = (controller as Record<string, ControllerMethod>)[methodName];
      if (!method) {
        throw new Error(`Method ${methodName} not found on controller`);
      }
      const httpResponse = await method.call(controller, httpRequest);

      // Send response through Express
      sendHttpResponse(res, httpResponse);
    } catch (error) {
      // Forward error to Express error handler
      next(error);
    }
  };
}
