/**
 * ============================================
 * ADAPTER: Express
 * ============================================
 *
 * Adaptadores para convertir entre Express Request/Response
 * y las abstracciones HttpRequest/HttpResponse.
 *
 * Esto permite que los controllers sean framework-agnostic.
 */

import { Request, Response } from 'express';
import { HttpRequest, HttpResponse } from '../controllers/auth.controller.js';

/**
 * Convierte un Express Request a HttpRequest genérico.
 *
 * @param req - Express Request
 * @returns HttpRequest framework-agnostic
 */
export function toHttpRequest<TBody = unknown>(req: Request): HttpRequest<TBody> {
  // Extract IP from X-Forwarded-For if present (first IP is client)
  const forwardedFor = req.headers['x-forwarded-for'];
  let ip: string | undefined;

  if (typeof forwardedFor === 'string') {
    ip = forwardedFor.split(',')[0]?.trim();
  } else if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    ip = forwardedFor[0]?.split(',')[0]?.trim();
  } else {
    ip = req.ip;
  }

  // Extract user agent
  const userAgent = req.headers['user-agent'];

  // Preserve user field from authentication middleware if present
  const user = (req as any).user;

  return {
    body: req.body as TBody,
    headers: req.headers as Record<string, string | undefined>,
    params: req.params as Record<string, string>,
    query: req.query as Record<string, string>,
    ...(ip ? { ip } : {}),
    ...(userAgent ? { userAgent } : {}),
    ...(user ? { user } : {}),
  };
}

/**
 * Envía un HttpResponse a través de Express Response.
 *
 * @param res - Express Response
 * @param httpResponse - HttpResponse a enviar
 */
export function sendHttpResponse<TData = unknown>(
  res: Response,
  httpResponse: HttpResponse<TData>
): void {
  // Set custom headers if provided
  if (httpResponse.headers) {
    for (const [key, value] of Object.entries(httpResponse.headers)) {
      res.set(key, value);
    }
  }

  // Send response with status code and body
  res.status(httpResponse.statusCode).json(httpResponse.body);
}
