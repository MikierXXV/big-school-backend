/**
 * ============================================
 * MIDDLEWARES - BARREL EXPORT
 * ============================================
 *
 * Middlewares HTTP para procesamiento de requests.
 *
 * ORDEN TÍPICO:
 * 1. CORS
 * 2. Rate Limiting
 * 3. Body Parser
 * 4. Authentication (si aplica)
 * 5. Validation
 * 6. Handler
 * 7. Error Handler
 */

export * from './auth.middleware.js';
export * from './error-handler.middleware.js';
export * from './request-context.middleware.js';
