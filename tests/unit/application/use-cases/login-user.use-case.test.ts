/**
 * ============================================
 * UNIT TEST: LoginUser Use Case
 * ============================================
 *
 * Tests unitarios para el caso de uso de login.
 * Usa mocks para las dependencias (ports).
 *
 * CASOS TESTEADOS:
 * - Login exitoso
 * - Usuario no encontrado
 * - Contraseña incorrecta
 * - Usuario no activo
 * - Generación de tokens
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LoginUserUseCase,
  LoginUserDependencies,
} from '../../../../src/application/use-cases/auth/login-user.use-case.js';
import { LoginUserRequestDto } from '../../../../src/application/dtos/auth/login.dto.js';
import { UserRepository } from '../../../../src/domain/repositories/user.repository.interface.js';
import { RefreshTokenRepository } from '../../../../src/domain/repositories/refresh-token.repository.interface.js';
import { ITokenService } from '../../../../src/application/ports/token.service.port.js';
import { IHashingService } from '../../../../src/application/ports/hashing.service.port.js';
import { IUuidGenerator } from '../../../../src/application/ports/uuid-generator.port.js';
import { IDateTimeService } from '../../../../src/application/ports/datetime.service.port.js';
import { ILogger } from '../../../../src/application/ports/logger.port.js';
import { User, UserStatus } from '../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';
import { AccessToken } from '../../../../src/domain/value-objects/access-token.value-object.js';
import { RefreshToken } from '../../../../src/domain/value-objects/refresh-token.value-object.js';
import {
  InvalidCredentialsError,
} from '../../../../src/domain/errors/authentication.errors.js';
import {
  UserNotActiveError,
} from '../../../../src/domain/errors/user.errors.js';

describe('LoginUser Use Case', () => {
  // Mocks
  let mockUserRepository: UserRepository;
  let mockRefreshTokenRepository: RefreshTokenRepository;
  let mockTokenService: ITokenService;
  let mockHashingService: IHashingService;
  let mockUuidGenerator: IUuidGenerator;
  let mockDateTimeService: IDateTimeService;
  let mockLogger: ILogger;

  // Use case instance
  let useCase: LoginUserUseCase;

  // Test data
  const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
  const TOKEN_ID = 'token-id-001';
  const VALID_EMAIL = 'test@example.com';
  const VALID_PASSWORD = 'SecurePass123!';
  const VALID_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';
  const FIXED_DATE = new Date('2024-01-15T10:00:00Z');
  const ACCESS_TOKEN_VALUE = 'access_token_abc123';
  const REFRESH_TOKEN_VALUE = 'refresh_token_xyz789';

  const validRequest: LoginUserRequestDto = {
    email: VALID_EMAIL,
    password: VALID_PASSWORD,
    deviceInfo: 'Chrome/Windows',
  };

  // Helper to create an active user
  const createActiveUser = (): User => {
    const user = User.create({
      id: UserId.create(VALID_UUID),
      email: Email.create(VALID_EMAIL),
      passwordHash: PasswordHash.fromHash(VALID_HASH),
      firstName: 'John',
      lastName: 'Doe',
    });
    return user.verifyEmail(new Date('2024-01-10T10:00:00Z'));
  };

  // Helper to create a pending user
  const createPendingUser = (): User => {
    return User.create({
      id: UserId.create(VALID_UUID),
      email: Email.create(VALID_EMAIL),
      passwordHash: PasswordHash.fromHash(VALID_HASH),
      firstName: 'John',
      lastName: 'Doe',
    });
  };

  // Helper to create a suspended user
  const createSuspendedUser = (): User => {
    const user = createActiveUser();
    return user.suspend(new Date('2024-01-12T10:00:00Z'));
  };

  beforeEach(() => {
    // Setup mock implementations
    mockUserRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(createActiveUser()),
      existsByEmail: vi.fn().mockResolvedValue(true),
      findAll: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrevious: false }),
    };

    mockRefreshTokenRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      revoke: vi.fn().mockResolvedValue(undefined),
      revokeAllByUser: vi.fn().mockResolvedValue(0),
      revokeFamily: vi.fn().mockResolvedValue(0),
      deleteExpired: vi.fn().mockResolvedValue(0),
      findById: vi.fn().mockResolvedValue(null),
      findByTokenHash: vi.fn().mockResolvedValue(null),
      findActiveByUser: vi.fn().mockResolvedValue([]),
      countActiveByUser: vi.fn().mockResolvedValue(0),
      isActiveToken: vi.fn().mockResolvedValue(false),
      findFamilyRootId: vi.fn().mockResolvedValue(null),
    };

    const mockAccessToken = AccessToken.create(
      ACCESS_TOKEN_VALUE,
      VALID_UUID,
      FIXED_DATE,
      new Date(FIXED_DATE.getTime() + AccessToken.VALIDITY_SECONDS * 1000)
    );

    const mockRefreshToken = RefreshToken.createNew(
      REFRESH_TOKEN_VALUE,
      TOKEN_ID,
      VALID_UUID,
      FIXED_DATE,
      new Date(FIXED_DATE.getTime() + RefreshToken.VALIDITY_SECONDS * 1000),
      'Chrome/Windows'
    );

    mockTokenService = {
      generateAccessToken: vi.fn().mockResolvedValue(mockAccessToken),
      generateRefreshToken: vi.fn().mockResolvedValue(mockRefreshToken),
      validateAccessToken: vi.fn().mockResolvedValue({ isValid: true }),
      validateRefreshToken: vi.fn().mockResolvedValue({ isValid: true }),
      decodeAccessToken: vi.fn().mockReturnValue(null),
      hashRefreshToken: vi.fn().mockResolvedValue('hashed_token'),
    };

    mockHashingService = {
      hash: vi.fn().mockResolvedValue(PasswordHash.fromHash(VALID_HASH)),
      verify: vi.fn().mockResolvedValue(true),
      needsRehash: vi.fn().mockReturnValue(false),
    };

    mockUuidGenerator = {
      generate: vi.fn().mockReturnValue(TOKEN_ID),
      isValid: vi.fn().mockReturnValue(true),
    };

    mockDateTimeService = {
      now: vi.fn().mockReturnValue(FIXED_DATE),
      nowTimestamp: vi.fn().mockReturnValue(FIXED_DATE.getTime()),
      nowTimestampSeconds: vi.fn().mockReturnValue(Math.floor(FIXED_DATE.getTime() / 1000)),
      addSeconds: vi.fn().mockImplementation((s) => new Date(FIXED_DATE.getTime() + s * 1000)),
      addMinutes: vi.fn().mockImplementation((m) => new Date(FIXED_DATE.getTime() + m * 60000)),
      addHours: vi.fn().mockImplementation((h) => new Date(FIXED_DATE.getTime() + h * 3600000)),
      addDays: vi.fn().mockImplementation((d) => new Date(FIXED_DATE.getTime() + d * 86400000)),
      isExpired: vi.fn().mockReturnValue(false),
      differenceInSeconds: vi.fn().mockReturnValue(0),
      toISOString: vi.fn().mockImplementation((d) => d.toISOString()),
      fromISOString: vi.fn().mockImplementation((s) => new Date(s)),
    };

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
      setLevel: vi.fn(),
    };

    const deps: LoginUserDependencies = {
      userRepository: mockUserRepository,
      refreshTokenRepository: mockRefreshTokenRepository,
      tokenService: mockTokenService,
      hashingService: mockHashingService,
      uuidGenerator: mockUuidGenerator,
      dateTimeService: mockDateTimeService,
      logger: mockLogger,
    };

    useCase = new LoginUserUseCase(deps);
  });

  describe('execute()', () => {
    describe('successful login', () => {
      it('should return tokens for valid credentials', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.success).toBe(true);
        expect(result.tokens).toBeDefined();
        expect(result.tokens.accessToken).toBe(ACCESS_TOKEN_VALUE);
        expect(result.tokens.refreshToken).toBe(REFRESH_TOKEN_VALUE);
      });

      it('should return user data without sensitive information', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.user).toBeDefined();
        expect(result.user.id).toBe(VALID_UUID);
        expect(result.user.email).toBe(VALID_EMAIL);
        expect(result.user.firstName).toBe('John');
        expect(result.user.lastName).toBe('Doe');
        expect(result.user.fullName).toBe('John Doe');
        // Should NOT contain password or hash
        expect(result.user).not.toHaveProperty('password');
        expect(result.user).not.toHaveProperty('passwordHash');
      });

      it('should generate access token with correct expiration (5 hours)', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.tokens.expiresIn).toBe(AccessToken.VALIDITY_SECONDS);
        expect(result.tokens.tokenType).toBe('Bearer');
      });

      it('should generate refresh token with correct expiration (3 days)', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.tokens.refreshExpiresIn).toBe(RefreshToken.VALIDITY_SECONDS);
      });

      it('should store refresh token in repository', async () => {
        await useCase.execute(validRequest);

        expect(mockRefreshTokenRepository.save).toHaveBeenCalledTimes(1);
      });

      it('should update lastLoginAt', async () => {
        await useCase.execute(validRequest);

        expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
        const updatedUser = (mockUserRepository.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(updatedUser.lastLoginAt).not.toBeNull();
      });

      it('should include device info in refresh token if provided', async () => {
        await useCase.execute(validRequest);

        expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceInfo: 'Chrome/Windows',
          })
        );
      });
    });

    describe('authentication failures', () => {
      it('should throw InvalidCredentialsError for non-existent email', async () => {
        (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidCredentialsError);
      });

      it('should throw InvalidCredentialsError for wrong password', async () => {
        (mockHashingService.verify as ReturnType<typeof vi.fn>).mockResolvedValue(false);

        await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidCredentialsError);
      });

      it('should not reveal whether email exists or password is wrong', async () => {
        // Both cases should throw the same error
        (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        let errorForMissingEmail: Error | undefined;
        try {
          await useCase.execute(validRequest);
        } catch (e) {
          errorForMissingEmail = e as Error;
        }

        // Reset and test wrong password
        (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(createActiveUser());
        (mockHashingService.verify as ReturnType<typeof vi.fn>).mockResolvedValue(false);

        let errorForWrongPassword: Error | undefined;
        try {
          await useCase.execute(validRequest);
        } catch (e) {
          errorForWrongPassword = e as Error;
        }

        // Both should be InvalidCredentialsError with same message
        expect(errorForMissingEmail?.message).toBe(errorForWrongPassword?.message);
      });
    });

    describe('authorization failures', () => {
      it('should throw UserNotActiveError for suspended user', async () => {
        (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(createSuspendedUser());

        await expect(useCase.execute(validRequest)).rejects.toThrow(UserNotActiveError);
      });

      it('should throw UserNotActiveError for deactivated user', async () => {
        const deactivatedUser = User.fromPersistence({
          id: UserId.create(VALID_UUID),
          email: Email.create(VALID_EMAIL),
          passwordHash: PasswordHash.fromHash(VALID_HASH),
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.DEACTIVATED,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          emailVerifiedAt: new Date(),
        });
        (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(deactivatedUser);

        await expect(useCase.execute(validRequest)).rejects.toThrow(UserNotActiveError);
      });

      it('should throw InvalidCredentialsError for pending verification user', async () => {
        (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(createPendingUser());

        // Pending users cannot login, but we throw generic error to not reveal status
        await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidCredentialsError);
      });
    });

    describe('logging', () => {
      it('should log login attempt', async () => {
        await useCase.execute(validRequest);

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Login'),
          expect.objectContaining({ email: VALID_EMAIL })
        );
      });

      it('should log successful login', async () => {
        await useCase.execute(validRequest);

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('success'),
          expect.objectContaining({ userId: VALID_UUID })
        );
      });

      it('should log failed login attempts', async () => {
        (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        try {
          await useCase.execute(validRequest);
        } catch {
          // Expected error
        }

        expect(mockLogger.warn).toHaveBeenCalled();
      });
    });
  });
});
