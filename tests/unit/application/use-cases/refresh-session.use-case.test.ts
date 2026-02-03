/**
 * ============================================
 * UNIT TEST: RefreshSession Use Case
 * ============================================
 *
 * Tests unitarios para el caso de uso de refresh.
 * Incluye tests de seguridad para rotación de tokens.
 *
 * CASOS TESTEADOS:
 * - Refresh exitoso con rotación
 * - Token expirado
 * - Token revocado
 * - CRÍTICO: Detección de reuso de token
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RefreshSessionUseCase,
  RefreshSessionDependencies,
} from '../../../../src/application/use-cases/auth/refresh-session.use-case.js';
import { RefreshSessionRequestDto } from '../../../../src/application/dtos/auth/refresh-session.dto.js';
import { UserRepository } from '../../../../src/domain/repositories/user.repository.interface.js';
import { RefreshTokenRepository } from '../../../../src/domain/repositories/refresh-token.repository.interface.js';
import { ITokenService } from '../../../../src/application/ports/token.service.port.js';
import { IUuidGenerator } from '../../../../src/application/ports/uuid-generator.port.js';
import { IDateTimeService } from '../../../../src/application/ports/datetime.service.port.js';
import { ILogger } from '../../../../src/application/ports/logger.port.js';
import { User, UserStatus } from '../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';
import { AccessToken } from '../../../../src/domain/value-objects/access-token.value-object.js';
import {
  RefreshToken,
  RefreshTokenStatus,
} from '../../../../src/domain/value-objects/refresh-token.value-object.js';
import {
  InvalidRefreshTokenError,
  RefreshTokenExpiredError,
  RefreshTokenRevokedError,
  RefreshTokenReuseDetectedError,
} from '../../../../src/domain/errors/authentication.errors.js';
import {
  UserNotFoundError,
  UserNotActiveError,
} from '../../../../src/domain/errors/user.errors.js';

describe('RefreshSession Use Case', () => {
  // Mocks
  let mockUserRepository: UserRepository;
  let mockRefreshTokenRepository: RefreshTokenRepository;
  let mockTokenService: ITokenService;
  let mockUuidGenerator: IUuidGenerator;
  let mockDateTimeService: IDateTimeService;
  let mockLogger: ILogger;

  // Use case instance
  let useCase: RefreshSessionUseCase;

  // Test data
  const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
  const OLD_TOKEN_ID = 'old-token-id-001';
  const NEW_TOKEN_ID = 'new-token-id-002';
  const VALID_EMAIL = 'test@example.com';
  const VALID_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';
  const FIXED_DATE = new Date('2024-01-15T10:00:00Z');
  const OLD_REFRESH_TOKEN_VALUE = 'old_refresh_token_xyz789';
  const NEW_REFRESH_TOKEN_VALUE = 'new_refresh_token_abc123';
  const NEW_ACCESS_TOKEN_VALUE = 'new_access_token_def456';

  const validRequest: RefreshSessionRequestDto = {
    refreshToken: OLD_REFRESH_TOKEN_VALUE,
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

  // Helper to create an active refresh token
  const createActiveRefreshToken = (): RefreshToken => {
    return RefreshToken.createNew(
      OLD_REFRESH_TOKEN_VALUE,
      OLD_TOKEN_ID,
      VALID_UUID,
      new Date('2024-01-14T10:00:00Z'),
      new Date('2024-01-17T10:00:00Z'), // 3 days later
      'Chrome/Windows'
    );
  };

  // Helper to create a rotated refresh token
  const createRotatedRefreshToken = (): RefreshToken => {
    const token = createActiveRefreshToken();
    return token.markAsRotated();
  };

  // Helper to create a revoked refresh token
  const createRevokedRefreshToken = (): RefreshToken => {
    const token = createActiveRefreshToken();
    return token.markAsRevoked();
  };

  // Helper to create an expired refresh token
  const createExpiredRefreshToken = (): RefreshToken => {
    return RefreshToken.createNew(
      OLD_REFRESH_TOKEN_VALUE,
      OLD_TOKEN_ID,
      VALID_UUID,
      new Date('2024-01-10T10:00:00Z'),
      new Date('2024-01-13T10:00:00Z'), // Already expired
      'Chrome/Windows'
    );
  };

  beforeEach(() => {
    // Setup mock implementations
    mockUserRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createActiveUser()),
      findByEmail: vi.fn().mockResolvedValue(createActiveUser()),
      existsByEmail: vi.fn().mockResolvedValue(true),
      findAll: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrevious: false }),
    };

    mockRefreshTokenRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      revoke: vi.fn().mockResolvedValue(undefined),
      revokeAllByUser: vi.fn().mockResolvedValue(0),
      revokeFamily: vi.fn().mockResolvedValue(1),
      deleteExpired: vi.fn().mockResolvedValue(0),
      findById: vi.fn().mockResolvedValue(createActiveRefreshToken()),
      findByTokenHash: vi.fn().mockResolvedValue(createActiveRefreshToken()),
      findActiveByUser: vi.fn().mockResolvedValue([]),
      countActiveByUser: vi.fn().mockResolvedValue(0),
      isActiveToken: vi.fn().mockResolvedValue(true),
      findFamilyRootId: vi.fn().mockResolvedValue(OLD_TOKEN_ID),
    };

    const mockNewAccessToken = AccessToken.create(
      NEW_ACCESS_TOKEN_VALUE,
      VALID_UUID,
      FIXED_DATE,
      new Date(FIXED_DATE.getTime() + AccessToken.VALIDITY_SECONDS * 1000)
    );

    const mockNewRefreshToken = RefreshToken.createNew(
      NEW_REFRESH_TOKEN_VALUE,
      NEW_TOKEN_ID,
      VALID_UUID,
      FIXED_DATE,
      new Date(FIXED_DATE.getTime() + RefreshToken.VALIDITY_SECONDS * 1000),
      'Chrome/Windows'
    );

    mockTokenService = {
      generateAccessToken: vi.fn().mockResolvedValue(mockNewAccessToken),
      generateRefreshToken: vi.fn().mockResolvedValue(mockNewRefreshToken),
      validateAccessToken: vi.fn().mockResolvedValue({ isValid: true }),
      validateRefreshToken: vi.fn().mockResolvedValue({
        isValid: true,
        payload: { userId: VALID_UUID, tokenId: OLD_TOKEN_ID },
      }),
      decodeAccessToken: vi.fn().mockReturnValue(null),
      hashRefreshToken: vi.fn().mockResolvedValue('hashed_token'),
    };

    mockUuidGenerator = {
      generate: vi.fn().mockReturnValue(NEW_TOKEN_ID),
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

    const deps: RefreshSessionDependencies = {
      userRepository: mockUserRepository,
      refreshTokenRepository: mockRefreshTokenRepository,
      tokenService: mockTokenService,
      uuidGenerator: mockUuidGenerator,
      dateTimeService: mockDateTimeService,
      logger: mockLogger,
    };

    useCase = new RefreshSessionUseCase(deps);
  });

  describe('execute()', () => {
    describe('successful refresh', () => {
      it('should return new access token', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.success).toBe(true);
        expect(result.tokens.accessToken).toBe(NEW_ACCESS_TOKEN_VALUE);
      });

      it('should return NEW refresh token (rotation)', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.tokens.refreshToken).toBe(NEW_REFRESH_TOKEN_VALUE);
        expect(result.tokens.refreshToken).not.toBe(OLD_REFRESH_TOKEN_VALUE);
      });

      it('should mark old refresh token as ROTATED', async () => {
        await useCase.execute(validRequest);

        expect(mockRefreshTokenRepository.updateStatus).toHaveBeenCalledWith(
          OLD_TOKEN_ID,
          RefreshTokenStatus.ROTATED
        );
      });

      it('should store new refresh token', async () => {
        await useCase.execute(validRequest);

        expect(mockRefreshTokenRepository.save).toHaveBeenCalledTimes(1);
      });

      it('should generate tokens with correct expiration', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.tokens.expiresIn).toBe(AccessToken.VALIDITY_SECONDS);
        expect(result.tokens.refreshExpiresIn).toBe(RefreshToken.VALIDITY_SECONDS);
      });
    });

    describe('token validation failures', () => {
      it('should throw InvalidRefreshTokenError for malformed token', async () => {
        (mockTokenService.validateRefreshToken as ReturnType<typeof vi.fn>).mockResolvedValue({
          isValid: false,
          error: 'malformed',
        });

        await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidRefreshTokenError);
      });

      it('should throw InvalidRefreshTokenError for invalid signature', async () => {
        (mockTokenService.validateRefreshToken as ReturnType<typeof vi.fn>).mockResolvedValue({
          isValid: false,
          error: 'invalid_signature',
        });

        await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidRefreshTokenError);
      });

      it('should throw InvalidRefreshTokenError when token not found in database', async () => {
        (mockRefreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidRefreshTokenError);
      });

      it('should throw RefreshTokenExpiredError for expired token', async () => {
        (mockRefreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(
          createExpiredRefreshToken()
        );

        await expect(useCase.execute(validRequest)).rejects.toThrow(RefreshTokenExpiredError);
      });
    });

    describe('token status failures', () => {
      it('should throw RefreshTokenRevokedError for revoked token', async () => {
        (mockRefreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(
          createRevokedRefreshToken()
        );

        await expect(useCase.execute(validRequest)).rejects.toThrow(RefreshTokenRevokedError);
      });
    });

    describe('SECURITY: Token reuse detection', () => {
      it('should detect reuse of ROTATED token', async () => {
        (mockRefreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(
          createRotatedRefreshToken()
        );

        await expect(useCase.execute(validRequest)).rejects.toThrow(RefreshTokenReuseDetectedError);
      });

      it('should revoke entire token family on reuse detection', async () => {
        (mockRefreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(
          createRotatedRefreshToken()
        );

        try {
          await useCase.execute(validRequest);
        } catch {
          // Expected error
        }

        expect(mockRefreshTokenRepository.revokeFamily).toHaveBeenCalledWith(OLD_TOKEN_ID);
      });

      it('should log security breach event', async () => {
        (mockRefreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(
          createRotatedRefreshToken()
        );

        try {
          await useCase.execute(validRequest);
        } catch {
          // Expected error
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('reuse'),
          undefined,
          expect.any(Object)
        );
      });
    });

    describe('user validation', () => {
      it('should throw UserNotFoundError if user was deleted', async () => {
        (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        await expect(useCase.execute(validRequest)).rejects.toThrow(UserNotFoundError);
      });

      it('should throw UserNotActiveError if user was suspended', async () => {
        const suspendedUser = createActiveUser().suspend(new Date());
        (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(suspendedUser);

        await expect(useCase.execute(validRequest)).rejects.toThrow(UserNotActiveError);
      });

      it('should throw UserNotActiveError if user was deactivated', async () => {
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
        (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(deactivatedUser);

        await expect(useCase.execute(validRequest)).rejects.toThrow(UserNotActiveError);
      });
    });

    describe('logging', () => {
      it('should log refresh attempt', async () => {
        await useCase.execute(validRequest);

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('refresh'),
          expect.any(Object)
        );
      });

      it('should log successful refresh', async () => {
        await useCase.execute(validRequest);

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('success'),
          expect.any(Object)
        );
      });
    });
  });
});
