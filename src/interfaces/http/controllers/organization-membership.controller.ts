/**
 * ============================================
 * CONTROLLER: OrganizationMembershipController
 * ============================================
 *
 * Controlador para endpoints de gestión de membresías organizacionales.
 * Maneja asignación, remoción y cambio de roles de miembros.
 *
 * ENDPOINTS:
 * - POST /organizations/:organizationId/members - Asignar miembro
 * - DELETE /organizations/:organizationId/members/:userId - Remover miembro
 * - PATCH /organizations/:organizationId/members/:userId/role - Cambiar rol
 * - GET /organizations/:organizationId/members - Listar miembros
 * - GET /users/:userId/organizations - Listar organizaciones del usuario
 *
 * RESPONSABILIDADES:
 * - Extraer datos del request
 * - Invocar caso de uso correspondiente
 * - Formatear respuesta HTTP
 * - Propagar errores al error handler
 */

import { HttpResponse } from './auth.controller.js';
import { AssignUserToOrganizationUseCase } from '../../../application/use-cases/membership/assign-user-to-organization.use-case.js';
import { RemoveUserFromOrganizationUseCase } from '../../../application/use-cases/membership/remove-user-from-organization.use-case.js';
import { ChangeUserOrganizationRoleUseCase } from '../../../application/use-cases/membership/change-user-organization-role.use-case.js';
import { GetOrganizationMembersUseCase } from '../../../application/use-cases/membership/get-organization-members.use-case.js';
import { GetUserOrganizationsUseCase } from '../../../application/use-cases/membership/get-user-organizations.use-case.js';
import {
  AssignMemberRequestDto,
  ChangeMemberRoleRequestDto,
  RemoveMemberRequestDto,
  MembershipResponseDto,
  OrganizationMembersResponseDto,
  UserOrganizationsResponseDto,
} from '../../../application/dtos/membership/membership.dto.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

/**
 * Dependencias del OrganizationMembershipController.
 */
export interface OrganizationMembershipControllerDependencies {
  readonly assignUserToOrganizationUseCase: AssignUserToOrganizationUseCase;
  readonly removeUserFromOrganizationUseCase: RemoveUserFromOrganizationUseCase;
  readonly changeUserOrganizationRoleUseCase: ChangeUserOrganizationRoleUseCase;
  readonly getOrganizationMembersUseCase: GetOrganizationMembersUseCase;
  readonly getUserOrganizationsUseCase: GetUserOrganizationsUseCase;
}

/**
 * Controlador de membresías organizacionales.
 * Independiente del framework HTTP.
 */
export class OrganizationMembershipController {
  /**
   * Casos de uso inyectados.
   * @private
   */
  private readonly deps: OrganizationMembershipControllerDependencies;

  /**
   * Constructor con inyección de dependencias.
   *
   * @param deps - Casos de uso requeridos
   */
  constructor(deps: OrganizationMembershipControllerDependencies) {
    this.deps = deps;
  }

  /**
   * Maneja POST /organizations/:organizationId/members
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con membresía creada
   */
  public async assign(
    request: AuthenticatedRequest<Partial<AssignMemberRequestDto>>
  ): Promise<HttpResponse<MembershipResponseDto>> {
    const executorId = request.user!.userId;
    const organizationId = request.params.organizationId || '';

    const dto: AssignMemberRequestDto = {
      organizationId,
      userId: request.body.userId!,
      role: request.body.role!,
    };

    const result = await this.deps.assignUserToOrganizationUseCase.execute(dto, executorId);

    return {
      statusCode: 201,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja DELETE /organizations/:organizationId/members/:userId
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con resultado
   */
  public async remove(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<{ message: string }>> {
    const executorId = request.user!.userId;
    const organizationId = request.params.organizationId || '';
    const userId = request.params.userId || '';

    const dto: RemoveMemberRequestDto = { organizationId, userId };
    await this.deps.removeUserFromOrganizationUseCase.execute(dto, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: { message: 'Member removed successfully' },
      },
    };
  }

  /**
   * Maneja PATCH /organizations/:organizationId/members/:userId/role
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con membresía actualizada
   */
  public async changeRole(
    request: AuthenticatedRequest<{ newRole: string }>
  ): Promise<HttpResponse<MembershipResponseDto>> {
    const executorId = request.user!.userId;
    const organizationId = request.params.organizationId || '';
    const userId = request.params.userId || '';

    const dto: ChangeMemberRoleRequestDto = {
      organizationId,
      userId,
      newRole: request.body.newRole,
    };

    const result = await this.deps.changeUserOrganizationRoleUseCase.execute(dto, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }

  /**
   * Maneja GET /organizations/:organizationId/members
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con lista de miembros
   */
  public async getMembers(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<OrganizationMembersResponseDto>> {
    const executorId = request.user!.userId;
    const organizationId = request.params.organizationId || '';

    const result = await this.deps.getOrganizationMembersUseCase.execute(
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
   * Maneja GET /users/:userId/organizations
   *
   * @param request - Request HTTP autenticado
   * @returns Response HTTP con lista de organizaciones
   */
  public async getUserOrganizations(
    request: AuthenticatedRequest
  ): Promise<HttpResponse<UserOrganizationsResponseDto>> {
    const executorId = request.user!.userId;
    const userId = request.params.userId || '';

    const result = await this.deps.getUserOrganizationsUseCase.execute(userId, executorId);

    return {
      statusCode: 200,
      body: {
        success: true,
        data: result,
      },
    };
  }
}
