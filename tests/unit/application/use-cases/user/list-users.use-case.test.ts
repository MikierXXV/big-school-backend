/**
 * ============================================
 * UNIT TEST: ListUsers Use Case
 * ============================================
 *
 * Tests for listing all system users with pagination.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ListUsersUseCase,
  ListUsersDependencies,
} from '../../../../../src/application/use-cases/user/list-users.use-case.js';
import { UserRepository, PaginatedResult } from '../../../../../src/domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../../../../src/application/ports/authorization.service.port.js';
import { IDateTimeService } from '../../../../../src/application/ports/datetime.service.port.js';
import { InsufficientPermissionsError } from '../../../../../src/domain/errors/authorization.errors.js';
import { User } from '../../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../../src/domain/value-objects/password-hash.value-object.js';
import { SystemRole } from '../../../../../src/domain/value-objects/system-role.value-object.js';

describe('ListUsers Use Case', () => {
  let mockUserRepository: UserRepository;
  let mockAuthorizationService: IAuthorizationService;
  let mockDateTimeService: IDateTimeService;
  let useCase: ListUsersUseCase;

  const EXECUTOR_ID = '123e4567-e89b-12d3-a456-426614174000';
  const VALID_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';

  const createTestUser = (id: string, email: string, role: SystemRole): User => {
    return User.fromPersistence({
      id: UserId.create(id),
      email: Email.create(email),
      passwordHash: PasswordHash.fromHash(VALID_HASH),
      firstName: 'Test',
      lastName: 'User',
      status: 'ACTIVE',
      systemRole: role,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      lastLoginAt: null,
      emailVerifiedAt: new Date('2024-01-01T12:00:00Z'),
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lockoutCount: 0,
      lastFailedLoginAt: null,
    });
  };

  const mockPaginatedResult = (users: User[]): PaginatedResult<User> => ({
    items: users,
    total: users.length,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });

  beforeEach(() => {
    mockUserRepository = {
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      existsByEmail: vi.fn(),
      findAll: vi.fn().mockResolvedValue(mockPaginatedResult([])),
      findBySystemRole: vi.fn(),
    };

    mockAuthorizationService = {
      isSuperAdmin: vi.fn().mockResolvedValue(false),
      hasPermission: vi.fn().mockResolvedValue(false),
      isAdminOrAbove: vi.fn().mockResolvedValue(false),
      requireSuperAdmin: vi.fn(),
      requirePermission: vi.fn(),
      hasOrganizationPermission: vi.fn().mockResolvedValue(false),
    };

    mockDateTimeService = {
      now: vi.fn().mockReturnValue(new Date()),
      nowTimestamp: vi.fn(),
      nowTimestampSeconds: vi.fn(),
      addSeconds: vi.fn(),
      addMinutes: vi.fn(),
      addHours: vi.fn(),
      addDays: vi.fn(),
      isExpired: vi.fn(),
      differenceInSeconds: vi.fn(),
      toISOString: vi.fn().mockImplementation((d: Date) => d.toISOString()),
      fromISOString: vi.fn(),
      toLocalString: vi.fn(),
    };

    const mockOAuthConnectionRepository = {
      save: vi.fn(),
      findByProviderUserId: vi.fn().mockResolvedValue(null),
      findByUserId: vi.fn().mockResolvedValue([]),
      findByUserIds: vi.fn().mockResolvedValue([]),
    };

    const deps: ListUsersDependencies = {
      userRepository: mockUserRepository,
      authorizationService: mockAuthorizationService,
      dateTimeService: mockDateTimeService,
      oauthConnectionRepository: mockOAuthConnectionRepository,
    };

    useCase = new ListUsersUseCase(deps);
  });

  describe('authorization', () => {
    it('should allow SUPER_ADMIN to list users', async () => {
      (mockAuthorizationService.isSuperAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      expect(result).toBeDefined();
      expect(result.users).toEqual([]);
    });

    it('should allow user with manage_users permission to list users', async () => {
      (mockAuthorizationService.hasPermission as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      expect(result).toBeDefined();
      expect(result.users).toEqual([]);
    });

    it('should throw InsufficientPermissionsError for regular users', async () => {
      await expect(
        useCase.execute({ executorId: EXECUTOR_ID })
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('pagination', () => {
    it('should use default page and limit when not provided', async () => {
      (mockAuthorizationService.isSuperAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      await useCase.execute({ executorId: EXECUTOR_ID });

      expect(mockUserRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should pass custom page and limit', async () => {
      (mockAuthorizationService.isSuperAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      await useCase.execute({ executorId: EXECUTOR_ID, page: 3, limit: 10 });

      expect(mockUserRepository.findAll).toHaveBeenCalledWith({
        page: 3,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });
  });

  describe('response mapping', () => {
    it('should map users to response DTOs', async () => {
      (mockAuthorizationService.isSuperAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const users = [
        createTestUser('11111111-1111-1111-1111-111111111111', 'alice@example.com', SystemRole.USER()),
        createTestUser('22222222-2222-2222-2222-222222222222', 'bob@example.com', SystemRole.ADMIN()),
      ];

      (mockUserRepository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockPaginatedResult(users)
      );

      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      expect(result.users).toHaveLength(2);
      expect(result.users[0].email).toBe('alice@example.com');
      expect(result.users[0].systemRole).toBe('user');
      expect(result.users[1].email).toBe('bob@example.com');
      expect(result.users[1].systemRole).toBe('admin');
    });

    it('should include pagination metadata in response', async () => {
      (mockAuthorizationService.isSuperAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      (mockUserRepository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        items: [],
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
        hasNext: true,
        hasPrevious: true,
      });

      const result = await useCase.execute({ executorId: EXECUTOR_ID, page: 2, limit: 10 });

      expect(result.total).toBe(50);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrevious).toBe(true);
    });

    it('should include systemRole in user response', async () => {
      (mockAuthorizationService.isSuperAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const users = [
        createTestUser('33333333-3333-3333-3333-333333333333', 'admin@example.com', SystemRole.SUPER_ADMIN()),
      ];

      (mockUserRepository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockPaginatedResult(users)
      );

      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      expect(result.users[0].systemRole).toBe('super_admin');
      expect(result.users[0].fullName).toBe('Test User');
    });
  });
});
