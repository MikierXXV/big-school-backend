/**
 * ============================================
 * ADAPTER: Validation Middleware
 * ============================================
 *
 * Adapta funciones de validación para ser usadas
 * como Express middleware.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ValidationResult } from '../validators/auth.validators.js';

/**
 * Tipo para función de validación.
 */
type ValidatorFunction = (body: unknown) => ValidationResult;

/**
 * Crea un Express middleware a partir de una función de validación.
 *
 * @param validator - Función de validación
 * @returns Express RequestHandler
 */
export function createValidationMiddleware(
  validator: ValidatorFunction
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validator(req.body);

    if (result.isValid) {
      next();
      return;
    }

    // Send validation error response
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: result.errors,
      },
    });
  };
}
