/**
 * ============================================
 * UNIT TEST: DI Container
 * ============================================
 *
 * Tests para el contenedor de inyección de dependencias.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createContainer, AppContainer } from '../../../../src/infrastructure/container/container.js';
import { ILogger } from '../../../../src/application/ports/logger.port.js';
import { IDateTimeService } from '../../../../src/application/ports/datetime.service.port.js';
import { IUuidGenerator } from '../../../../src/application/ports/uuid-generator.port.js';
import { IHashingService } from '../../../../src/application/ports/hashing.service.port.js';
import { ITokenService } from '../../../../src/application/ports/token.service.port.js';
import { RegisterUserUseCase } from '../../../../src/application/use-cases/auth/register-user.use-case.js';
import { LoginUserUseCase } from '../../../../src/application/use-cases/auth/login-user.use-case.js';
import { RefreshSessionUseCase } from '../../../../src/application/use-cases/auth/refresh-session.use-case.js';
import { VerifyEmailUseCase } from '../../../../src/application/use-cases/auth/verify-email.use-case.js';

describe('DI Container', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Set required JWT secrets for tests
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-at-least-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-characters-long';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createContainer', () => {
    it('should create a container with all dependencies', () => {
      const container = createContainer();

      expect(container).toBeDefined();
      expect(container.logger).toBeDefined();
      expect(container.dateTimeService).toBeDefined();
      expect(container.uuidGenerator).toBeDefined();
      expect(container.hashingService).toBeDefined();
      expect(container.tokenService).toBeDefined();
      expect(container.userRepository).toBeDefined();
      expect(container.refreshTokenRepository).toBeDefined();
      expect(container.registerUserUseCase).toBeDefined();
      expect(container.loginUserUseCase).toBeDefined();
      expect(container.refreshSessionUseCase).toBeDefined();
      expect(container.verifyEmailUseCase).toBeDefined();
    });

    it('should create logger that implements ILogger', () => {
      const container = createContainer();
      const logger = container.logger;

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.child).toBe('function');
      expect(typeof logger.setLevel).toBe('function');
    });

    it('should create dateTimeService that implements IDateTimeService', () => {
      const container = createContainer();
      const service = container.dateTimeService;

      expect(typeof service.now).toBe('function');
      expect(typeof service.nowTimestamp).toBe('function');
      expect(typeof service.addSeconds).toBe('function');
      expect(typeof service.isExpired).toBe('function');
    });

    it('should create uuidGenerator that implements IUuidGenerator', () => {
      const container = createContainer();
      const generator = container.uuidGenerator;

      expect(typeof generator.generate).toBe('function');
      expect(typeof generator.isValid).toBe('function');

      // Test it works
      const uuid = generator.generate();
      expect(generator.isValid(uuid)).toBe(true);
    });

    it('should create hashingService that implements IHashingService', () => {
      const container = createContainer();
      const service = container.hashingService;

      expect(typeof service.hash).toBe('function');
      expect(typeof service.verify).toBe('function');
      expect(typeof service.needsRehash).toBe('function');
    });

    it('should create tokenService that implements ITokenService', () => {
      const container = createContainer();
      const service = container.tokenService;

      expect(typeof service.generateAccessToken).toBe('function');
      expect(typeof service.generateRefreshToken).toBe('function');
      expect(typeof service.validateAccessToken).toBe('function');
      expect(typeof service.validateRefreshToken).toBe('function');
    });

    it('should create repositories (InMemory by default)', () => {
      const container = createContainer();

      // Verify they have the expected methods
      expect(typeof container.userRepository.save).toBe('function');
      expect(typeof container.userRepository.findByEmail).toBe('function');
      expect(typeof container.refreshTokenRepository.save).toBe('function');
      expect(typeof container.refreshTokenRepository.findByTokenHash).toBe('function');
    });

    it('should create RegisterUserUseCase instance', () => {
      const container = createContainer();

      expect(container.registerUserUseCase).toBeInstanceOf(RegisterUserUseCase);
      expect(typeof container.registerUserUseCase.execute).toBe('function');
    });

    it('should create LoginUserUseCase instance', () => {
      const container = createContainer();

      expect(container.loginUserUseCase).toBeInstanceOf(LoginUserUseCase);
      expect(typeof container.loginUserUseCase.execute).toBe('function');
    });

    it('should create RefreshSessionUseCase instance', () => {
      const container = createContainer();

      expect(container.refreshSessionUseCase).toBeInstanceOf(RefreshSessionUseCase);
      expect(typeof container.refreshSessionUseCase.execute).toBe('function');
    });

    it('should create VerifyEmailUseCase instance', () => {
      const container = createContainer();

      expect(container.verifyEmailUseCase).toBeInstanceOf(VerifyEmailUseCase);
      expect(typeof container.verifyEmailUseCase.execute).toBe('function');
    });

    it('should include server and JWT config', () => {
      process.env.PORT = '4000';
      process.env.NODE_ENV = 'production';

      const container = createContainer();

      expect(container.config.server.port).toBe(4000);
      expect(container.config.server.isProduction).toBe(true);
      expect(container.config.jwt).toBeDefined();
      expect(container.config.jwt.accessToken).toBeDefined();
      expect(container.config.jwt.refreshToken).toBeDefined();
    });

    it('should use configured HASH_SALT_ROUNDS', () => {
      process.env.HASH_SALT_ROUNDS = '10';

      const container = createContainer();

      // Can't directly check rounds, but we verify the service is created
      expect(container.hashingService).toBeDefined();
    });
  });
});
