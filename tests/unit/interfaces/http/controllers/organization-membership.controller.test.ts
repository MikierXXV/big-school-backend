/**
 * ============================================
 * UNIT TEST: OrganizationMembershipController
 * ============================================
 *
 * Tests para el controlador de membresías organizacionales.
 * Los controllers NO capturan errores internamente,
 * los propagan al error handler middleware.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationMembershipController } from '../../../../../src/interfaces/http/controllers/organization-membership.controller.js';
import { AssignMemberUseCase } from '../../../../../src/application/use-cases/memberships/assign-member.use-case.js';
import { RemoveMemberUseCase } from '../../../../../src/application/use-cases/memberships/remove-member.use-case.js';
import { ChangeRoleUseCase } from '../../../../../src/application/use-cases/memberships/change-role.use-case.js';
import { GetOrganizationMembersUseCase } from '../../../../../src/application/use-cases/memberships/get-organization-members.use-case.js';
import { GetUserOrganizationsUseCase } from '../../../../../src/application/use-cases/memberships/get-user-organizations.use-case.js';
import { AuthenticatedRequest } from '../../../../../src/interfaces/http/middlewares/auth.middleware.js';
import { UserNotMemberError, MembershipAlreadyExistsError } from '../../../../../src/domain/errors/organization.errors.js';

describe('OrganizationMembershipController', () => {
  let controller: OrganizationMembershipController;
  let mockAssignUserToOrganizationUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockRemoveUserFromOrganizationUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockChangeUserOrganizationRoleUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockGetOrganizationMembersUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockGetUserOrganizationsUseCase: { execute: ReturnType<typeof vi.fn> };

  const EXECUTOR_ID = '123e4567-e89b-42d3-a456-426614174000';
  const ORG_ID = 'org_123e4567-e89b-42d3-a456-426614174000';
  const USER_ID = '223e4567-e89b-42d3-a456-426614174000';
  const MEMBERSHIP_ID = 'mem_323e4567-e89b-42d3-a456-426614174000';

  beforeEach(() => {
    mockAssignUserToOrganizationUseCase = { execute: vi.fn() };
    mockRemoveUserFromOrganizationUseCase = { execute: vi.fn() };
    mockChangeUserOrganizationRoleUseCase = { execute: vi.fn() };
    mockGetOrganizationMembersUseCase = { execute: vi.fn() };
    mockGetUserOrganizationsUseCase = { execute: vi.fn() };

    controller = new OrganizationMembershipController({
      assignUserToOrganizationUseCase: mockAssignUserToOrganizationUseCase as unknown as any,
      removeUserFromOrganizationUseCase: mockRemoveUserFromOrganizationUseCase as unknown as any,
      changeUserOrganizationRoleUseCase: mockChangeUserOrganizationRoleUseCase as unknown as any,
      getOrganizationMembersUseCase: mockGetOrganizationMembersUseCase as unknown as any,
      getUserOrganizationsUseCase: mockGetUserOrganizationsUseCase as unknown as any,
    });
  });

  describe('assign()', () => {
    const validRequest: AuthenticatedRequest = {
      body: {
        userId: USER_ID,
        role: 'doctor',
      },
      headers: {},
      params: { organizationId: ORG_ID },
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    const successResponse = {
      success: true,
      message: 'Member assigned successfully',
      membership: {
        id: MEMBERSHIP_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: 'doctor',
      },
    };

    it('should return 201 with membership on successful assignment', async () => {
      mockAssignUserToOrganizationUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.assign(validRequest);

      expect(result.statusCode).toBe(201);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call assignMemberUseCase.execute with dto and executorId', async () => {
      mockAssignUserToOrganizationUseCase.execute.mockResolvedValue(successResponse);

      await controller.assign(validRequest);

      expect(mockAssignUserToOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockAssignUserToOrganizationUseCase.execute).toHaveBeenCalledWith(
        {
          organizationId: ORG_ID,
          userId: USER_ID,
          role: 'doctor',
        },
        EXECUTOR_ID
      );
    });

    it('should propagate MembershipAlreadyExistsError to error handler', async () => {
      const error = new MembershipAlreadyExistsError(USER_ID, ORG_ID);
      mockAssignUserToOrganizationUseCase.execute.mockRejectedValue(error);

      await expect(controller.assign(validRequest)).rejects.toThrow(
        MembershipAlreadyExistsError
      );
    });
  });

  describe('remove()', () => {
    const validRequest: AuthenticatedRequest = {
      body: {},
      headers: {},
      params: { organizationId: ORG_ID, userId: USER_ID },
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    const successResponse = {
      userId: USER_ID,
      organizationId: ORG_ID,
      role: 'doctor',
      leftAt: new Date().toISOString(),
    };

    it('should return 200 on successful removal', async () => {
      mockRemoveUserFromOrganizationUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.remove(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call removeUserFromOrganizationUseCase.execute with dto and executorId', async () => {
      mockRemoveUserFromOrganizationUseCase.execute.mockResolvedValue(successResponse);

      await controller.remove(validRequest);

      expect(mockRemoveUserFromOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockRemoveUserFromOrganizationUseCase.execute).toHaveBeenCalledWith(
        { organizationId: ORG_ID, userId: USER_ID },
        EXECUTOR_ID
      );
    });

    it('should propagate UserNotMemberError to error handler', async () => {
      const error = new UserNotMemberError(USER_ID, ORG_ID);
      mockRemoveUserFromOrganizationUseCase.execute.mockRejectedValue(error);

      await expect(controller.remove(validRequest)).rejects.toThrow(
        UserNotMemberError
      );
    });
  });

  describe('changeRole()', () => {
    const validRequest: AuthenticatedRequest = {
      body: { newRole: 'nurse' },
      headers: {},
      params: { organizationId: ORG_ID, userId: USER_ID },
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    const successResponse = {
      success: true,
      message: 'Role changed successfully',
      membership: {
        id: MEMBERSHIP_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: 'nurse',
      },
    };

    it('should return 200 with updated membership on success', async () => {
      mockChangeUserOrganizationRoleUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.changeRole(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call changeRoleUseCase.execute with dto and executorId', async () => {
      mockChangeUserOrganizationRoleUseCase.execute.mockResolvedValue(successResponse);

      await controller.changeRole(validRequest);

      expect(mockChangeUserOrganizationRoleUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockChangeUserOrganizationRoleUseCase.execute).toHaveBeenCalledWith(
        {
          organizationId: ORG_ID,
          userId: USER_ID,
          newRole: 'nurse',
        },
        EXECUTOR_ID
      );
    });

    it('should propagate UserNotMemberError to error handler', async () => {
      const error = new UserNotMemberError(USER_ID, ORG_ID);
      mockChangeUserOrganizationRoleUseCase.execute.mockRejectedValue(error);

      await expect(controller.changeRole(validRequest)).rejects.toThrow(
        UserNotMemberError
      );
    });
  });

  describe('getMembers()', () => {
    const validRequest: AuthenticatedRequest = {
      body: {},
      headers: {},
      params: { organizationId: ORG_ID },
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    const successResponse = {
      members: [
        {
          id: MEMBERSHIP_ID,
          userId: USER_ID,
          userEmail: 'user@example.com',
          role: 'doctor',
        },
      ],
      total: 1,
    };

    it('should return 200 with members list on success', async () => {
      mockGetOrganizationMembersUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.getMembers(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call getOrganizationMembersUseCase.execute with organizationId and executorId', async () => {
      mockGetOrganizationMembersUseCase.execute.mockResolvedValue(successResponse);

      await controller.getMembers(validRequest);

      expect(mockGetOrganizationMembersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetOrganizationMembersUseCase.execute).toHaveBeenCalledWith(
        ORG_ID,
        EXECUTOR_ID,
        {}
      );
    });

    it('should return empty list when no members exist', async () => {
      const emptyResponse = { members: [], total: 0 };
      mockGetOrganizationMembersUseCase.execute.mockResolvedValue(emptyResponse);

      const result = await controller.getMembers(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.data).toEqual(emptyResponse);
    });
  });

  describe('getUserOrganizations()', () => {
    const validRequest: AuthenticatedRequest = {
      body: {},
      headers: {},
      params: { userId: USER_ID },
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    const successResponse = {
      memberships: [
        {
          id: MEMBERSHIP_ID,
          organizationId: ORG_ID,
          organizationName: 'Hospital Central',
          role: 'doctor',
        },
      ],
      total: 1,
    };

    it('should return 200 with organizations list on success', async () => {
      mockGetUserOrganizationsUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.getUserOrganizations(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call getUserOrganizationsUseCase.execute with userId and executorId', async () => {
      mockGetUserOrganizationsUseCase.execute.mockResolvedValue(successResponse);

      await controller.getUserOrganizations(validRequest);

      expect(mockGetUserOrganizationsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetUserOrganizationsUseCase.execute).toHaveBeenCalledWith(
        USER_ID,
        EXECUTOR_ID,
        {}
      );
    });

    it('should return empty list when user has no organizations', async () => {
      const emptyResponse = { memberships: [], total: 0 };
      mockGetUserOrganizationsUseCase.execute.mockResolvedValue(emptyResponse);

      const result = await controller.getUserOrganizations(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.data).toEqual(emptyResponse);
    });
  });
});
