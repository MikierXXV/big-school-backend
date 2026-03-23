/**
 * ============================================
 * UNIT TEST: UpdateUserStatusUseCase
 * ============================================
 *
 * Tests for changing a user's account status (activate, suspend, deactivate).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateUserStatusUseCase } from '../../../../../src/application/use-cases/user/update-user-status.use-case.js';
import { User, UserStatus } from '../../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../../src/domain/value-objects/password-hash.value-object.js';
import { SystemRole } from '../../../../../src/domain/value-objects/system-role.value-object.js';
import { UserRepository } from '../../../../../src/domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../../../../src/application/ports/authorization.service.port.js';
import { IDateTimeService } from '../../../../../src/application/ports/datetime.service.port.js';
import { UserNotFoundError } from '../../../../../src/domain/errors/user.errors.js';
import { InsufficientPermissionsError } from '../../../../../src/domain/errors/authorization.errors.js';

describe('UpdateUserStatusUseCase', () => {
  let useCase: UpdateUserStatusUseCase;
  let mockUserRepository: UserRepository;
  let mockAuthorizationService: IAuthorizationService;
  let mockDateTimeService: IDateTimeService;

  const EXECUTOR_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TARGET_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
  const SUPER_ADMIN_TARGET_ID = '550e8400-e29b-41d4-a716-446655440002';
  const VALID_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';
  const now = new Date('2025-01-15T10:00:00Z');

  const createUser = (id: string, role: SystemRole, status: UserStatus = UserStatus.ACTIVE): User =>
    User.fromPersistence({
      id: UserId.create(id),
      email: Email.create(`user-${id.substring(0, 8)}@test.com`),
      passwordHash: PasswordHash.fromHash(VALID_HASH),
      firstName: 'Test',
      lastName: 'User',
      status,
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

  beforeEach(() => {
    mockUserRepository = {
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      existsByEmail: vi.fn(),
      findAll: vi.fn(),
      findBySystemRole: vi.fn(),
    } as any;

    mockAuthorizationService = {
      hasPermission: vi.fn(),
      canAccessOrganization: vi.fn(),
      getUserOrganizationRole: vi.fn(),
      isSuperAdmin: vi.fn().mockResolvedValue(false),
      isAdmin: vi.fn().mockResolvedValue(false),
      hasAdminPermission: vi.fn().mockResolvedValue(false),
    } as any;

    mockDateTimeService = {
      now: vi.fn().mockReturnValue(now),
      toLocalString: vi.fn(),
    } as any;

    useCase = new UpdateUserStatusUseCase({
      userRepository: mockUserRepository,
      authorizationService: mockAuthorizationService,
      dateTimeService: mockDateTimeService,
    });
  });

  it('should activate a PENDING_VERIFICATION user when executor is SUPER_ADMIN', async () => {
    const targetUser = createUser(TARGET_USER_ID, SystemRole.USER(), UserStatus.PENDING_VERIFICATION);
    vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
    vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
    vi.mocked(mockUserRepository.update).mockResolvedValue(undefined);

    const result = await useCase.execute(
      { targetUserId: TARGET_USER_ID, newStatus: 'ACTIVE' },
      EXECUTOR_ID
    );

    expect(result.id).toBe(TARGET_USER_ID);
    expect(result.status).toBe(UserStatus.ACTIVE);
    expect(mockUserRepository.update).toHaveBeenCalledOnce();
    const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0][0] as User;
    expect(updatedUser.status).toBe(UserStatus.ACTIVE);
  });

  it('should suspend an ACTIVE user when executor is SUPER_ADMIN', async () => {
    const targetUser = createUser(TARGET_USER_ID, SystemRole.USER(), UserStatus.ACTIVE);
    vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
    vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
    vi.mocked(mockUserRepository.update).mockResolvedValue(undefined);

    const result = await useCase.execute(
      { targetUserId: TARGET_USER_ID, newStatus: 'SUSPENDED' },
      EXECUTOR_ID
    );

    expect(result.status).toBe(UserStatus.SUSPENDED);
    const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0][0] as User;
    expect(updatedUser.status).toBe(UserStatus.SUSPENDED);
  });

  it('should deactivate an ACTIVE user when executor is ADMIN with manage_users', async () => {
    const targetUser = createUser(TARGET_USER_ID, SystemRole.USER(), UserStatus.ACTIVE);
    vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(false);
    vi.mocked(mockAuthorizationService.hasAdminPermission).mockResolvedValue(true);
    vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
    vi.mocked(mockUserRepository.update).mockResolvedValue(undefined);

    const result = await useCase.execute(
      { targetUserId: TARGET_USER_ID, newStatus: 'DEACTIVATED' },
      EXECUTOR_ID
    );

    expect(result.status).toBe(UserStatus.DEACTIVATED);
    const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0][0] as User;
    expect(updatedUser.status).toBe(UserStatus.DEACTIVATED);
  });

  it('should throw InsufficientPermissionsError when executor has no permission', async () => {
    vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(false);
    vi.mocked(mockAuthorizationService.hasAdminPermission).mockResolvedValue(false);

    await expect(
      useCase.execute({ targetUserId: TARGET_USER_ID, newStatus: 'ACTIVE' }, EXECUTOR_ID)
    ).rejects.toThrow(InsufficientPermissionsError);

    expect(mockUserRepository.findById).not.toHaveBeenCalled();
    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });

  it('should throw InsufficientPermissionsError when executor tries to change own status', async () => {
    vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);

    await expect(
      useCase.execute({ targetUserId: EXECUTOR_ID, newStatus: 'SUSPENDED' }, EXECUTOR_ID)
    ).rejects.toThrow(InsufficientPermissionsError);

    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });

  it('should throw UserNotFoundError when target user does not exist', async () => {
    vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ targetUserId: TARGET_USER_ID, newStatus: 'ACTIVE' }, EXECUTOR_ID)
    ).rejects.toThrow(UserNotFoundError);

    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });

  it('should throw InsufficientPermissionsError when ADMIN tries to change SUPER_ADMIN status', async () => {
    const superAdminUser = createUser(SUPER_ADMIN_TARGET_ID, SystemRole.SUPER_ADMIN());
    vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(false);
    vi.mocked(mockAuthorizationService.hasAdminPermission).mockResolvedValue(true);
    vi.mocked(mockUserRepository.findById).mockResolvedValue(superAdminUser);

    await expect(
      useCase.execute({ targetUserId: SUPER_ADMIN_TARGET_ID, newStatus: 'SUSPENDED' }, EXECUTOR_ID)
    ).rejects.toThrow(InsufficientPermissionsError);

    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });

  it('should allow SUPER_ADMIN to change another SUPER_ADMIN status', async () => {
    const superAdminUser = createUser(SUPER_ADMIN_TARGET_ID, SystemRole.SUPER_ADMIN());
    vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
    vi.mocked(mockUserRepository.findById).mockResolvedValue(superAdminUser);
    vi.mocked(mockUserRepository.update).mockResolvedValue(undefined);

    const result = await useCase.execute(
      { targetUserId: SUPER_ADMIN_TARGET_ID, newStatus: 'SUSPENDED' },
      EXECUTOR_ID
    );

    expect(result.status).toBe(UserStatus.SUSPENDED);
    expect(mockUserRepository.update).toHaveBeenCalledOnce();
  });

  it('should set updatedAt to current datetime after status change', async () => {
    const targetUser = createUser(TARGET_USER_ID, SystemRole.USER(), UserStatus.ACTIVE);
    vi.mocked(mockAuthorizationService.isSuperAdmin).mockResolvedValue(true);
    vi.mocked(mockUserRepository.findById).mockResolvedValue(targetUser);
    vi.mocked(mockUserRepository.update).mockResolvedValue(undefined);

    await useCase.execute({ targetUserId: TARGET_USER_ID, newStatus: 'DEACTIVATED' }, EXECUTOR_ID);

    const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0][0] as User;
    expect(updatedUser.updatedAt).toEqual(now);
  });
});
