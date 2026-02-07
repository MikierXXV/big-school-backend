/**
 * ============================================
 * UNIT TEST: ConfirmPasswordResetUseCase
 * ============================================
 *
 * Tests unitarios para el caso de uso de confirmación de
 * recuperación de contraseña.
 *
 * COMPORTAMIENTO:
 * - Valida token (firma, expiración, propósito)
 * - Verifica token no usado/revocado
 * - Valida fortaleza de nueva contraseña
 * - Actualiza contraseña del usuario
 * - Marca token como usado
 * - Revoca sesiones activas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ConfirmPasswordResetUseCase,
  ConfirmPasswordResetDependencies,
} from '../../../../src/application/use-cases/auth/confirm-password-reset.use-case.js';
import { ConfirmPasswordResetRequestDto } from '../../../../src/application/dtos/auth/password-reset.dto.js';
import { User, UserStatus } from '../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';
import { PasswordResetToken, PasswordResetTokenStatus } from '../../../../src/domain/value-objects/password-reset-token.value-object.js';
import {
  InvalidPasswordResetTokenError,
  PasswordResetTokenExpiredError,
  PasswordResetTokenAlreadyUsedError,
  WeakPasswordError,
} from '../../../../src/domain/errors/authentication.errors.js';
import { PasswordMismatchError } from '../../../../src/application/errors/validation.errors.js';
import { UserNotFoundError } from '../../../../src/domain/errors/user.errors.js';

describe('ConfirmPasswordResetUseCase', () => {
  // Mock dependencies
  let mockUserRepository: ConfirmPasswordResetDependencies['userRepository'];
  let mockPasswordResetTokenRepository: ConfirmPasswordResetDependencies['passwordResetTokenRepository'];
  let mockRefreshTokenRepository: ConfirmPasswordResetDependencies['refreshTokenRepository'];
  let mockTokenService: ConfirmPasswordResetDependencies['tokenService'];
  let mockHashingService: ConfirmPasswordResetDependencies['hashingService'];
  let mockDateTimeService: ConfirmPasswordResetDependencies['dateTimeService'];
  let mockLogger: ConfirmPasswordResetDependencies['logger'];

  let useCase: ConfirmPasswordResetUseCase;

  // Test data
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testEmail = 'user@example.com';
  const testTokenId = '999e4567-e89b-12d3-a456-426614174999';
  const testTokenValue = 'valid.jwt.token';
  const testTokenHash = 'hashed_token_value';
  const testNow = new Date('2024-01-15T10:00:00Z');
  const testExpiresAt = new Date('2024-01-15T10:30:00Z');
  const testNewPassword = 'NewP@ssword123';

  const createTestUser = (status: UserStatus = UserStatus.ACTIVE): User => {
    return User.fromPersistence({
      id: UserId.create(testUserId),
      email: Email.create(testEmail),
      passwordHash: PasswordHash.fromHash('$2b$12$hashedpasswordhashhashedpasswordhashhashedpassword'),
      firstName: 'Test',
      lastName: 'User',
      status,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      lastLoginAt: null,
      emailVerifiedAt: status === UserStatus.ACTIVE ? new Date('2024-01-02') : null,
    });
  };

  const createTestToken = (
    status: PasswordResetTokenStatus = PasswordResetTokenStatus.ACTIVE
  ): PasswordResetToken => {
    const token = PasswordResetToken.createNew(
      testTokenValue,
      testTokenId,
      testUserId,
      testEmail,
      new Date('2024-01-15T10:00:00Z'),
      testExpiresAt
    );

    if (status === PasswordResetTokenStatus.USED) {
      return token.markAsUsed(new Date('2024-01-15T10:15:00Z'));
    }
    if (status === PasswordResetTokenStatus.REVOKED) {
      return token.markAsRevoked(new Date('2024-01-15T10:15:00Z'));
    }
    return token;
  };

  beforeEach(() => {
    // Reset mocks
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      existsByEmail: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
    } as unknown as ConfirmPasswordResetDependencies['userRepository'];

    mockPasswordResetTokenRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByTokenHash: vi.fn(),
      findActiveByUserId: vi.fn(),
      markAsUsed: vi.fn(),
      updateStatus: vi.fn(),
      revokeAllByUser: vi.fn().mockResolvedValue(0),
      deleteExpired: vi.fn(),
      hasActiveToken: vi.fn(),
      countRequestsSince: vi.fn().mockResolvedValue(0),
    } as unknown as ConfirmPasswordResetDependencies['passwordResetTokenRepository'];

    mockRefreshTokenRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByTokenHash: vi.fn(),
      findByUserId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByUserId: vi.fn(),
      revokeByUserId: vi.fn().mockResolvedValue(0),
      revokeAllByUser: vi.fn().mockResolvedValue(0),
    } as unknown as ConfirmPasswordResetDependencies['refreshTokenRepository'];

    mockTokenService = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      validateAccessToken: vi.fn().mockResolvedValue({
        isValid: true,
        payload: {
          userId: testUserId,
          email: testEmail,
          claims: { purpose: 'password_reset', tokenId: testTokenId },
        },
      }),
      validateRefreshToken: vi.fn(),
      decodeAccessToken: vi.fn(),
      hashRefreshToken: vi.fn().mockResolvedValue(testTokenHash),
    } as unknown as ConfirmPasswordResetDependencies['tokenService'];

    mockHashingService = {
      hash: vi.fn().mockResolvedValue(
        PasswordHash.fromHash('$2b$12$newhashnewhashnewhashnewhashnewhashnewhashne')
      ),
      verify: vi.fn(),
      needsRehash: vi.fn(),
    } as unknown as ConfirmPasswordResetDependencies['hashingService'];

    mockDateTimeService = {
      now: vi.fn().mockReturnValue(testNow),
    } as unknown as ConfirmPasswordResetDependencies['dateTimeService'];

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as ConfirmPasswordResetDependencies['logger'];

    useCase = new ConfirmPasswordResetUseCase({
      userRepository: mockUserRepository,
      passwordResetTokenRepository: mockPasswordResetTokenRepository,
      refreshTokenRepository: mockRefreshTokenRepository,
      tokenService: mockTokenService,
      hashingService: mockHashingService,
      dateTimeService: mockDateTimeService,
      logger: mockLogger,
    });
  });

  describe('execute() - Successful reset', () => {
    it('should reset password with valid token', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      const result = await useCase.execute(request);

      expect(result.message).toContain('successfully');
      expect(result.user.id).toBe(testUserId);
      expect(result.user.email).toBe(testEmail);
    });

    it('should update user password', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await useCase.execute(request);

      expect(mockHashingService.hash).toHaveBeenCalledWith(testNewPassword);
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('should mark token as used', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await useCase.execute(request);

      expect(mockPasswordResetTokenRepository.markAsUsed).toHaveBeenCalledWith(
        testTokenId,
        expect.any(Date)
      );
    });

    it('should revoke all user sessions', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await useCase.execute(request);

      expect(mockRefreshTokenRepository.revokeAllByUser).toHaveBeenCalled();
    });
  });

  describe('execute() - Token validation', () => {
    it('should reject invalid token signature', async () => {
      vi.mocked(mockTokenService.validateAccessToken).mockResolvedValue({
        isValid: false,
        error: 'invalid_signature',
      });

      const request: ConfirmPasswordResetRequestDto = {
        token: 'invalid.token.here',
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await expect(useCase.execute(request)).rejects.toThrow(InvalidPasswordResetTokenError);
    });

    it('should reject expired token', async () => {
      vi.mocked(mockTokenService.validateAccessToken).mockResolvedValue({
        isValid: false,
        error: 'expired',
      });

      const request: ConfirmPasswordResetRequestDto = {
        token: 'expired.token.here',
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await expect(useCase.execute(request)).rejects.toThrow(PasswordResetTokenExpiredError);
    });

    it('should reject malformed token', async () => {
      vi.mocked(mockTokenService.validateAccessToken).mockResolvedValue({
        isValid: false,
        error: 'malformed',
      });

      const request: ConfirmPasswordResetRequestDto = {
        token: 'malformed_token',
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await expect(useCase.execute(request)).rejects.toThrow(InvalidPasswordResetTokenError);
    });

    it('should reject token without purpose claim', async () => {
      vi.mocked(mockTokenService.validateAccessToken).mockResolvedValue({
        isValid: true,
        payload: {
          userId: testUserId,
          email: testEmail,
          claims: {}, // No purpose
        },
      });

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await expect(useCase.execute(request)).rejects.toThrow(InvalidPasswordResetTokenError);
    });

    it('should reject token with wrong purpose', async () => {
      vi.mocked(mockTokenService.validateAccessToken).mockResolvedValue({
        isValid: true,
        payload: {
          userId: testUserId,
          email: testEmail,
          claims: { purpose: 'email_verification' }, // Wrong purpose
        },
      });

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await expect(useCase.execute(request)).rejects.toThrow(InvalidPasswordResetTokenError);
    });

    it('should reject token not found in repository', async () => {
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(null);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await expect(useCase.execute(request)).rejects.toThrow(InvalidPasswordResetTokenError);
    });

    it('should reject already used token', async () => {
      const usedToken = createTestToken(PasswordResetTokenStatus.USED);
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(usedToken);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await expect(useCase.execute(request)).rejects.toThrow(PasswordResetTokenAlreadyUsedError);
    });

    it('should reject revoked token', async () => {
      const revokedToken = createTestToken(PasswordResetTokenStatus.REVOKED);
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(revokedToken);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await expect(useCase.execute(request)).rejects.toThrow(InvalidPasswordResetTokenError);
    });
  });

  describe('execute() - User validation', () => {
    it('should reject if user not found', async () => {
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await expect(useCase.execute(request)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('execute() - Password validation', () => {
    it('should reject passwords that do not match', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: 'DifferentP@ss123',
      };

      await expect(useCase.execute(request)).rejects.toThrow(PasswordMismatchError);
    });

    it('should reject weak password (too short)', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: 'Sh0rt!',
        passwordConfirmation: 'Sh0rt!',
      };

      await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
    });

    it('should reject password without uppercase', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: 'lowercase123!',
        passwordConfirmation: 'lowercase123!',
      };

      await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
    });

    it('should reject password without lowercase', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: 'UPPERCASE123!',
        passwordConfirmation: 'UPPERCASE123!',
      };

      await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
    });

    it('should reject password without number', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: 'NoNumbers!',
        passwordConfirmation: 'NoNumbers!',
      };

      await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
    });

    it('should reject password without special character', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: 'NoSpecial123',
        passwordConfirmation: 'NoSpecial123',
      };

      await expect(useCase.execute(request)).rejects.toThrow(WeakPasswordError);
    });
  });

  describe('Logging', () => {
    it('should log start of operation', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await useCase.execute(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('password reset')
      );
    });

    it('should log successful password reset', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await useCase.execute(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('successfully'),
        expect.objectContaining({ userId: testUserId })
      );
    });

    it('should not log sensitive information', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      const token = createTestToken(PasswordResetTokenStatus.ACTIVE);

      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(token);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const request: ConfirmPasswordResetRequestDto = {
        token: testTokenValue,
        newPassword: testNewPassword,
        passwordConfirmation: testNewPassword,
      };

      await useCase.execute(request);

      const allLogCalls = [
        ...vi.mocked(mockLogger.info).mock.calls,
        ...vi.mocked(mockLogger.debug).mock.calls,
      ];

      allLogCalls.forEach(call => {
        const logArgs = JSON.stringify(call);
        expect(logArgs).not.toContain(testNewPassword);
        expect(logArgs).not.toContain(testTokenValue);
      });
    });
  });
});
