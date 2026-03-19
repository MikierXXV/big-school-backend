/**
 * ============================================
 * USE CASE: ListUsers
 * ============================================
 *
 * Lists all system users with pagination.
 * Only SUPER_ADMIN or users with manage_users permission can execute.
 */

import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';
import { IDateTimeService } from '../../ports/datetime.service.port.js';
import { IOAuthConnectionRepository } from '../../../domain/repositories/oauth-connection.repository.interface.js';
import type {
  ListUsersRequestDto,
  ListUsersResponseDto,
} from '../../dtos/user/list-users.dto.js';

export interface ListUsersDependencies {
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
  readonly dateTimeService: IDateTimeService;
  readonly oauthConnectionRepository: IOAuthConnectionRepository;
}

export class ListUsersUseCase {
  private readonly deps: ListUsersDependencies;

  constructor(deps: ListUsersDependencies) {
    this.deps = deps;
  }

  public async execute(request: ListUsersRequestDto): Promise<ListUsersResponseDto> {
    // 1. Verify executor has permission
    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(request.executorId);
    const hasPermission = await this.deps.authorizationService.hasPermission(
      request.executorId,
      'manage_users'
    );

    if (!isSuperAdmin && !hasPermission) {
      throw new InsufficientPermissionsError('List users', request.executorId);
    }

    // 2. Get paginated users
    const page = request.page || 1;
    const limit = request.limit || 20;

    const result = await this.deps.userRepository.findAll({
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...(request.search ? { search: request.search } : {}),
      ...(request.role ? { role: request.role } : {}),
    });

    // 3. Resolve OAuth providers for all users (single batch query)
    const userIds = result.items.map((u) => u.id.value);
    const oauthConnections = await this.deps.oauthConnectionRepository.findByUserIds(userIds);
    const providerByUserId = new Map<string, 'google' | 'microsoft'>();
    for (const conn of oauthConnections) {
      providerByUserId.set(conn.userId.value, conn.provider.value as 'google' | 'microsoft');
    }

    // 4. Map to response DTO
    const users = result.items.map((user) => ({
      id: user.id.value,
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      systemRole: user.systemRole.getValue(),
      status: user.status,
      emailVerified: user.isEmailVerified(),
      createdAt: this.deps.dateTimeService.toISOString(user.createdAt),
      authProvider: providerByUserId.get(user.id.value) ?? ('local' as const),
    }));

    return {
      users,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious,
    };
  }
}
