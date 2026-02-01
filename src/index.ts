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
 *
 * TODO: Implementar composición de la aplicación
 */

// ============================================
// IMPORTS (comentados hasta implementar)
// ============================================

// Configuración
// import dotenv from 'dotenv';
// import { loadEnvironmentConfig } from './infrastructure/config/environment.config.js';
// import { loadDatabaseConfig } from './infrastructure/config/database.config.js';
// import { loadJwtConfig } from './infrastructure/config/jwt.config.js';

// Infraestructura
// import { PostgresUserRepository } from './infrastructure/persistence/postgresql/postgres-user.repository.js';
// import { PostgresRefreshTokenRepository } from './infrastructure/persistence/postgresql/postgres-refresh-token.repository.js';
// import { JwtTokenService } from './infrastructure/services/jwt-token.service.js';
// import { BcryptHashingService } from './infrastructure/services/bcrypt-hashing.service.js';
// import { SystemDateTimeService } from './infrastructure/services/system-datetime.service.js';
// import { CryptoUuidGenerator } from './infrastructure/services/crypto-uuid-generator.service.js';
// import { ConsoleLogger } from './infrastructure/logging/console-logger.service.js';

// Casos de uso
// import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case.js';
// import { LoginUserUseCase } from './application/use-cases/auth/login-user.use-case.js';
// import { RefreshSessionUseCase } from './application/use-cases/auth/refresh-session.use-case.js';

// Controladores
// import { AuthController } from './interfaces/http/controllers/auth.controller.js';
// import { HealthController } from './interfaces/http/controllers/health.controller.js';

/**
 * Función principal de inicio de la aplicación.
 *
 * TODO: Implementar inicialización completa
 */
async function main(): Promise<void> {
  console.log('='.repeat(50));
  console.log('BIG SCHOOL BACKEND');
  console.log('Clean Architecture + DDD + Hexagonal');
  console.log('='.repeat(50));
  console.log('');

  // TODO: Implementar los siguientes pasos:

  // 1. Cargar variables de entorno
  // dotenv.config();
  // const envConfig = loadEnvironmentConfig();
  // const dbConfig = loadDatabaseConfig();
  // const jwtConfig = loadJwtConfig();

  // 2. Crear logger
  // const logger = new ConsoleLogger({ module: 'main' });
  // logger.info('Starting application...');

  // 3. Crear servicios de infraestructura
  // const dateTimeService = new SystemDateTimeService();
  // const uuidGenerator = new CryptoUuidGenerator();
  // const hashingService = new BcryptHashingService();
  // const tokenService = new JwtTokenService(jwtConfig, dateTimeService);

  // 4. Conectar a base de datos
  // const dbConnection = await createDatabaseConnection(dbConfig);
  // logger.info('Database connected');

  // 5. Crear repositorios
  // const userRepository = new PostgresUserRepository(dbConnection);
  // const refreshTokenRepository = new PostgresRefreshTokenRepository(dbConnection);

  // 6. Crear casos de uso (inyección de dependencias)
  // const registerUserUseCase = new RegisterUserUseCase({
  //   userRepository,
  //   hashingService,
  //   uuidGenerator,
  //   dateTimeService,
  //   logger: logger.child({ useCase: 'RegisterUser' }),
  // });
  //
  // const loginUserUseCase = new LoginUserUseCase({
  //   userRepository,
  //   refreshTokenRepository,
  //   tokenService,
  //   hashingService,
  //   uuidGenerator,
  //   dateTimeService,
  //   logger: logger.child({ useCase: 'LoginUser' }),
  // });
  //
  // const refreshSessionUseCase = new RefreshSessionUseCase({
  //   userRepository,
  //   refreshTokenRepository,
  //   tokenService,
  //   uuidGenerator,
  //   dateTimeService,
  //   logger: logger.child({ useCase: 'RefreshSession' }),
  // });

  // 7. Crear controladores
  // const authController = new AuthController({
  //   registerUserUseCase,
  //   loginUserUseCase,
  //   refreshSessionUseCase,
  // });
  // const healthController = new HealthController();

  // 8. Configurar servidor HTTP (Express, Fastify, etc.)
  // const app = createHttpServer();
  // configureMiddlewares(app);
  // configureRoutes(app, authController, healthController);
  // configureErrorHandler(app, logger);

  // 9. Iniciar servidor
  // const port = envConfig.server.port;
  // app.listen(port, () => {
  //   logger.info(`Server running on port ${port}`);
  // });

  console.log('TODO: Implementar inicialización de la aplicación');
  console.log('');
  console.log('La estructura está lista. Próximos pasos:');
  console.log('1. npm install');
  console.log('2. Implementar servicios de infraestructura');
  console.log('3. Configurar servidor HTTP');
  console.log('4. Ejecutar tests: npm test');
}

// Ejecutar aplicación
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
