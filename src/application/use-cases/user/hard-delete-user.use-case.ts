/**
 * USE CASE: HardDeleteUser
 * Permanently removes a user from the system (SUPER_ADMIN or manage_users permission only).
 */
import { UserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { IAuthorizationService } from '../../ports/authorization.service.port.js';
import { UserNotFoundError } from '../../../domain/errors/user.errors.js';
import { InsufficientPermissionsError } from '../../../domain/errors/authorization.errors.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';

export interface HardDeleteUserDependencies {
  readonly userRepository: UserRepository;
  readonly authorizationService: IAuthorizationService;
}

export class HardDeleteUserUseCase {
  private readonly deps: HardDeleteUserDependencies;
  constructor(deps: HardDeleteUserDependencies) { this.deps = deps; }

  public async execute(userId: string, executorId: string): Promise<{ id: string; email: string }> {
    const user = await this.deps.userRepository.findById(UserId.create(userId));
    if (!user) throw new UserNotFoundError(userId);

    const isSuperAdmin = await this.deps.authorizationService.isSuperAdmin(executorId);
    const hasPermission = await this.deps.authorizationService.hasPermission(executorId, 'manage_users');
    if (!isSuperAdmin && !hasPermission) throw new InsufficientPermissionsError('Hard delete user', executorId);

    await this.deps.userRepository.hardDelete(userId);
    return { id: user.id.value, email: user.email.value };
  }
}
