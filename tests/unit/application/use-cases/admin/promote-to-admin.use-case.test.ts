/**
 * ============================================
 * TEST: PromoteToAdminUseCase
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Tests for promoting a USER to ADMIN role.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromoteToAdminUseCase } from '../../../../../src/application/use-cases/admin/promote-to-admin.use-case.js';
import { User, UserStatus } from '../../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../../src/domain/value-objects/password-hash.value-object.js';
import { SystemRole } from '../../../../../src/domain/value-objects/system-role.value-object.js';
import { UserRepository } from '../../../../../src/domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../../../../src/application/ports/authorization.service.port.js';
import { IDateTimeService } from '../../../../../src/application/ports/datetime.service.port.js';
import { UserNotFoundError } from '../../../../../src/domain/errors/user.errors.js';
import { InsufficientPermissionsError, CannotModifySuperAdminError } from '../../../../../src/domain/errors/authorization.errors.js';

describe('PromoteToAdminUseCase', () => {
  let useCase: PromoteToAdminUseCase;
  let mockUserRepository: UserRepository;
  let mockAuthorizationService: IAuthorizationService;
  let mockDateTimeService: IDateTimeService;
  let mockAdminPermissionRepository: any;

  const executorId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
  const targetUserId = '550e8400-e29b-41d4-a716-446655440001'; // Valid UUID
  const now = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      existsByEmail: vi.fn(),
      update: vi.fn(),
    } as any;

    // Mock AuthorizationService
    mockAuthorizationService = {
      hasPermission: vi.fn(),
      canAccessOrganization: vi.fn(),
      getUserOrganizationRole: vi.fn(),
      isSuperAdmin: vi.fn(),
      isAdmin: vi.fn(),
      hasAdminPermission: vi.fn(),
    } as any;

    // Mock DateTimeService
    mockDateTimeService = {
      now: vi.fn().mockReturnValue(now),
      toLocalString: vi.fn().mockImplementation((date: Date) => date.toISOString()),
    } as any;

    // Mock AdminPermissionRepository
    mockAdminPermissionRepository = {
      findByUserId: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new PromoteToAdminUseCase({
      userRepository: mockUserRepository,
      adminPermissionRepository: mockAdminPermissionRepository,
      authorizationService: mockAuthorizationService,
      dateTimeService: mockDateTimeService,
    });
  });

  // Helper to create a test user
  const createTestUser = (id: string, role: SystemRole) => {
    // Create valid UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuid = `${id.replace(/[^a-f0-9]/gi, '').padEnd(32, '0').substring(0, 32)}`.replace(
      /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
      '$1-$2-$3-$4-$5'
    );
    return User.fromPersistence({
      id: UserId.create(uuid),
      email: Email.create(`user-${id}@example.com`),
      passwordHash: PasswordHash.fromHash('$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'),
      firstName: 'Test',
      lastName: 'User',
      status: UserStatus.ACTIVE,
      systemRole: role,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      lastLoginAt: null,
      emailVerifiedAt: new Date('2025-01-01'),
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lockoutCount: 0,
      lastFailedLoginAt: null,
    });
  };

  describe('Authorization checks', () => {
    it('should allow SUPER_ADMIN to promote users', async () => {
      // Arrange
      const executor = createTestUser(executorId, SystemRole.SUPER_ADMIN());
      const targetUser = createTestUser(targetUserId, SystemRole.USER());

      vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue();

      // Act
      const result = await useCase.execute(
        { userId: targetUserId },
        executorId
      );

      // Assert
      expect(mockAuthorizationService.isSuperAdmin).toHaveBeenCalledWith(executorId);
      expect(result.systemRole).toBe('admin');
    });

    it('should reject if executor is not SUPER_ADMIN', async () => {
      // Arrange
      vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(false);

      // Act & Assert
      await expect(
        useCase.execute({ userId: targetUserId }, executorId)
      ).rejects.toThrow(InsufficientPermissionsError);

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should reject if executor is ADMIN', async () => {
      // Arrange
      vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(false);

      // Act & Assert
      await expect(
        useCase.execute({ userId: targetUserId }, executorId)
      ).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should reject if executor is USER', async () => {
      // Arrange
      vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(false);

      // Act & Assert
      await expect(
        useCase.execute({ userId: targetUserId }, executorId)
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('Target user validation', () => {
    beforeEach(() => {
      vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({ userId: targetUserId }, executorId)
      ).rejects.toThrow(UserNotFoundError);
    });

    it('should reject promotion of SUPER_ADMIN users', async () => {
      // Arrange
      const superAdminUser = createTestUser(targetUserId, SystemRole.SUPER_ADMIN());
      vi.mocked(mockUserRepository.findById).mockResolvedValue(superAdminUser);

      // Act & Assert
      await expect(
        useCase.execute({ userId: targetUserId }, executorId)
      ).rejects.toThrow(CannotModifySuperAdminError);
    });
  });

  describe('Promotion logic', () => {
    beforeEach(() => {
      vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
    });

    it('should promote USER to ADMIN successfully', async () => {
      // Arrange
      const targetUser = createTestUser(targetUserId, SystemRole.USER());
      vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue();

      // Act
      const result = await useCase.execute(
        { userId: targetUserId },
        executorId
      );

      // Assert
      expect(result.userId).toBe(targetUser.id.value);
      expect(result.systemRole).toBe('admin');
      expect(result.email).toBe(`user-${targetUserId}@example.com`);
      expect(result.updatedAt).toEqual(now);
      expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent - promoting an ADMIN returns success', async () => {
      // Arrange
      const adminUser = createTestUser(targetUserId, SystemRole.ADMIN());
      vi.mocked(mockUserRepository.findById).mockResolvedValue(adminUser);

      // Act
      const result = await useCase.execute(
        { userId: targetUserId },
        executorId
      );

      // Assert
      expect(result.systemRole).toBe('admin');
      expect(mockUserRepository.update).not.toHaveBeenCalled(); // No update needed
    });

    it('should update the user with correct timestamp', async () => {
      // Arrange
      const targetUser = createTestUser(targetUserId, SystemRole.USER());
      vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue();

      // Act
      await useCase.execute({ userId: targetUserId }, executorId);

      // Assert
      const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0][0];
      expect(updatedUser.systemRole.getValue()).toBe('admin');
      expect(updatedUser.updatedAt).toEqual(now);
    });
  });

  describe('Response format', () => {
    beforeEach(() => {
      vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
    });

    it('should return correct response DTO structure', async () => {
      // Arrange
      const targetUser = createTestUser(targetUserId, SystemRole.USER());
      vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue();

      // Act
      const result = await useCase.execute(
        { userId: targetUserId },
        executorId
      );

      // Assert
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('lastName');
      expect(result).toHaveProperty('systemRole');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should include full user details in response', async () => {
      // Arrange
      const targetUser = createTestUser(targetUserId, SystemRole.USER());
      vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue();

      // Act
      const result = await useCase.execute(
        { userId: targetUserId },
        executorId
      );

      // Assert
      expect(result.firstName).toBe('Test');
      expect(result.lastName).toBe('User');
      expect(result.email).toBe(`user-${targetUserId}@example.com`);
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
    });

    it('should handle invalid userId format gracefully', async () => {
      // Arrange
      const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440999'; // Valid UUID but doesn't exist
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({ userId: nonExistentUserId }, executorId)
      ).rejects.toThrow(UserNotFoundError);
    });

    it('should handle empty userId', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({ userId: '' }, executorId)
      ).rejects.toThrow();
    });

    it('should handle user promotion when user has special characters in name', async () => {
      // Arrange
      const uuid = `${targetUserId.replace(/[^a-f0-9]/gi, '').padEnd(32, '0').substring(0, 32)}`.replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
        '$1-$2-$3-$4-$5'
      );
      const targetUser = User.fromPersistence({
        id: UserId.create(uuid),
        email: Email.create(`user-${targetUserId}@example.com`),
        passwordHash: PasswordHash.fromHash('$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'),
        firstName: "O'Brien",
        lastName: 'José-María',
        status: UserStatus.ACTIVE,
        systemRole: SystemRole.USER(),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        lastLoginAt: null,
        emailVerifiedAt: new Date('2025-01-01'),
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lockoutCount: 0,
        lastFailedLoginAt: null,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue();

      // Act
      const result = await useCase.execute(
        { userId: targetUserId },
        executorId
      );

      // Assert
      expect(result.firstName).toBe("O'Brien");
      expect(result.lastName).toBe('José-María');
    });
  });
});
