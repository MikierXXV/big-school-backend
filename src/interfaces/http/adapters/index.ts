/**
 * ============================================
 * BARREL: HTTP Adapters
 * ============================================
 */

export { toHttpRequest, sendHttpResponse } from './express.adapter.js';
export { adaptRoute } from './route-adapter.js';
export { createExpressErrorHandler } from './error-handler.adapter.js';
export { createValidationMiddleware } from './validation.adapter.js';
export { createExpressAuthMiddleware } from './auth-middleware.adapter.js';
export { createExpressRateLimitMiddleware } from './rate-limit-middleware.adapter.js';
