/**
 * ============================================
 * UNIT TEST: VerifyEmail Use Case
 * ============================================
 *
 * Tests unitarios para el caso de uso de verificación de email.
 * Usa mocks para las dependencias (ports).
 *
 * CASOS TESTEADOS:
 * - Verificación exitosa de email
 * - Token expirado
 * - Token malformado
 * - Usuario no encontrado
 * - Email ya verificado
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  VerifyEmailUseCase,
  VerifyEmailDependencies,
} from '../../../../src/application/use-cases/auth/verify-email.use-case.js';
import { VerifyEmailRequestDto } from '../../../../src/application/dtos/auth/verify-email.dto.js';
import { UserRepository } from '../../../../src/domain/repositories/user.repository.interface.js';
import { ITokenService, AccessTokenPayload, AccessTokenValidationResult } from '../../../../src/application/ports/token.service.port.js';
import { IDateTimeService } from '../../../../src/application/ports/datetime.service.port.js';
import { ILogger } from '../../../../src/application/ports/logger.port.js';
import { User, UserStatus } from '../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';
import { UserNotFoundError } from '../../../../src/domain/errors/user.errors.js';
import {
  InvalidVerificationTokenError,
  VerificationTokenExpiredError,
  EmailAlreadyVerifiedError,
} from '../../../../src/domain/errors/authentication.errors.js';

describe('VerifyEmail Use Case', () => {
  // Mocks
  let mockUserRepository: UserRepository;
  let mockTokenService: ITokenService;
  let mockDateTimeService: IDateTimeService;
  let mockLogger: ILogger;

  // Use case instance
  let useCase: VerifyEmailUseCase;

  // Test data
  const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
  const VALID_EMAIL = 'test@example.com';
  const VALID_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';
  const FIXED_DATE = new Date('2024-01-15T10:00:00Z');
  const VALID_TOKEN = 'valid.jwt.token';

  const validTokenPayload: AccessTokenPayload = {
    userId: VALID_UUID,
    email: VALID_EMAIL,
  };

  const validRequest: VerifyEmailRequestDto = {
    token: VALID_TOKEN,
  };

  // Helper to create a mock user
  function createMockUser(overrides: Partial<{
    status: UserStatus;
    emailVerifiedAt: Date | null;
  }> = {}): User {
    const userId = UserId.create(VALID_UUID);
    const email = Email.create(VALID_EMAIL);
    const passwordHash = PasswordHash.fromHash(VALID_HASH);

    const user = User.fromPersistence({
      id: userId,
      email,
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      status: overrides.status ?? UserStatus.PENDING_VERIFICATION,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
      lastLoginAt: null,
      emailVerifiedAt: overrides.emailVerifiedAt ?? null,
    });

    return user;
  }

  beforeEach(() => {
    // Setup mock implementations
    mockUserRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createMockUser()),
      findByEmail: vi.fn().mockResolvedValue(null),
      existsByEmail: vi.fn().mockResolvedValue(false),
      findAll: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrevious: false }),
    };

    mockTokenService = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      validateAccessToken: vi.fn().mockResolvedValue({
        isValid: true,
        payload: validTokenPayload,
      } as AccessTokenValidationResult),
      validateRefreshToken: vi.fn(),
      decodeAccessToken: vi.fn().mockReturnValue(validTokenPayload),
      hashRefreshToken: vi.fn(),
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

    const deps: VerifyEmailDependencies = {
      userRepository: mockUserRepository,
      tokenService: mockTokenService,
      dateTimeService: mockDateTimeService,
      logger: mockLogger,
    };

    useCase = new VerifyEmailUseCase(deps);
  });

  describe('execute()', () => {
    describe('successful verification', () => {
      it('should verify email successfully with valid token', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.success).toBe(true);
        expect(result.message).toContain('verified');
      });

      it('should return verified user data', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.user).toBeDefined();
        expect(result.user.id).toBe(VALID_UUID);
        expect(result.user.email).toBe(VALID_EMAIL);
        expect(result.user.status).toBe(UserStatus.ACTIVE);
      });

      it('should change status from PENDING_VERIFICATION to ACTIVE', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.user.status).toBe(UserStatus.ACTIVE);
      });

      it('should set emailVerifiedAt timestamp', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.user.emailVerifiedAt).toBeDefined();
        expect(result.user.emailVerifiedAt).toBe(FIXED_DATE.toISOString());
      });

      it('should validate the token', async () => {
        await useCase.execute(validRequest);

        expect(mockTokenService.validateAccessToken).toHaveBeenCalledWith(VALID_TOKEN);
      });

      it('should find user by ID from token payload', async () => {
        await useCase.execute(validRequest);

        expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      });

      it('should update the user in the repository', async () => {
        await useCase.execute(validRequest);

        expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
        const updatedUser = (mockUserRepository.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(updatedUser).toBeInstanceOf(User);
        expect(updatedUser.status).toBe(UserStatus.ACTIVE);
        expect(updatedUser.emailVerifiedAt).toBeDefined();
      });
    });

    describe('token validation failures', () => {
      it('should throw VerificationTokenExpiredError when token is expired', async () => {
        (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
          isValid: false,
          error: 'expired',
        } as AccessTokenValidationResult);

        await expect(useCase.execute(validRequest)).rejects.toThrow(VerificationTokenExpiredError);
      });

      it('should throw InvalidVerificationTokenError when token signature is invalid', async () => {
        (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
          isValid: false,
          error: 'invalid_signature',
        } as AccessTokenValidationResult);

        await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidVerificationTokenError);
      });

      it('should throw InvalidVerificationTokenError when token is malformed', async () => {
        (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
          isValid: false,
          error: 'malformed',
        } as AccessTokenValidationResult);

        await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidVerificationTokenError);
      });

      it('should throw InvalidVerificationTokenError when payload is missing userId', async () => {
        (mockTokenService.validateAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue({
          isValid: true,
          payload: { email: VALID_EMAIL } as AccessTokenPayload,
        } as AccessTokenValidationResult);

        await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidVerificationTokenError);
      });
    });

    describe('user validation failures', () => {
      it('should throw UserNotFoundError when user does not exist', async () => {
        (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        await expect(useCase.execute(validRequest)).rejects.toThrow(UserNotFoundError);
      });

      it('should throw EmailAlreadyVerifiedError when email is already verified', async () => {
        const verifiedUser = createMockUser({
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date('2024-01-10T10:00:00Z'),
        });
        (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(verifiedUser);

        await expect(useCase.execute(validRequest)).rejects.toThrow(EmailAlreadyVerifiedError);
      });
    });

    describe('logging', () => {
      it('should log verification start', async () => {
        await useCase.execute(validRequest);

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('verification'),
          expect.any(Object)
        );
      });

      it('should log verification success', async () => {
        await useCase.execute(validRequest);

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('verified'),
          expect.objectContaining({ userId: VALID_UUID })
        );
      });

      it('should log warning when email already verified', async () => {
        const verifiedUser = createMockUser({
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date('2024-01-10T10:00:00Z'),
        });
        (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(verifiedUser);

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
