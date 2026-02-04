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
import {
  adaptRoute,
  createExpressErrorHandler,
  createValidationMiddleware,
  createExpressAuthMiddleware,
} from './adapters/index.js';
import {
  validateRegisterRequest,
  validateLoginRequest,
  validateRefreshRequest,
} from './validators/auth.validators.js';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case.js';
import { LoginUserUseCase } from '../../application/use-cases/auth/login-user.use-case.js';
import { RefreshSessionUseCase } from '../../application/use-cases/auth/refresh-session.use-case.js';
import { ILogger } from '../../application/ports/logger.port.js';
import { IUuidGenerator } from '../../application/ports/uuid-generator.port.js';
import { ITokenService } from '../../application/ports/token.service.port.js';

/**
 * Dependencias requeridas para crear la aplicación.
 */
export interface AppDependencies {
  logger: ILogger;
  uuidGenerator: IUuidGenerator;
  tokenService: ITokenService;
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  refreshSessionUseCase: RefreshSessionUseCase;
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

  // Create controllers
  const authController = new AuthController({
    registerUserUseCase: deps.registerUserUseCase,
    loginUserUseCase: deps.loginUserUseCase,
    refreshSessionUseCase: deps.refreshSessionUseCase,
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

  // Health routes (no auth required)
  app.get('/health', adaptRoute(healthController, 'health'));
  app.get('/health/live', adaptRoute(healthController, 'live'));
  app.get('/health/ready', adaptRoute(healthController, 'ready'));

  // Auth routes
  app.post(
    '/auth/register',
    createValidationMiddleware(validateRegisterRequest),
    adaptRoute(authController, 'register')
  );

  app.post(
    '/auth/login',
    createValidationMiddleware(validateLoginRequest),
    adaptRoute(authController, 'login')
  );

  app.post(
    '/auth/refresh',
    createValidationMiddleware(validateRefreshRequest),
    adaptRoute(authController, 'refresh')
  );

  app.post(
    '/auth/logout',
    createExpressAuthMiddleware(authMiddleware),
    adaptRoute(authController, 'logout')
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
