/**
 * ============================================
 * FACTORY: Express Application
 * ============================================
 *
 * Crea y configura la aplicación Express.
 * Conecta todas las capas y middlewares.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { AuthController } from './controllers/auth.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { AuthMiddleware } from './middlewares/auth.middleware.js';
import { ErrorHandlerMiddleware } from './middlewares/error-handler.middleware.js';
import { RequestContextMiddleware } from './middlewares/request-context.middleware.js';
import { RateLimitMiddleware } from './middlewares/rate-limit.middleware.js';
import { RATE_LIMITS } from './config/rate-limits.config.js';
import {
  adaptRoute,
  createExpressErrorHandler,
  createValidationMiddleware,
  createExpressAuthMiddleware,
  createExpressRateLimitMiddleware,
} from './adapters/index.js';
import {
  validateRegisterRequest,
  validateLoginRequest,
  validateRefreshRequest,
  validateVerifyEmailRequest,
  validateRequestPasswordResetRequest,
  validateConfirmPasswordResetRequest,
} from './validators/auth.validators.js';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case.js';
import { LoginUserUseCase } from '../../application/use-cases/auth/login-user.use-case.js';
import { RefreshSessionUseCase } from '../../application/use-cases/auth/refresh-session.use-case.js';
import { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case.js';
import { RequestPasswordResetUseCase } from '../../application/use-cases/auth/request-password-reset.use-case.js';
import { ConfirmPasswordResetUseCase } from '../../application/use-cases/auth/confirm-password-reset.use-case.js';
import { ILogger } from '../../application/ports/logger.port.js';
import { IUuidGenerator } from '../../application/ports/uuid-generator.port.js';
import { ITokenService } from '../../application/ports/token.service.port.js';
import { IRateLimiter } from '../../application/ports/rate-limiter.port.js';

/**
 * Dependencias requeridas para crear la aplicación.
 */
export interface AppDependencies {
  logger: ILogger;
  uuidGenerator: IUuidGenerator;
  tokenService: ITokenService;
  rateLimiter: IRateLimiter;
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  refreshSessionUseCase: RefreshSessionUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  requestPasswordResetUseCase: RequestPasswordResetUseCase;
  confirmPasswordResetUseCase: ConfirmPasswordResetUseCase;
  isProduction?: boolean;
  version?: string;
}

/**
 * Request extendido con contexto.
 */
interface RequestWithContext extends Request {
  correlationId?: string;
  startTime?: number;
}

/**
 * Crea una aplicación Express configurada.
 *
 * @param deps - Dependencias de la aplicación
 * @returns Aplicación Express configurada
 */
export function createApp(deps: AppDependencies): Express {
  const app = express();

  // Create middleware instances
  const requestContextMiddleware = new RequestContextMiddleware(
    deps.uuidGenerator,
    deps.logger
  );
  const errorHandlerMiddleware = new ErrorHandlerMiddleware(
    deps.logger,
    deps.isProduction ?? false
  );
  const authMiddleware = new AuthMiddleware(deps.tokenService);

  // Create rate limit middlewares
  const globalRateLimitMiddleware = new RateLimitMiddleware(
    deps.rateLimiter,
    RATE_LIMITS.global
  );
  const authRateLimitMiddleware = new RateLimitMiddleware(
    deps.rateLimiter,
    RATE_LIMITS.auth
  );
  const passwordResetRateLimitMiddleware = new RateLimitMiddleware(
    deps.rateLimiter,
    RATE_LIMITS.passwordReset
  );

  // Create controllers
  const authController = new AuthController({
    registerUserUseCase: deps.registerUserUseCase,
    loginUserUseCase: deps.loginUserUseCase,
    refreshSessionUseCase: deps.refreshSessionUseCase,
    verifyEmailUseCase: deps.verifyEmailUseCase,
    requestPasswordResetUseCase: deps.requestPasswordResetUseCase,
    confirmPasswordResetUseCase: deps.confirmPasswordResetUseCase,
  });
  const healthController = new HealthController(deps.version);

  // Configure body parser
  app.use(express.json());

  // Request context middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'];
    const httpRequest = {
      body: req.body,
      headers: req.headers as Record<string, string | undefined>,
      params: req.params as Record<string, string>,
      query: req.query as Record<string, string>,
      ...(req.ip ? { ip: req.ip } : {}),
      ...(userAgent ? { userAgent } : {}),
    };

    const contextualRequest = requestContextMiddleware.enrich(httpRequest);

    // Attach context to Express request
    (req as RequestWithContext).correlationId = contextualRequest.correlationId;
    (req as RequestWithContext).startTime = contextualRequest.startTime;

    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', contextualRequest.correlationId);

    next();
  });

  // Global rate limiting (applied to all routes)
  app.use(createExpressRateLimitMiddleware(globalRateLimitMiddleware));

  // Health routes (no auth required, only global rate limit)
  app.get('/health', adaptRoute(healthController, 'health'));
  app.get('/health/live', adaptRoute(healthController, 'live'));
  app.get('/health/ready', adaptRoute(healthController, 'ready'));

  // Auth routes (with stricter rate limiting)
  app.post(
    '/auth/register',
    createExpressRateLimitMiddleware(authRateLimitMiddleware),
    createValidationMiddleware(validateRegisterRequest),
    adaptRoute(authController, 'register')
  );

  app.post(
    '/auth/login',
    createExpressRateLimitMiddleware(authRateLimitMiddleware),
    createValidationMiddleware(validateLoginRequest),
    adaptRoute(authController, 'login')
  );

  app.post(
    '/auth/refresh',
    createExpressRateLimitMiddleware(authRateLimitMiddleware),
    createValidationMiddleware(validateRefreshRequest),
    adaptRoute(authController, 'refresh')
  );

  app.post(
    '/auth/verify-email',
    createExpressRateLimitMiddleware(authRateLimitMiddleware),
    createValidationMiddleware(validateVerifyEmailRequest),
    adaptRoute(authController, 'verifyEmail')
  );

  app.post(
    '/auth/logout',
    createExpressAuthMiddleware(authMiddleware),
    adaptRoute(authController, 'logout')
  );

  // Password reset routes (with very strict rate limiting)
  app.post(
    '/auth/password-reset',
    createExpressRateLimitMiddleware(passwordResetRateLimitMiddleware),
    createValidationMiddleware(validateRequestPasswordResetRequest),
    adaptRoute(authController, 'requestPasswordReset')
  );

  app.post(
    '/auth/password-reset/confirm',
    createExpressRateLimitMiddleware(authRateLimitMiddleware),
    createValidationMiddleware(validateConfirmPasswordResetRequest),
    adaptRoute(authController, 'confirmPasswordReset')
  );

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    });
  });

  // Error handler (must be last)
  app.use(createExpressErrorHandler(errorHandlerMiddleware));

  return app;
}
