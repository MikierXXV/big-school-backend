/**
 * ============================================
 * UNIT TEST: GetUserStats Use Case
 * ============================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GetUserStatsUseCase,
  GetUserStatsDependencies,
} from '../../../../../src/application/use-cases/user/get-user-stats.use-case.js';
import { UserRepository } from '../../../../../src/domain/repositories/user.repository.interface.js';
import { IOAuthConnectionRepository } from '../../../../../src/domain/repositories/oauth-connection.repository.interface.js';
import { IAuthorizationService } from '../../../../../src/application/ports/authorization.service.port.js';
import { InsufficientPermissionsError } from '../../../../../src/domain/errors/authorization.errors.js';

describe('GetUserStats Use Case', () => {
  let mockUserRepository: UserRepository;
  let mockOAuthConnectionRepository: IOAuthConnectionRepository;
  let mockAuthorizationService: IAuthorizationService;
  let useCase: GetUserStatsUseCase;

  const EXECUTOR_ID = '123e4567-e89b-12d3-a456-426614174000';

  const defaultStats = {
    total: 100,
    emailVerified: 80,
    byRole: { user: 90, admin: 8, super_admin: 2 },
    byStatus: { active: 95, suspended: 2, pending_verification: 2, deactivated: 1 },
  };

  const defaultProviderCounts = { google: 10, microsoft: 5 };

  beforeEach(() => {
    mockUserRepository = {
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      hardDelete: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      existsByEmail: vi.fn(),
      findAll: vi.fn(),
      findBySystemRole: vi.fn(),
      getStats: vi.fn().mockResolvedValue(defaultStats),
    };

    mockOAuthConnectionRepository = {
      save: vi.fn(),
      findByProviderUserId: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIds: vi.fn(),
      countByProvider: vi.fn().mockResolvedValue(defaultProviderCounts),
    };

    mockAuthorizationService = {
      isSuperAdmin: vi.fn().mockResolvedValue(false),
      hasPermission: vi.fn().mockResolvedValue(false),
      isAdminOrAbove: vi.fn().mockResolvedValue(false),
      requireSuperAdmin: vi.fn(),
      requirePermission: vi.fn(),
      hasOrganizationPermission: vi.fn().mockResolvedValue(false),
    };

    const deps: GetUserStatsDependencies = {
      userRepository: mockUserRepository,
      oauthConnectionRepository: mockOAuthConnectionRepository,
      authorizationService: mockAuthorizationService,
    };

    useCase = new GetUserStatsUseCase(deps);
  });

  describe('authorization', () => {
    it('should allow SUPER_ADMIN to get stats', async () => {
      (mockAuthorizationService.isSuperAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      expect(result).toBeDefined();
      expect(result.total).toBe(100);
    });

    it('should allow user with manage_users permission to get stats', async () => {
      (mockAuthorizationService.hasPermission as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      expect(result).toBeDefined();
    });

    it('should throw InsufficientPermissionsError for regular users', async () => {
      await expect(
        useCase.execute({ executorId: EXECUTOR_ID })
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('stats aggregation', () => {
    beforeEach(() => {
      (mockAuthorizationService.isSuperAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    });

    it('should return total, emailVerified, byRole, byStatus from userRepository.getStats', async () => {
      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      expect(result.total).toBe(100);
      expect(result.emailVerified).toBe(80);
      expect(result.byRole).toEqual({ user: 90, admin: 8, super_admin: 2 });
      expect(result.byStatus).toEqual({ active: 95, suspended: 2, pending_verification: 2, deactivated: 1 });
    });

    it('should return byProvider counts from countByProvider', async () => {
      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      expect(result.byProvider.google).toBe(10);
      expect(result.byProvider.microsoft).toBe(5);
    });

    it('should calculate local = total - google - microsoft', async () => {
      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      // local = 100 - 10 - 5 = 85
      expect(result.byProvider.local).toBe(85);
    });

    it('should clamp local to 0 when oauth total exceeds user total', async () => {
      (mockOAuthConnectionRepository.countByProvider as ReturnType<typeof vi.fn>).mockResolvedValue({
        google: 60,
        microsoft: 60,
      });

      const result = await useCase.execute({ executorId: EXECUTOR_ID });

      expect(result.byProvider.local).toBe(0);
    });

    it('should call getStats and countByProvider in parallel', async () => {
      await useCase.execute({ executorId: EXECUTOR_ID });

      expect(mockUserRepository.getStats).toHaveBeenCalledTimes(1);
      expect(mockOAuthConnectionRepository.countByProvider).toHaveBeenCalledTimes(1);
    });
  });
});
