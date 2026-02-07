/**
 * ============================================
 * DI CONTAINER: Application Composition Root
 * ============================================
 *
 * Contenedor de inyección de dependencias.
 * Crea e interconecta todas las dependencias de la aplicación.
 *
 * RESPONSABILIDADES:
 * - Instanciar servicios de infraestructura
 * - Instanciar repositorios
 * - Instanciar casos de uso con sus dependencias
 * - Exponer configuración
 */

import { ILogger } from '../../application/ports/logger.port.js';
import { IDateTimeService } from '../../application/ports/datetime.service.port.js';
import { IUuidGenerator } from '../../application/ports/uuid-generator.port.js';
import { IHashingService } from '../../application/ports/hashing.service.port.js';
import { ITokenService } from '../../application/ports/token.service.port.js';
import { UserRepository } from '../../domain/repositories/user.repository.interface.js';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface.js';
import { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.interface.js';

import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case.js';
import { LoginUserUseCase } from '../../application/use-cases/auth/login-user.use-case.js';
import { RefreshSessionUseCase } from '../../application/use-cases/auth/refresh-session.use-case.js';
import { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case.js';
import { RequestPasswordResetUseCase } from '../../application/use-cases/auth/request-password-reset.use-case.js';
import { ConfirmPasswordResetUseCase } from '../../application/use-cases/auth/confirm-password-reset.use-case.js';

import { ConsoleLogger } from '../logging/console-logger.service.js';
import { SystemDateTimeService } from '../services/system-datetime.service.js';
import { CryptoUuidGenerator } from '../services/crypto-uuid-generator.service.js';
import { BcryptHashingService } from '../services/bcrypt-hashing.service.js';
import { JwtTokenService } from '../services/jwt-token.service.js';

import { InMemoryUserRepository } from '../persistence/in-memory/in-memory-user.repository.js';
import { InMemoryRefreshTokenRepository } from '../persistence/in-memory/in-memory-refresh-token.repository.js';
import { InMemoryPasswordResetTokenRepository } from '../persistence/in-memory/in-memory-password-reset-token.repository.js';

import { loadEnvironmentConfig, EnvironmentConfig, ServerConfig } from '../config/environment.config.js';
import { loadJwtConfig, JwtConfig } from '../config/jwt.config.js';

/**
 * Configuración del contenedor.
 */
export interface ContainerConfig {
  readonly server: ServerConfig;
  readonly jwt: JwtConfig;
}

/**
 * Contenedor de dependencias de la aplicación.
 */
export interface AppContainer {
  // Services
  readonly logger: ILogger;
  readonly dateTimeService: IDateTimeService;
  readonly uuidGenerator: IUuidGenerator;
  readonly hashingService: IHashingService;
  readonly tokenService: ITokenService;

  // Repositories
  readonly userRepository: UserRepository;
  readonly refreshTokenRepository: RefreshTokenRepository;
  readonly passwordResetTokenRepository: PasswordResetTokenRepository;

  // Use Cases
  readonly registerUserUseCase: RegisterUserUseCase;
  readonly loginUserUseCase: LoginUserUseCase;
  readonly refreshSessionUseCase: RefreshSessionUseCase;
  readonly verifyEmailUseCase: VerifyEmailUseCase;
  readonly requestPasswordResetUseCase: RequestPasswordResetUseCase;
  readonly confirmPasswordResetUseCase: ConfirmPasswordResetUseCase;

  // Config
  readonly config: ContainerConfig;
}

/**
 * Crea el contenedor de dependencias con todas las instancias.
 *
 * @returns Contenedor con todas las dependencias instanciadas
 */
export function createContainer(): AppContainer {
  // ============================================
  // 1. CONFIGURATION
  // ============================================
  const envConfig: EnvironmentConfig = loadEnvironmentConfig();
  const jwtConfig: JwtConfig = loadJwtConfig();

  // Get hashing rounds from env or default
  const saltRounds = parseInt(process.env.HASH_SALT_ROUNDS || '12', 10);

  // Get log level from env
  const logLevel = (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error';

  // ============================================
  // 2. INFRASTRUCTURE SERVICES
  // ============================================
  const logger: ILogger = new ConsoleLogger({ module: 'app' }, logLevel);
  const dateTimeService: IDateTimeService = new SystemDateTimeService();
  const uuidGenerator: IUuidGenerator = new CryptoUuidGenerator();
  const hashingService: IHashingService = new BcryptHashingService({ saltRounds });
  const tokenService: ITokenService = new JwtTokenService(jwtConfig, dateTimeService);

  // ============================================
  // 3. REPOSITORIES (InMemory for now)
  // ============================================
  const userRepository: UserRepository = new InMemoryUserRepository();
  const refreshTokenRepository: RefreshTokenRepository = new InMemoryRefreshTokenRepository();
  const passwordResetTokenRepository: PasswordResetTokenRepository = new InMemoryPasswordResetTokenRepository();

  // ============================================
  // 4. USE CASES
  // ============================================
  const registerUserUseCase = new RegisterUserUseCase({
    userRepository,
    hashingService,
    uuidGenerator,
    dateTimeService,
    tokenService,
    logger: logger.child({ useCase: 'RegisterUser' }),
    isProduction: envConfig.server.isProduction,
  });

  const loginUserUseCase = new LoginUserUseCase({
    userRepository,
    refreshTokenRepository,
    tokenService,
    hashingService,
    uuidGenerator,
    dateTimeService,
    logger: logger.child({ useCase: 'LoginUser' }),
  });

  const refreshSessionUseCase = new RefreshSessionUseCase({
    userRepository,
    refreshTokenRepository,
    tokenService,
    uuidGenerator,
    dateTimeService,
    logger: logger.child({ useCase: 'RefreshSession' }),
  });

  const verifyEmailUseCase = new VerifyEmailUseCase({
    userRepository,
    tokenService,
    dateTimeService,
    logger: logger.child({ useCase: 'VerifyEmail' }),
  });

  const requestPasswordResetUseCase = new RequestPasswordResetUseCase({
    userRepository,
    passwordResetTokenRepository,
    tokenService,
    uuidGenerator,
    dateTimeService,
    logger: logger.child({ useCase: 'RequestPasswordReset' }),
  });

  const confirmPasswordResetUseCase = new ConfirmPasswordResetUseCase({
    userRepository,
    passwordResetTokenRepository,
    refreshTokenRepository,
    tokenService,
    hashingService,
    dateTimeService,
    logger: logger.child({ useCase: 'ConfirmPasswordReset' }),
  });

  // ============================================
  // 5. RETURN CONTAINER
  // ============================================
  return {
    // Services
    logger,
    dateTimeService,
    uuidGenerator,
    hashingService,
    tokenService,

    // Repositories
    userRepository,
    refreshTokenRepository,
    passwordResetTokenRepository,

    // Use Cases
    registerUserUseCase,
    loginUserUseCase,
    refreshSessionUseCase,
    verifyEmailUseCase,
    requestPasswordResetUseCase,
    confirmPasswordResetUseCase,

    // Config
    config: {
      server: envConfig.server,
      jwt: jwtConfig,
    },
  };
}
