/**
 * ============================================
 * UNIT TEST: AuthorizationMiddleware
 * ============================================
 *
 * Tests para el middleware de autorización.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthorizationMiddleware } from '../../../../../src/interfaces/http/middlewares/authorization.middleware.js';
import { IAuthorizationService } from '../../../../../src/application/ports/authorization.service.port.js';
import { UnauthorizedError } from '../../../../../src/domain/errors/authorization.errors.js';
import { AuthenticatedRequest } from '../../../../../src/interfaces/http/middlewares/auth.middleware.js';

describe('AuthorizationMiddleware', () => {
  let middleware: AuthorizationMiddleware;
  let mockAuthorizationService: {
    isSuperAdmin: ReturnType<typeof vi.fn>;
    isAdmin: ReturnType<typeof vi.fn>;
    hasPermission: ReturnType<typeof vi.fn>;
  };

  const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
  const ORG_ID = 'org_123e4567-e89b-42d3-a456-426614174000';

  beforeEach(() => {
    mockAuthorizationService = {
      isSuperAdmin: vi.fn(),
      isAdmin: vi.fn(),
      hasPermission: vi.fn(),
    };

    middleware = new AuthorizationMiddleware(
      mockAuthorizationService as unknown as IAuthorizationService
    );
  });

  describe('checkPermission() with requireSuperAdmin', () => {
    it('should pass when user is SUPER_ADMIN', async () => {
      mockAuthorizationService.isSuperAdmin.mockResolvedValue(true);

      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        user: { userId: USER_ID, email: 'admin@example.com' },
      };

      const checkFn = middleware.checkPermission({ requireSuperAdmin: true });

      await expect(checkFn(request)).resolves.toBeUndefined();
      expect(mockAuthorizationService.isSuperAdmin).toHaveBeenCalledWith(USER_ID);
    });

    it('should throw UnauthorizedError when user is not SUPER_ADMIN', async () => {
      mockAuthorizationService.isSuperAdmin.mockResolvedValue(false);

      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        user: { userId: USER_ID, email: 'user@example.com' },
      };

      const checkFn = middleware.checkPermission({ requireSuperAdmin: true });

      await expect(checkFn(request)).rejects.toThrow(UnauthorizedError);
      await expect(checkFn(request)).rejects.toThrow('SUPER_ADMIN role required');
    });

    it('should throw UnauthorizedError when user is not authenticated', async () => {
      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        // no user property
      };

      const checkFn = middleware.checkPermission({ requireSuperAdmin: true });

      await expect(checkFn(request)).rejects.toThrow(UnauthorizedError);
      await expect(checkFn(request)).rejects.toThrow('Authentication required');
    });
  });

  describe('checkPermission() with requireAdmin', () => {
    it('should pass when user is SUPER_ADMIN', async () => {
      mockAuthorizationService.isSuperAdmin.mockResolvedValue(true);
      mockAuthorizationService.isAdmin.mockResolvedValue(false);

      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        user: { userId: USER_ID, email: 'admin@example.com' },
      };

      const checkFn = middleware.checkPermission({ requireAdmin: true });

      await expect(checkFn(request)).resolves.toBeUndefined();
      expect(mockAuthorizationService.isSuperAdmin).toHaveBeenCalledWith(USER_ID);
    });

    it('should pass when user is ADMIN', async () => {
      mockAuthorizationService.isSuperAdmin.mockResolvedValue(false);
      mockAuthorizationService.isAdmin.mockResolvedValue(true);

      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        user: { userId: USER_ID, email: 'admin@example.com' },
      };

      const checkFn = middleware.checkPermission({ requireAdmin: true });

      await expect(checkFn(request)).resolves.toBeUndefined();
      expect(mockAuthorizationService.isSuperAdmin).toHaveBeenCalledWith(USER_ID);
      expect(mockAuthorizationService.isAdmin).toHaveBeenCalledWith(USER_ID);
    });

    it('should throw UnauthorizedError when user is regular USER', async () => {
      mockAuthorizationService.isSuperAdmin.mockResolvedValue(false);
      mockAuthorizationService.isAdmin.mockResolvedValue(false);

      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        user: { userId: USER_ID, email: 'user@example.com' },
      };

      const checkFn = middleware.checkPermission({ requireAdmin: true });

      await expect(checkFn(request)).rejects.toThrow(UnauthorizedError);
      await expect(checkFn(request)).rejects.toThrow('ADMIN role required');
    });
  });

  describe('checkPermission() with permission', () => {
    it('should pass when user has the required permission', async () => {
      mockAuthorizationService.hasPermission.mockResolvedValue(true);

      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        user: { userId: USER_ID, email: 'user@example.com' },
      };

      const checkFn = middleware.checkPermission({ permission: 'manage_users' });

      await expect(checkFn(request)).resolves.toBeUndefined();
      expect(mockAuthorizationService.hasPermission).toHaveBeenCalledWith(
        USER_ID,
        'manage_users',
        undefined
      );
    });

    it('should throw UnauthorizedError when user lacks the permission', async () => {
      mockAuthorizationService.hasPermission.mockResolvedValue(false);

      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        user: { userId: USER_ID, email: 'user@example.com' },
      };

      const checkFn = middleware.checkPermission({ permission: 'manage_users' });

      await expect(checkFn(request)).rejects.toThrow(UnauthorizedError);
      await expect(checkFn(request)).rejects.toThrow("Permission 'manage_users' required");
    });

    it('should check organization-specific permission when organizationIdParam is provided', async () => {
      mockAuthorizationService.hasPermission.mockResolvedValue(true);

      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: { organizationId: ORG_ID },
        query: {},
        user: { userId: USER_ID, email: 'user@example.com' },
      };

      const checkFn = middleware.checkPermission({
        permission: 'manage_members',
        organizationIdParam: 'organizationId',
      });

      await expect(checkFn(request)).resolves.toBeUndefined();
      expect(mockAuthorizationService.hasPermission).toHaveBeenCalledWith(
        USER_ID,
        'manage_members',
        ORG_ID
      );
    });

    it('should check global permission when organizationIdParam is not in params', async () => {
      mockAuthorizationService.hasPermission.mockResolvedValue(true);

      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        user: { userId: USER_ID, email: 'user@example.com' },
      };

      const checkFn = middleware.checkPermission({
        permission: 'manage_members',
        organizationIdParam: 'organizationId',
      });

      await expect(checkFn(request)).resolves.toBeUndefined();
      expect(mockAuthorizationService.hasPermission).toHaveBeenCalledWith(
        USER_ID,
        'manage_members',
        undefined
      );
    });
  });

  describe('checkPermission() without options', () => {
    it('should pass when no restrictions are specified', async () => {
      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        user: { userId: USER_ID, email: 'user@example.com' },
      };

      const checkFn = middleware.checkPermission({});

      await expect(checkFn(request)).resolves.toBeUndefined();
    });

    it('should still require authentication even with no restrictions', async () => {
      const request: AuthenticatedRequest = {
        body: {},
        headers: {},
        params: {},
        query: {},
        // no user
      };

      const checkFn = middleware.checkPermission({});

      await expect(checkFn(request)).rejects.toThrow(UnauthorizedError);
      await expect(checkFn(request)).rejects.toThrow('Authentication required');
    });
  });
});
