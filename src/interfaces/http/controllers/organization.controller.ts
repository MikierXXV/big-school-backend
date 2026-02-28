/**
 * ============================================
 * CONTROLLER: OrganizationController
 * ============================================
 *
 * Controlador para endpoints de gestión de organizaciones.
 * Maneja creación, consulta, actualización y desactivación.
 *
 * ENDPOINTS:
 * - POST /organizations - Crear organización
 * - GET /organizations/:id - Obtener organización
 * - GET /organizations - Listar organizaciones
 * - PATCH /organizations/:id - Actualizar organización
 * - DELETE /organizations/:id - Desactivar organización
 *
 * RESPONSABILIDADES:
 * - Extraer datos del request
 * - Invocar caso de uso correspondiente
 * - Formatear respuesta HTTP
 * - Propagar errores al error handler
 */

import { HttpResponse } from './auth.controller.js';
import { CreateOrganizationUseCase } from '../../../application/use-cases/organization/create-organization.use-case.js';
import { GetOrganizationUseCase } from '../../../application/use-cases/organization/get-organization.use-case.js';
import { ListOrganizationsUseCase } from '../../../application/use-cases/organization/list-organizations.use-case.js';
import { UpdateOrganizationUseCase } from '../../../application/use-cases/organization/update-organization.use-case.js';
import { DeleteOrganizationUseCase } from '../../../application/use-cases/organization/delete-organization.use-case.js';
import {
  CreateOrganizationRequestDto,
  UpdateOrganizationRequestDto,
  OrganizationResponseDto,
  ListOrganizationsQueryDto,
  ListOrganizationsResponseDto,
} from '../../../application/dtos/organization/organization.dto.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

/**
 * Dependencias del OrganizationController.
 */
export interface OrganizationControllerDependencies {
  readonly createOrganizationUseCase: CreateOrganizationUseCase;
  readonly getOrganizationUseCase: GetOrganizationUseCase;
  readonly listOrganizationsUseCase: ListOrganizationsUseCase;
  readonly updateOrganizationUseCase: UpdateOrganizationUseCase;
  readonly deleteOrganizationUseCase: DeleteOrganizationUseCase;
}

/**
 * Controlador de organizaciones.
 * Independiente del framework HTTP.
 */
export class OrganizationController {
  /**
   * Casos de uso inyectados.
   * @private
   */
  private readonly deps: OrganizationControllerDependencies;

  /**
   * Constructor con inyección de dependencias.
   *
   * @param deps - Casos de uso requeridos
   */
  constructor(deps: OrganizationControllerDependencies) {
    this.deps = deps;
  }

  /**
   * Maneja POST /organizations
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con organización creada
   */
  public async create(
    request: AuthenticatedRequest<CreateOrganizationRequestDto>
  ): Promise<HttpResponse<OrganizationResponseDto>> {
    const executorId = request.user!.userId;
    const dto = request.body;

    const result = await this.deps.createOrganizationUseCase.execute(dto, executorId);

    return {
      statusCode: 201,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja GET /organizations/:id
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con organización
   */
  public async getById(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<OrganizationResponseDto>> {
    const executorId = request.user!.userId;
    const organizationId = request.params.id || '';

    const result = await this.deps.getOrganizationUseCase.execute(
      organizationId,
      executorId
    );

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja GET /organizations
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con lista de organizaciones
   */
  public async list(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<ListOrganizationsResponseDto>> {
    const executorId = request.user!.userId;
    const rawQuery = request.query || {};

    // Parse query parameters from string to proper types
    const query: ListOrganizationsQueryDto = {
      ...(rawQuery.type && { type: rawQuery.type as string }),
      ...(rawQuery.active !== undefined && { active: rawQuery.active === 'true' }),
      ...(rawQuery.page && { page: parseInt(rawQuery.page as string, 10) }),
      ...(rawQuery.limit && { limit: parseInt(rawQuery.limit as string, 10) }),
    };

    const result = await this.deps.listOrganizationsUseCase.execute(query, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja PATCH /organizations/:id
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con organización actualizada
   */
  public async update(
    request: AuthenticatedRequest<UpdateOrganizationRequestDto>
  ): Promise<HttpResponse<OrganizationResponseDto>> {
    const executorId = request.user!.userId;
    const organizationId = request.params.id || '';

    const result = await this.deps.updateOrganizationUseCase.execute(
      organizationId,
      request.body,
      executorId
    );

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja DELETE /organizations/:id
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con organización eliminada
   */
  public async delete(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<{ message: string }>> {
    const executorId = request.user!.userId;
    const organizationId = request.params.id || '';

    await this.deps.deleteOrganizationUseCase.execute(organizationId, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: { message: 'Organization deleted successfully' },
      },
    };
  }

  /**
   * Maneja DELETE /organizations/:id (deactivate)
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con organización desactivada
   */
  public async deactivate(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<OrganizationResponseDto>> {
    const executorId = request.user!.userId;
    const organizationId = request.params.id || '';

    const result = await this.deps.deleteOrganizationUseCase.execute(organizationId, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }
}
