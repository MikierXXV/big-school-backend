/**
 * ============================================
 * UNIT TEST: RegisterUser Use Case
 * ============================================
 *
 * Tests unitarios para el caso de uso de registro.
 * Usa mocks para las dependencias (ports).
 *
 * CASOS TESTEADOS:
 * - Registro exitoso
 * - Email ya registrado
 * - Contraseña débil
 * - Contraseñas no coinciden
 * - Términos no aceptados
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RegisterUserUseCase,
  RegisterUserDependencies,
} from '../../../../src/application/use-cases/auth/register-user.use-case.js';
import { RegisterUserRequestDto } from '../../../../src/application/dtos/auth/register.dto.js';
import { UserRepository } from '../../../../src/domain/repositories/user.repository.interface.js';
import { IHashingService } from '../../../../src/application/ports/hashing.service.port.js';
import { IUuidGenerator } from '../../../../src/application/ports/uuid-generator.port.js';
import { IDateTimeService } from '../../../../src/application/ports/datetime.service.port.js';
import { ITokenService } from '../../../../src/application/ports/token.service.port.js';
import { ILogger } from '../../../../src/application/ports/logger.port.js';
import { AccessToken } from '../../../../src/domain/value-objects/access-token.value-object.js';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';
import { User, UserStatus } from '../../../../src/domain/entities/user.entity.js';
import { UserAlreadyExistsError } from '../../../../src/domain/errors/user.errors.js';
import { WeakPasswordError } from '../../../../src/domain/errors/authentication.errors.js';
import {
  PasswordMismatchError,
  TermsNotAcceptedError,
} from '../../../../src/application/errors/validation.errors.js';

describe('RegisterUser Use Case', () => {
  // Mocks
  let mockUserRepository: UserRepository;
  let mockHashingService: IHashingService;
  let mockUuidGenerator: IUuidGenerator;
  let mockDateTimeService: IDateTimeService;
  let mockTokenService: ITokenService;
  let mockLogger: ILogger;

  // Use case instance
  let useCase: RegisterUserUseCase;

  // Test data
  const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
  const VALID_EMAIL = 'test@example.com';
  const VALID_PASSWORD = 'SecurePass123!';
  const VALID_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';
  const FIXED_DATE = new Date('2024-01-15T10:00:00Z');

  const validRequest: RegisterUserRequestDto = {
    email: VALID_EMAIL,
    password: VALID_PASSWORD,
    passwordConfirmation: VALID_PASSWORD,
    firstName: 'John',
    lastName: 'Doe',
    acceptTerms: true,
  };

  beforeEach(() => {
    // Setup mock implementations
    mockUserRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      existsByEmail: vi.fn().mockResolvedValue(false),
      findAll: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrevious: false }),
    };

    mockHashingService = {
      hash: vi.fn().mockResolvedValue(PasswordHash.fromHash(VALID_HASH)),
      verify: vi.fn().mockResolvedValue(true),
      needsRehash: vi.fn().mockReturnValue(false),
    };

    mockUuidGenerator = {
      generate: vi.fn().mockReturnValue(VALID_UUID),
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

    mockTokenService = {
      generateAccessToken: vi.fn().mockResolvedValue(
        AccessToken.create(
          'mock.verification.token',
          VALID_UUID,
          FIXED_DATE,
          new Date(FIXED_DATE.getTime() + 18000000)
        )
      ),
      generateRefreshToken: vi.fn(),
      validateAccessToken: vi.fn(),
      validateRefreshToken: vi.fn(),
      decodeAccessToken: vi.fn(),
      hashRefreshToken: vi.fn(),
    };

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
      setLevel: vi.fn(),
    };

    const deps: RegisterUserDependencies = {
      userRepository: mockUserRepository,
      hashingService: mockHashingService,
      uuidGenerator: mockUuidGenerator,
      dateTimeService: mockDateTimeService,
      tokenService: mockTokenService,
      logger: mockLogger,
    };

    useCase = new RegisterUserUseCase(deps);
  });

  describe('execute()', () => {
    describe('successful registration', () => {
      it('should create a new user with valid data', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(VALID_EMAIL);
      });

      it('should return success response with user data', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.success).toBe(true);
        expect(result.message).toContain('successfully');
        expect(result.user.id).toBe(VALID_UUID);
        expect(result.user.fullName).toBe('John Doe');
        expect(result.user.requiresEmailVerification).toBe(true);
      });

      it('should hash the password before saving', async () => {
        await useCase.execute(validRequest);

        expect(mockHashingService.hash).toHaveBeenCalledWith(VALID_PASSWORD);
        expect(mockHashingService.hash).toHaveBeenCalledTimes(1);
      });

      it('should set user status to PENDING_VERIFICATION', async () => {
        const result = await useCase.execute(validRequest);

        expect(result.user.status).toBe(UserStatus.PENDING_VERIFICATION);
      });

      it('should generate a unique ID for the user', async () => {
        await useCase.execute(validRequest);

        expect(mockUuidGenerator.generate).toHaveBeenCalledTimes(1);
      });

      it('should save the user to the repository', async () => {
        await useCase.execute(validRequest);

        expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
        const savedUser = (mockUserRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(savedUser).toBeInstanceOf(User);
        expect(savedUser.email.value).toBe(VALID_EMAIL);
      });

      it('should check if email already exists before creating user', async () => {
        await useCase.execute(validRequest);

        expect(mockUserRepository.existsByEmail).toHaveBeenCalledTimes(1);
      });
    });

    describe('validation failures', () => {
      it('should throw PasswordMismatchError when passwords do not match', async () => {
        const request: RegisterUserRequestDto = {
          ...validRequest,
          passwordConfirmation: 'DifferentPassword123!',
        };

        await expect(useCase.execute(request)).rejects.toThrow(PasswordMismatchError);
      });

      it('should throw TermsNotAcceptedError when acceptTerms is false', async () => {
        const request: RegisterUserRequestDto = {
          ...validRequest,
          acceptTerms: false,
        };

        await expect(useCase.execute(request)).rejects.toThrow(TermsNotAcceptedError);
      });

      it('should throw WeakPasswordError when password is too short', async () => {
        const request: RegisterUserRequestDto = {
          ...validRequest,
          password: 'Short1!',
          passwordConfirmation: 'Short1!',
        };

        await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
      });

      it('should throw WeakPasswordError when password has no uppercase', async () => {
        const request: RegisterUserRequestDto = {
          ...validRequest,
          password: 'lowercase123!',
          passwordConfirmation: 'lowercase123!',
        };

        await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
      });

      it('should throw WeakPasswordError when password has no lowercase', async () => {
        const request: RegisterUserRequestDto = {
          ...validRequest,
          password: 'UPPERCASE123!',
          passwordConfirmation: 'UPPERCASE123!',
        };

        await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
      });

      it('should throw WeakPasswordError when password has no number', async () => {
        const request: RegisterUserRequestDto = {
          ...validRequest,
          password: 'NoNumbers!@#',
          passwordConfirmation: 'NoNumbers!@#',
        };

        await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
      });

      it('should throw WeakPasswordError when password has no special character', async () => {
        const request: RegisterUserRequestDto = {
          ...validRequest,
          password: 'NoSpecial123',
          passwordConfirmation: 'NoSpecial123',
        };

        await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
      });
    });

    describe('business rule failures', () => {
      it('should throw UserAlreadyExistsError when email is taken', async () => {
        (mockUserRepository.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

        await expect(useCase.execute(validRequest)).rejects.toThrow(UserAlreadyExistsError);
      });

      it('should not save user when email already exists', async () => {
        (mockUserRepository.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

        try {
          await useCase.execute(validRequest);
        } catch {
          // Expected error
        }

        expect(mockUserRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('logging', () => {
      it('should log registration start', async () => {
        await useCase.execute(validRequest);

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('registration'),
          expect.objectContaining({ email: VALID_EMAIL })
        );
      });

      it('should log registration success', async () => {
        await useCase.execute(validRequest);

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('success'),
          expect.objectContaining({ userId: VALID_UUID })
        );
      });

      it('should log when email already exists', async () => {
        (mockUserRepository.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

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
