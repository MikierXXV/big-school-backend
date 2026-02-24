/**
 * ============================================
 * UNIT TEST: OrganizationController
 * ============================================
 *
 * Tests para el controlador de organizaciones.
 * Los controllers NO capturan errores internamente,
 * los propagan al error handler middleware.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationController } from '../../../../../src/interfaces/http/controllers/organization.controller.js';
import { CreateOrganizationUseCase } from '../../../../../src/application/use-cases/organizations/create-organization.use-case.js';
import { GetOrganizationUseCase } from '../../../../../src/application/use-cases/organizations/get-organization.use-case.js';
import { ListOrganizationsUseCase } from '../../../../../src/application/use-cases/organizations/list-organizations.use-case.js';
import { UpdateOrganizationUseCase } from '../../../../../src/application/use-cases/organizations/update-organization.use-case.js';
import { DeactivateOrganizationUseCase } from '../../../../../src/application/use-cases/organizations/deactivate-organization.use-case.js';
import { AuthenticatedRequest } from '../../../../../src/interfaces/http/middlewares/auth.middleware.js';
import { OrganizationNotFoundError, OrganizationAlreadyExistsError } from '../../../../../src/domain/errors/organization.errors.js';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let mockCreateOrganizationUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockGetOrganizationUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockListOrganizationsUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockUpdateOrganizationUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockDeleteOrganizationUseCase: { execute: ReturnType<typeof vi.fn> };

  const EXECUTOR_ID = '123e4567-e89b-42d3-a456-426614174000';
  const ORG_ID = 'org_123e4567-e89b-42d3-a456-426614174000';

  beforeEach(() => {
    mockCreateOrganizationUseCase = { execute: vi.fn() };
    mockGetOrganizationUseCase = { execute: vi.fn() };
    mockListOrganizationsUseCase = { execute: vi.fn() };
    mockUpdateOrganizationUseCase = { execute: vi.fn() };
    mockDeleteOrganizationUseCase = { execute: vi.fn() };

    controller = new OrganizationController({
      createOrganizationUseCase: mockCreateOrganizationUseCase as unknown as CreateOrganizationUseCase,
      getOrganizationUseCase: mockGetOrganizationUseCase as unknown as GetOrganizationUseCase,
      listOrganizationsUseCase: mockListOrganizationsUseCase as unknown as ListOrganizationsUseCase,
      updateOrganizationUseCase: mockUpdateOrganizationUseCase as unknown as UpdateOrganizationUseCase,
      deleteOrganizationUseCase: mockDeleteOrganizationUseCase as unknown as any,
    });
  });

  describe('create()', () => {
    const validRequest: AuthenticatedRequest = {
      body: {
        name: 'Hospital Central',
        type: 'hospital',
        description: 'Main hospital',
      },
      headers: {},
      params: {},
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    const successResponse = {
      success: true,
      message: 'Organization created successfully',
      organization: {
        id: ORG_ID,
        name: 'Hospital Central',
        type: 'hospital',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    };

    it('should return 201 with organization on successful creation', async () => {
      mockCreateOrganizationUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.create(validRequest);

      expect(result.statusCode).toBe(201);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call createOrganizationUseCase.execute with dto and executorId', async () => {
      mockCreateOrganizationUseCase.execute.mockResolvedValue(successResponse);

      await controller.create(validRequest);

      expect(mockCreateOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockCreateOrganizationUseCase.execute).toHaveBeenCalledWith(
        validRequest.body,
        EXECUTOR_ID
      );
    });

    it('should propagate OrganizationAlreadyExistsError to error handler', async () => {
      const error = new OrganizationAlreadyExistsError('Hospital Central');
      mockCreateOrganizationUseCase.execute.mockRejectedValue(error);

      await expect(controller.create(validRequest)).rejects.toThrow(
        OrganizationAlreadyExistsError
      );
    });
  });

  describe('getById()', () => {
    const validRequest: AuthenticatedRequest = {
      body: {},
      headers: {},
      params: { id: ORG_ID },
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    const successResponse = {
      organization: {
        id: ORG_ID,
        name: 'Hospital Central',
        type: 'hospital',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    };

    it('should return 200 with organization on success', async () => {
      mockGetOrganizationUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.getById(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call getOrganizationUseCase.execute with organizationId and executorId', async () => {
      mockGetOrganizationUseCase.execute.mockResolvedValue(successResponse);

      await controller.getById(validRequest);

      expect(mockGetOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetOrganizationUseCase.execute).toHaveBeenCalledWith(
        ORG_ID,
        EXECUTOR_ID
      );
    });

    it('should propagate OrganizationNotFoundError to error handler', async () => {
      const error = new OrganizationNotFoundError(ORG_ID);
      mockGetOrganizationUseCase.execute.mockRejectedValue(error);

      await expect(controller.getById(validRequest)).rejects.toThrow(
        OrganizationNotFoundError
      );
    });
  });

  describe('list()', () => {
    const validRequest: AuthenticatedRequest = {
      body: {},
      headers: {},
      params: {},
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    const successResponse = [
      {
        id: ORG_ID,
        name: 'Hospital Central',
        type: 'hospital',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return 200 with organizations list on success', async () => {
      mockListOrganizationsUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.list(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call listOrganizationsUseCase.execute with query and executorId', async () => {
      mockListOrganizationsUseCase.execute.mockResolvedValue(successResponse);

      await controller.list(validRequest);

      expect(mockListOrganizationsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockListOrganizationsUseCase.execute).toHaveBeenCalledWith({}, EXECUTOR_ID);
    });

    it('should return empty list when no organizations exist', async () => {
      const emptyResponse: typeof successResponse = [];
      mockListOrganizationsUseCase.execute.mockResolvedValue(emptyResponse);

      const result = await controller.list(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.data).toEqual(emptyResponse);
    });
  });

  describe('update()', () => {
    const validRequest: AuthenticatedRequest = {
      body: { name: 'Hospital Central Updated' },
      headers: {},
      params: { id: ORG_ID },
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    const successResponse = {
      success: true,
      message: 'Organization updated successfully',
      organization: {
        id: ORG_ID,
        name: 'Hospital Central Updated',
        type: 'hospital',
        status: 'active',
      },
    };

    it('should return 200 with updated organization on success', async () => {
      mockUpdateOrganizationUseCase.execute.mockResolvedValue(successResponse);

      const result = await controller.update(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successResponse);
    });

    it('should call updateOrganizationUseCase.execute with organizationId, updates, and executorId', async () => {
      mockUpdateOrganizationUseCase.execute.mockResolvedValue(successResponse);

      await controller.update(validRequest);

      expect(mockUpdateOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockUpdateOrganizationUseCase.execute).toHaveBeenCalledWith(
        ORG_ID,
        { name: 'Hospital Central Updated' },
        EXECUTOR_ID
      );
    });

    it('should propagate OrganizationNotFoundError to error handler', async () => {
      const error = new OrganizationNotFoundError(ORG_ID);
      mockUpdateOrganizationUseCase.execute.mockRejectedValue(error);

      await expect(controller.update(validRequest)).rejects.toThrow(
        OrganizationNotFoundError
      );
    });
  });

  describe('delete()', () => {
    const validRequest: AuthenticatedRequest = {
      body: {},
      headers: {},
      params: { id: ORG_ID },
      query: {},
      user: { userId: EXECUTOR_ID, email: 'admin@example.com' },
    };

    it('should return 200 on successful deletion', async () => {
      mockDeleteOrganizationUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.delete(validRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual({ message: 'Organization deleted successfully' });
    });

    it('should call deleteOrganizationUseCase.execute with organizationId and executorId', async () => {
      mockDeleteOrganizationUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(validRequest);

      expect(mockDeleteOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockDeleteOrganizationUseCase.execute).toHaveBeenCalledWith(
        ORG_ID,
        EXECUTOR_ID
      );
    });

    it('should propagate OrganizationNotFoundError to error handler', async () => {
      const error = new OrganizationNotFoundError(ORG_ID);
      mockDeleteOrganizationUseCase.execute.mockRejectedValue(error);

      await expect(controller.delete(validRequest)).rejects.toThrow(
        OrganizationNotFoundError
      );
    });
  });
});
