/**
 * ============================================
 * BIG SCHOOL BACKEND - ENTRY POINT
 * ============================================
 *
 * Punto de entrada de la aplicación.
 * Aquí se configura e inicia el servidor.
 *
 * RESPONSABILIDADES:
 * - Cargar configuración de entorno
 * - Inicializar dependencias (DI Container)
 * - Configurar servidor HTTP
 * - Registrar rutas y middlewares
 * - Iniciar el servidor
 *
 * ARQUITECTURA:
 * Este archivo es parte de la capa de Infraestructura/Composición.
 * Aquí se "ensamblan" todas las piezas de la aplicación.
 */

import dotenv from 'dotenv';
import { Server } from 'http';
import { createContainer } from './infrastructure/container/container.js';
import { createApp } from './interfaces/http/app.factory.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Server instance for graceful shutdown
 */
let server: Server | null = null;

/**
 * Función principal de inicio de la aplicación.
 */
async function main(): Promise<void> {
  // ============================================
  // 1. CREATE DI CONTAINER
  // ============================================
  const container = createContainer();
  const { logger, config } = container;

  logger.info('Starting BIG SCHOOL Backend...');
  logger.info('Clean Architecture + DDD + Hexagonal', {
    environment: config.server.environment,
    port: config.server.port,
  });

  // ============================================
  // 2. CREATE EXPRESS APPLICATION
  // ============================================
  const app = createApp({
    logger,
    uuidGenerator: container.uuidGenerator,
    tokenService: container.tokenService,
    rateLimiter: container.rateLimiter,
    registerUserUseCase: container.registerUserUseCase,
    loginUserUseCase: container.loginUserUseCase,
    refreshSessionUseCase: container.refreshSessionUseCase,
    verifyEmailUseCase: container.verifyEmailUseCase,
    requestPasswordResetUseCase: container.requestPasswordResetUseCase,
    confirmPasswordResetUseCase: container.confirmPasswordResetUseCase,
    adminController: container.adminController,
    organizationController: container.organizationController,
    organizationMembershipController: container.organizationMembershipController,
    authorizationMiddleware: container.authorizationMiddleware,
    isProduction: config.server.isProduction,
    version: process.env.npm_package_version || '1.0.0',
  });

  // ============================================
  // 3. START HTTP SERVER
  // ============================================
  const { port, host } = config.server;

  server = app.listen(port, host, () => {
    logger.info(`Server running at http://${host}:${port}`, {
      port,
      host,
      nodeEnv: config.server.environment,
    });
    logger.info('Available endpoints:', {
      health: `http://${host}:${port}/health`,
      register: `http://${host}:${port}/auth/register`,
      login: `http://${host}:${port}/auth/login`,
      refresh: `http://${host}:${port}/auth/refresh`,
      verifyEmail: `http://${host}:${port}/auth/verify-email`,
      logout: `http://${host}:${port}/auth/logout`,
      passwordReset: `http://${host}:${port}/auth/password-reset`,
      passwordResetConfirm: `http://${host}:${port}/auth/password-reset/confirm`,
    });
  });

  // ============================================
  // 4. GRACEFUL SHUTDOWN HANDLERS
  // ============================================
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    if (server) {
      server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown', err);
          process.exit(1);
        }
        logger.info('Server closed successfully');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.warn('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Ejecutar aplicación
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
