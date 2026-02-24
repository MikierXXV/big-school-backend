/**
 * ============================================
 * UNIT TEST: AdminController
 * ============================================
 *
 * Tests para el controlador de administración.
 * Los controllers NO capturan errores internamente,
 * los propagan al error handler middleware.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminController } from '../../../../../src/interfaces/http/controllers/admin.controller.js';
import { PromoteToAdminUseCase } from '../../../../../src/application/use-cases/admin/promote-to-admin.use-case.js';
import { DemoteFromAdminUseCase } from '../../../../../src/application/use-cases/admin/demote-from-admin.use-case.js';
import { GrantAdminPermissionUseCase } from '../../../../../src/application/use-cases/admin/grant-admin-permission.use-case.js';
import { RevokeAdminPermissionUseCase } from '../../../../../src/application/use-cases/admin/revoke-admin-permission.use-case.js';
import { ListAdminsUseCase } from '../../../../../src/application/use-cases/admin/list-admins.use-case.js';
import { AuthenticatedRequest } from '../../../../../src/interfaces/http/middlewares/auth.middleware.js';
import { UnauthorizedError } from '../../../../../src/domain/errors/authorization.errors.js';
import { UserNotFoundError } from '../../../../../src/domain/errors/user.errors.js';

describe('AdminController', () => {
  let controller: AdminController;
  let mockPromoteToAdminUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockDemoteToUserUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockGrantAdminPermissionUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockRevokeAdminPermissionUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockGetAdminPermissionsUseCase: { execute: ReturnType<typeof vi.fn> };

  const EXECUTOR_ID = '123e4567-e89b-42d3-a456-426614174000';
  const TARGET_USER_ID = '223e4567-e89b-42d3-a456-426614174000';

  beforeEach(() => {
    mockPromoteToAdminUseCase = { execute: vi.fn() };
    mockDemoteToUserUseCase = { execute: vi.fn() };
    mockGrantAdminPermissionUseCase = { execute: vi.fn() };
    mockRevokeAdminPermissionUseCase = { execute: vi.fn() };
    mockGetAdminPermissionsUseCase = { execute: vi.fn() };

    controller = new AdminController({
      promoteToAdminUseCase: mockPromoteToAdminUseCase as unknown as PromoteToAdminUseCase,
      demoteToUserUseCase: mockDemoteToUserUseCase as unknown as any,
      grantAdminPermissionUseCase: mockGrantAdminPermissionUseCase as unknown as GrantAdminPermissionUseCase,
      revokeAdminPermissionUseCase: mockRevokeAdminPermissionUseCase as unknown as RevokeAdminPermissionUseCase,
      getAdminPermissionsUseCase: mockGetAdminPermissionsUseCase as unknown as any,
    });
  });

  describe('promote()', () => {
    const validRequest: AuthenticatedRequest = {
      body: { userId: TARGET_USER_ID },
      headers: {},
      params: {},
      query: {},
      user: { userId: EXECUTOR_ID, email: 'executor@example.com' },
    };

    const successResponse = {
      success: true,
      message: 'User promoted to ADMIN successfully',
      user: {
        id: TARGET_USER_ID,
        email: 'user@example.com',
        role: 'ADMIN',
      },
    };

    it('should return 200 with success on successful promotion', async () => {
      mockPromoteToAdminUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.promote(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call promoteToAdminUseCase.execute with dto and executorId', async () => {
      mockPromoteToAdminUseCase.execute.mockResolvedValue(successResponse);

      await controller.promote(validRequest);

      expect(mockPromoteToAdminUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockPromoteToAdminUseCase.execute).toHaveBeenCalledWith(
        { userId: TARGET_USER_ID },
        EXECUTOR_ID
      );
    });

    it('should propagate UserNotFoundError to error handler', async () => {
      const error = new UserNotFoundError(TARGET_USER_ID);
      mockPromoteToAdminUseCase.execute.mockRejectedValue(error);

      await expect(controller.promote(validRequest)).rejects.toThrow(UserNotFoundError);
    });

    it('should propagate UnauthorizedError to error handler', async () => {
      const error = new UnauthorizedError('Insufficient permissions');
      mockPromoteToAdminUseCase.execute.mockRejectedValue(error);

      await expect(controller.promote(validRequest)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('demote()', () => {
    const validRequest: AuthenticatedRequest = {
      body: { userId: TARGET_USER_ID },
      headers: {},
      params: {},
      query: {},
      user: { userId: EXECUTOR_ID, email: 'executor@example.com' },
    };

    const successResponse = {
      success: true,
      message: 'User demoted from ADMIN successfully',
      user: {
        id: TARGET_USER_ID,
        email: 'user@example.com',
        role: 'USER',
      },
    };

    it('should return 200 with success on successful demotion', async () => {
      mockDemoteToUserUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.demote(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call demoteToUserUseCase.execute with dto and executorId', async () => {
      mockDemoteToUserUseCase.execute.mockResolvedValue(successResponse);

      await controller.demote(validRequest);

      expect(mockDemoteToUserUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockDemoteToUserUseCase.execute).toHaveBeenCalledWith(
        { userId: TARGET_USER_ID },
        EXECUTOR_ID
      );
    });

    it('should propagate errors to error handler', async () => {
      const error = new UserNotFoundError(TARGET_USER_ID);
      mockDemoteToUserUseCase.execute.mockRejectedValue(error);

      await expect(controller.demote(validRequest)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('grantPermission()', () => {
    const validRequest: AuthenticatedRequest = {
      body: { adminUserId: TARGET_USER_ID, permission: 'manage_users' },
      headers: {},
      params: {},
      query: {},
      user: { userId: EXECUTOR_ID, email: 'executor@example.com' },
    };

    const successResponse = {
      success: true,
      message: 'Permission granted successfully',
      admin: {
        id: TARGET_USER_ID,
        permissions: ['manage_users'],
      },
    };

    it('should return 200 with success on successful grant', async () => {
      mockGrantAdminPermissionUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.grantPermission(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call grantAdminPermissionUseCase.execute with dto and executorId', async () => {
      mockGrantAdminPermissionUseCase.execute.mockResolvedValue(successResponse);

      await controller.grantPermission(validRequest);

      expect(mockGrantAdminPermissionUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGrantAdminPermissionUseCase.execute).toHaveBeenCalledWith(
        { adminUserId: TARGET_USER_ID, permission: 'manage_users' },
        EXECUTOR_ID
      );
    });

    it('should propagate errors to error handler', async () => {
      const error = new UnauthorizedError('Invalid permission');
      mockGrantAdminPermissionUseCase.execute.mockRejectedValue(error);

      await expect(controller.grantPermission(validRequest)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('revokePermission()', () => {
    const validRequest: AuthenticatedRequest = {
      body: { adminUserId: TARGET_USER_ID, permission: 'manage_users' },
      headers: {},
      params: {},
      query: {},
      user: { userId: EXECUTOR_ID, email: 'executor@example.com' },
    };

    const successResponse = {
      success: true,
      message: 'Permission revoked successfully',
      admin: {
        id: TARGET_USER_ID,
        permissions: [],
      },
    };

    it('should return 200 with success on successful revocation', async () => {
      mockRevokeAdminPermissionUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.revokePermission(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call revokeAdminPermissionUseCase.execute with dto and executorId', async () => {
      mockRevokeAdminPermissionUseCase.execute.mockResolvedValue(successResponse);

      await controller.revokePermission(validRequest);

      expect(mockRevokeAdminPermissionUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockRevokeAdminPermissionUseCase.execute).toHaveBeenCalledWith(
        { adminUserId: TARGET_USER_ID, permission: 'manage_users' },
        EXECUTOR_ID
      );
    });

    it('should propagate errors to error handler', async () => {
      const error = new UserNotFoundError(TARGET_USER_ID);
      mockRevokeAdminPermissionUseCase.execute.mockRejectedValue(error);

      await expect(controller.revokePermission(validRequest)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('getPermissions()', () => {
    const validRequest: AuthenticatedRequest = {
      body: {},
      headers: {},
      params: { userId: TARGET_USER_ID },
      query: {},
      user: { userId: EXECUTOR_ID, email: 'executor@example.com' },
    };

    const successResponse = {
      userId: TARGET_USER_ID,
      systemRole: 'admin',
      grantedPermissions: [
        { permission: 'manage_users', grantedBy: EXECUTOR_ID, grantedAt: new Date() },
      ],
    };

    it('should return 200 with admin permissions on success', async () => {
      mockGetAdminPermissionsUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.getPermissions(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call getAdminPermissionsUseCase.execute with userId and executorId', async () => {
      mockGetAdminPermissionsUseCase.execute.mockResolvedValue(successResponse);

      await controller.getPermissions(validRequest);

      expect(mockGetAdminPermissionsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetAdminPermissionsUseCase.execute).toHaveBeenCalledWith(TARGET_USER_ID, EXECUTOR_ID);
    });

    it('should propagate errors to error handler', async () => {
      const error = new UnauthorizedError('Insufficient permissions');
      mockGetAdminPermissionsUseCase.execute.mockRejectedValue(error);

      await expect(controller.getPermissions(validRequest)).rejects.toThrow(UnauthorizedError);
    });
  });
});
