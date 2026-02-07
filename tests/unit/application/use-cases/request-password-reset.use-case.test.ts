/**
 * ============================================
 * UNIT TEST: RequestPasswordResetUseCase
 * ============================================
 *
 * Tests unitarios para el caso de uso de solicitud de
 * recuperación de contraseña.
 *
 * COMPORTAMIENTO:
 * - Genera token para emails existentes
 * - Respuesta genérica (no revela si email existe)
 * - Revoca tokens anteriores del usuario
 * - Token con expiración de 30 minutos
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RequestPasswordResetUseCase,
  RequestPasswordResetDependencies,
} from '../../../../src/application/use-cases/auth/request-password-reset.use-case.js';
import { RequestPasswordResetRequestDto } from '../../../../src/application/dtos/auth/password-reset.dto.js';
import { User, UserStatus } from '../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';
import { AccessToken } from '../../../../src/domain/value-objects/access-token.value-object.js';

describe('RequestPasswordResetUseCase', () => {
  // Mock dependencies
  let mockUserRepository: RequestPasswordResetDependencies['userRepository'];
  let mockPasswordResetTokenRepository: RequestPasswordResetDependencies['passwordResetTokenRepository'];
  let mockTokenService: RequestPasswordResetDependencies['tokenService'];
  let mockUuidGenerator: RequestPasswordResetDependencies['uuidGenerator'];
  let mockDateTimeService: RequestPasswordResetDependencies['dateTimeService'];
  let mockLogger: RequestPasswordResetDependencies['logger'];

  let useCase: RequestPasswordResetUseCase;

  // Test data
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testEmail = 'user@example.com';
  const testTokenId = '999e4567-e89b-12d3-a456-426614174999';
  const testTokenValue = 'generated.jwt.token';
  const testTokenHash = 'hashed_token_value';
  const testNow = new Date('2024-01-15T10:00:00Z');
  const testExpiresAt = new Date('2024-01-15T10:30:00Z');

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

  beforeEach(() => {
    // Reset mocks - using partial mocks with type casting
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      existsByEmail: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
    } as unknown as RequestPasswordResetDependencies['userRepository'];

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
    } as unknown as RequestPasswordResetDependencies['passwordResetTokenRepository'];

    mockTokenService = {
      generateAccessToken: vi.fn().mockResolvedValue(
        AccessToken.create(testTokenValue, testUserId, testNow, testExpiresAt)
      ),
      generateRefreshToken: vi.fn(),
      validateAccessToken: vi.fn(),
      validateRefreshToken: vi.fn(),
      decodeAccessToken: vi.fn(),
      hashRefreshToken: vi.fn().mockResolvedValue(testTokenHash),
    } as unknown as RequestPasswordResetDependencies['tokenService'];

    mockUuidGenerator = {
      generate: vi.fn().mockReturnValue(testTokenId),
      isValid: vi.fn().mockReturnValue(true),
    } as unknown as RequestPasswordResetDependencies['uuidGenerator'];

    mockDateTimeService = {
      now: vi.fn().mockReturnValue(testNow),
    } as unknown as RequestPasswordResetDependencies['dateTimeService'];

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as RequestPasswordResetDependencies['logger'];

    useCase = new RequestPasswordResetUseCase({
      userRepository: mockUserRepository,
      passwordResetTokenRepository: mockPasswordResetTokenRepository,
      tokenService: mockTokenService,
      uuidGenerator: mockUuidGenerator,
      dateTimeService: mockDateTimeService,
      logger: mockLogger,
    });
  });

  describe('execute() - Email exists', () => {
    it('should generate a reset token for existing user', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      const result = await useCase.execute(request);

      expect(result.message).toContain('instructions');
      expect(mockTokenService.generateAccessToken).toHaveBeenCalled();
      expect(mockPasswordResetTokenRepository.save).toHaveBeenCalled();
    });

    it('should include resetToken in development mode', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      const result = await useCase.execute(request);

      // In development, token should be returned
      expect(result.resetToken).toBeDefined();
    });

    it('should revoke previous tokens for the user', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockPasswordResetTokenRepository.revokeAllByUser).mockResolvedValue(2);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      await useCase.execute(request);

      expect(mockPasswordResetTokenRepository.revokeAllByUser).toHaveBeenCalled();
    });

    it('should generate token with purpose claim', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      await useCase.execute(request);

      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          claims: expect.objectContaining({ purpose: 'password_reset' }),
        })
      );
    });

    it('should store hashed token, not raw value', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      await useCase.execute(request);

      expect(mockTokenService.hashRefreshToken).toHaveBeenCalledWith(testTokenValue);
      expect(mockPasswordResetTokenRepository.save).toHaveBeenCalledWith(
        expect.anything(),
        testTokenHash
      );
    });
  });

  describe('execute() - Email does not exist', () => {
    it('should return generic success message (no error)', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const request: RequestPasswordResetRequestDto = { email: 'nonexistent@example.com' };
      const result = await useCase.execute(request);

      // Same generic message as success
      expect(result.message).toContain('instructions');
      // Should NOT reveal that email doesn't exist
      expect(mockPasswordResetTokenRepository.save).not.toHaveBeenCalled();
    });

    it('should not generate token for non-existent email', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const request: RequestPasswordResetRequestDto = { email: 'nonexistent@example.com' };
      await useCase.execute(request);

      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should log the attempt for auditing', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const request: RequestPasswordResetRequestDto = { email: 'nonexistent@example.com' };
      await useCase.execute(request);

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('execute() - Inactive users', () => {
    it('should not generate token for SUSPENDED user', async () => {
      const user = createTestUser(UserStatus.SUSPENDED);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      const result = await useCase.execute(request);

      // Same generic message (don't reveal account status)
      expect(result.message).toContain('instructions');
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should not generate token for DEACTIVATED user', async () => {
      const user = createTestUser(UserStatus.DEACTIVATED);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      const result = await useCase.execute(request);

      expect(result.message).toContain('instructions');
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should generate token for PENDING_VERIFICATION user', async () => {
      // Users who haven't verified email should still be able to reset password
      const user = createTestUser(UserStatus.PENDING_VERIFICATION);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      const result = await useCase.execute(request);

      expect(mockTokenService.generateAccessToken).toHaveBeenCalled();
      expect(result.resetToken).toBeDefined();
    });
  });

  describe('execute() - Token generation', () => {
    it('should generate unique token ID', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      await useCase.execute(request);

      expect(mockUuidGenerator.generate).toHaveBeenCalled();
    });

    it('should include userId in token payload', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      await useCase.execute(request);

      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
        })
      );
    });

    it('should include email in token payload', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      await useCase.execute(request);

      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          email: testEmail,
        })
      );
    });
  });

  describe('Logging', () => {
    it('should log start of operation', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      await useCase.execute(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('password reset'),
        expect.any(Object)
      );
    });

    it('should not log sensitive information', async () => {
      const user = createTestUser(UserStatus.ACTIVE);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const request: RequestPasswordResetRequestDto = { email: testEmail };
      await useCase.execute(request);

      // Should not log the raw token
      const allLogCalls = [
        ...vi.mocked(mockLogger.info).mock.calls,
        ...vi.mocked(mockLogger.debug).mock.calls,
      ];

      allLogCalls.forEach(call => {
        const logArgs = JSON.stringify(call);
        expect(logArgs).not.toContain(testTokenValue);
      });
    });
  });
});
