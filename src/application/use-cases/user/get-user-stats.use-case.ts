/**
 * ============================================
 * USE CASE: GetUserStats
 * ============================================
 *
 * Obtiene estadísticas agregadas de usuarios para el panel de analytics.
 *
 * FLUJO:
 * 1. Verificar que el ejecutor tiene permiso (super_admin o manage_users)
 * 2. Obtener conteos por role y status (GROUP BY en users)
 * 3. Obtener conteos por proveedor OAuth (GROUP BY en oauth_connections)
 * 4. Calcular local = total - (google + microsoft)
 * 5. Retornar UserStatsResponseDto
 *
 * EFICIENCIA:
 * - Solo 2 queries SQL con GROUP BY, independiente del número de usuarios
 * - No carga entidades en memoria
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IOAuthConnectionRepository } from '../../../domain/repositories/oauth-connection.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';
import type {
  GetUserStatsRequestDto,
  GetUserStatsResponseDto,
} from '../../dtos/user/user-stats.dto.js';

export interface GetUserStatsDependencies {
  readonly userRepository: UserRepository;
  readonly oauthConnectionRepository: IOAuthConnectionRepository;
  readonly authorizationService: IAuthorizationService;
}

export class GetUserStatsUseCase {
  private readonly deps: GetUserStatsDependencies;

  constructor(deps: GetUserStatsDependencies) {
    this.deps = deps;
  }

  public async execute(request: GetUserStatsRequestDto): Promise<GetUserStatsResponseDto> {
    // 1. Verificar permisos
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(request.executorId);
    const hasPermission = await this.deps.authorizationService.hasPermission(
      request.executorId,
      'manage_users'
    );

    if (!isSuperAdmin && !hasPermission) {
      throw new InsufficientPermissionsError('Get user stats', request.executorId);
    }

    // 2. Obtener stats de usuario y conteos OAuth en paralelo
    const [userStats, providerCounts] = await Promise.all([
      this.deps.userRepository.getStats(),
      this.deps.oauthConnectionRepository.countByProvider(),
    ]);

    // 3. Calcular usuarios locales (sin conexión OAuth)
    const oauthTotal = providerCounts.google + providerCounts.microsoft;
    const local = Math.max(0, userStats.total - oauthTotal);

    return {
      total: userStats.total,
      emailVerified: userStats.emailVerified,
      byRole: userStats.byRole,
      byStatus: userStats.byStatus,
      byProvider: {
        local,
        google: providerCounts.google,
        microsoft: providerCounts.microsoft,
      },
    };
  }
}
