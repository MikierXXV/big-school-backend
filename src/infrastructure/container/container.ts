/**
 * ============================================
 * DI CONTAINER: Application Composition Root
 * ============================================
 *
 * Contenedor de inyección de dependencias.
 * Crea e interconecta todas las dependencias de la aplicación.
 *
 * RESPONSABILIDADES:
 * - Instanciar servicios de infraestructura
 * - Instanciar repositorios
 * - Instanciar casos de uso con sus dependencias
 * - Exponer configuración
 */

import { ILogger } from '../../application/ports/logger.port.js';
import { IDateTimeService } from '../../application/ports/datetime.service.port.js';
import { IUuidGenerator } from '../../application/ports/uuid-generator.port.js';
import { IHashingService } from '../../application/ports/hashing.service.port.js';
import { ITokenService } from '../../application/ports/token.service.port.js';
import { IRateLimiter } from '../../application/ports/rate-limiter.port.js';
import { IAuthorizationService } from '../../application/ports/authorization.service.port.js';
import { UserRepository } from '../../domain/repositories/user.repository.interface.js';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface.js';
import { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.interface.js';
import { IOrganizationRepository } from '../../domain/repositories/organization.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../domain/repositories/organization-membership.repository.interface.js';
import { IAdminPermissionRepository } from '../../domain/repositories/admin-permission.repository.interface.js';

import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case.js';
import { LoginUserUseCase } from '../../application/use-cases/auth/login-user.use-case.js';
import { RefreshSessionUseCase } from '../../application/use-cases/auth/refresh-session.use-case.js';
import { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case.js';
import { RequestPasswordResetUseCase } from '../../application/use-cases/auth/request-password-reset.use-case.js';
import { ConfirmPasswordResetUseCase } from '../../application/use-cases/auth/confirm-password-reset.use-case.js';
import { PromoteToAdminUseCase } from '../../application/use-cases/admin/promote-to-admin.use-case.js';
import { DemoteToUserUseCase } from '../../application/use-cases/admin/demote-to-user.use-case.js';
import { GrantAdminPermissionUseCase } from '../../application/use-cases/admin/grant-admin-permission.use-case.js';
import { RevokeAdminPermissionUseCase } from '../../application/use-cases/admin/revoke-admin-permission.use-case.js';
import { GetAdminPermissionsUseCase } from '../../application/use-cases/admin/get-admin-permissions.use-case.js';
import { CreateOrganizationUseCase } from '../../application/use-cases/organization/create-organization.use-case.js';
import { GetOrganizationUseCase } from '../../application/use-cases/organization/get-organization.use-case.js';
import { ListOrganizationsUseCase } from '../../application/use-cases/organization/list-organizations.use-case.js';
import { UpdateOrganizationUseCase } from '../../application/use-cases/organization/update-organization.use-case.js';
import { DeleteOrganizationUseCase } from '../../application/use-cases/organization/delete-organization.use-case.js';
import { AssignUserToOrganizationUseCase } from '../../application/use-cases/membership/assign-user-to-organization.use-case.js';
import { RemoveUserFromOrganizationUseCase } from '../../application/use-cases/membership/remove-user-from-organization.use-case.js';
import { ChangeUserOrganizationRoleUseCase } from '../../application/use-cases/membership/change-user-organization-role.use-case.js';
import { GetOrganizationMembersUseCase } from '../../application/use-cases/membership/get-organization-members.use-case.js';
import { GetUserOrganizationsUseCase } from '../../application/use-cases/membership/get-user-organizations.use-case.js';

import { ConsoleLogger } from '../logging/console-logger.service.js';
import { SystemDateTimeService } from '../services/system-datetime.service.js';
import { CryptoUuidGenerator } from '../services/crypto-uuid-generator.service.js';
import { BcryptHashingService } from '../services/bcrypt-hashing.service.js';
import { JwtTokenService } from '../services/jwt-token.service.js';
import { InMemoryRateLimiter } from '../services/in-memory-rate-limiter.service.js';
import { RBACAuthorizationService } from '../services/rbac-authorization.service.js';

import { InMemoryUserRepository } from '../persistence/in-memory/in-memory-user.repository.js';
import { InMemoryRefreshTokenRepository } from '../persistence/in-memory/in-memory-refresh-token.repository.js';
import { InMemoryPasswordResetTokenRepository } from '../persistence/in-memory/in-memory-password-reset-token.repository.js';
import { InMemoryOrganizationRepository } from '../persistence/in-memory/in-memory-organization.repository.js';
import { InMemoryOrganizationMembershipRepository } from '../persistence/in-memory/in-memory-organization-membership.repository.js';
import { InMemoryAdminPermissionRepository } from '../persistence/in-memory/in-memory-admin-permission.repository.js';

import { PostgresUserRepository } from '../persistence/postgresql/postgres-user.repository.js';
import { PostgresRefreshTokenRepository } from '../persistence/postgresql/postgres-refresh-token.repository.js';
import { PostgresPasswordResetTokenRepository } from '../persistence/postgresql/postgres-password-reset-token.repository.js';

import { getPool } from '../database/index.js';

import { loadEnvironmentConfig, EnvironmentConfig, ServerConfig } from '../config/environment.config.js';
import { loadJwtConfig, JwtConfig } from '../config/jwt.config.js';

import { AdminController } from '../../interfaces/http/controllers/admin.controller.js';
import { OrganizationController } from '../../interfaces/http/controllers/organization.controller.js';
import { OrganizationMembershipController } from '../../interfaces/http/controllers/organization-membership.controller.js';
import { AuthorizationMiddleware } from '../../interfaces/http/middlewares/authorization.middleware.js';

/**
 * Configuración del contenedor.
 */
export interface ContainerConfig {
  readonly server: ServerConfig;
  readonly jwt: JwtConfig;
}

/**
 * Contenedor de dependencias de la aplicación.
 */
export interface AppContainer {
  // Services
  readonly logger: ILogger;
  readonly dateTimeService: IDateTimeService;
  readonly uuidGenerator: IUuidGenerator;
  readonly hashingService: IHashingService;
  readonly tokenService: ITokenService;
  readonly rateLimiter: IRateLimiter;
  readonly authorizationService: IAuthorizationService;

  // Repositories
  readonly userRepository: UserRepository;
  readonly refreshTokenRepository: RefreshTokenRepository;
  readonly passwordResetTokenRepository: PasswordResetTokenRepository;
  readonly organizationRepository: IOrganizationRepository;
  readonly organizationMembershipRepository: IOrganizationMembershipRepository;
  readonly adminPermissionRepository: IAdminPermissionRepository;

  // Use Cases
  readonly registerUserUseCase: RegisterUserUseCase;
  readonly loginUserUseCase: LoginUserUseCase;
  readonly refreshSessionUseCase: RefreshSessionUseCase;
  readonly verifyEmailUseCase: VerifyEmailUseCase;
  readonly requestPasswordResetUseCase: RequestPasswordResetUseCase;
  readonly confirmPasswordResetUseCase: ConfirmPasswordResetUseCase;

  // Controllers
  readonly adminController: AdminController;
  readonly organizationController: OrganizationController;
  readonly organizationMembershipController: OrganizationMembershipController;

  // Middlewares
  readonly authorizationMiddleware: AuthorizationMiddleware;

  // Config
  readonly config: ContainerConfig;
}

/**
 * Crea el contenedor de dependencias con todas las instancias.
 *
 * @returns Contenedor con todas las dependencias instanciadas
 */
export function createContainer(): AppContainer {
  // ============================================
  // 1. CONFIGURATION
  // ============================================
  const envConfig: EnvironmentConfig = loadEnvironmentConfig();
  const jwtConfig: JwtConfig = loadJwtConfig();

  // Get hashing rounds from env or default
  const saltRounds = parseInt(process.env.HASH_SALT_ROUNDS || '12', 10);

  // Get log level from env
  const logLevel = (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error';

  // ============================================
  // 2. INFRASTRUCTURE SERVICES
  // ============================================
  const logger: ILogger = new ConsoleLogger({ module: 'app' }, logLevel);
  const dateTimeService: IDateTimeService = new SystemDateTimeService();
  const uuidGenerator: IUuidGenerator = new CryptoUuidGenerator();
  const hashingService: IHashingService = new BcryptHashingService({ saltRounds });
  const tokenService: ITokenService = new JwtTokenService(jwtConfig, dateTimeService);
  const rateLimiter: IRateLimiter = new InMemoryRateLimiter();

  // ============================================
  // 3. REPOSITORIES (PostgreSQL or InMemory)
  // ============================================
  const usePostgres = process.env.USE_POSTGRES === 'true';

  let userRepository: UserRepository;
  let refreshTokenRepository: RefreshTokenRepository;
  let passwordResetTokenRepository: PasswordResetTokenRepository;

  if (usePostgres) {
    const pool = getPool();
    logger.info('Using PostgreSQL repositories');

    userRepository = new PostgresUserRepository(pool);
    refreshTokenRepository = new PostgresRefreshTokenRepository(pool);
    passwordResetTokenRepository = new PostgresPasswordResetTokenRepository(pool);
  } else {
    logger.info('Using InMemory repositories');

    userRepository = new InMemoryUserRepository();
    refreshTokenRepository = new InMemoryRefreshTokenRepository();
    passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();
  }

  // ============================================
  // RBAC Repositories (Feature 012)
  // ============================================
  const organizationRepository = new InMemoryOrganizationRepository();
  const organizationMembershipRepository = new InMemoryOrganizationMembershipRepository();
  const adminPermissionRepository = new InMemoryAdminPermissionRepository();

  // ============================================
  // Authorization Service (Feature 012)
  // ============================================
  const authorizationService = new RBACAuthorizationService(
    userRepository,
    adminPermissionRepository,
    organizationMembershipRepository
  );

  // ============================================
  // 4. USE CASES
  // ============================================
  const registerUserUseCase = new RegisterUserUseCase({
    userRepository,
    hashingService,
    uuidGenerator,
    dateTimeService,
    tokenService,
    logger: logger.child({ useCase: 'RegisterUser' }),
    isProduction: envConfig.server.isProduction,
  });

  const loginUserUseCase = new LoginUserUseCase({
    userRepository,
    refreshTokenRepository,
    tokenService,
    hashingService,
    uuidGenerator,
    dateTimeService,
    logger: logger.child({ useCase: 'LoginUser' }),
  });

  const refreshSessionUseCase = new RefreshSessionUseCase({
    userRepository,
    refreshTokenRepository,
    tokenService,
    uuidGenerator,
    dateTimeService,
    logger: logger.child({ useCase: 'RefreshSession' }),
  });

  const verifyEmailUseCase = new VerifyEmailUseCase({
    userRepository,
    tokenService,
    dateTimeService,
    logger: logger.child({ useCase: 'VerifyEmail' }),
  });

  const requestPasswordResetUseCase = new RequestPasswordResetUseCase({
    userRepository,
    passwordResetTokenRepository,
    tokenService,
    uuidGenerator,
    dateTimeService,
    logger: logger.child({ useCase: 'RequestPasswordReset' }),
  });

  const confirmPasswordResetUseCase = new ConfirmPasswordResetUseCase({
    userRepository,
    passwordResetTokenRepository,
    refreshTokenRepository,
    tokenService,
    hashingService,
    dateTimeService,
    logger: logger.child({ useCase: 'ConfirmPasswordReset' }),
  });

  // ============================================
  // Admin Use Cases (Feature 012)
  // ============================================
  const promoteToAdminUseCase = new PromoteToAdminUseCase({
    userRepository,
    authorizationService,
    dateTimeService,
  });

  const demoteToUserUseCase = new DemoteToUserUseCase({
    userRepository,
    authorizationService,
    dateTimeService,
  });

  const grantAdminPermissionUseCase = new GrantAdminPermissionUseCase({
    userRepository,
    adminPermissionRepository,
    authorizationService,
    uuidGenerator,
    dateTimeService,
  });

  const revokeAdminPermissionUseCase = new RevokeAdminPermissionUseCase({
    userRepository,
    adminPermissionRepository,
    authorizationService,
  });

  const getAdminPermissionsUseCase = new GetAdminPermissionsUseCase({
    userRepository,
    adminPermissionRepository,
    authorizationService,
  });

  // ============================================
  // Organization Use Cases (Feature 012)
  // ============================================
  const createOrganizationUseCase = new CreateOrganizationUseCase({
    organizationRepository,
    membershipRepository: organizationMembershipRepository,
    userRepository,
    authorizationService,
    uuidGenerator,
    dateTimeService,
  });

  const getOrganizationUseCase = new GetOrganizationUseCase({
    organizationRepository,
    authorizationService,
  });

  const listOrganizationsUseCase = new ListOrganizationsUseCase({
    organizationRepository,
    membershipRepository: organizationMembershipRepository,
    authorizationService,
  });

  const updateOrganizationUseCase = new UpdateOrganizationUseCase({
    organizationRepository,
    authorizationService,
    dateTimeService,
  });

  const deleteOrganizationUseCase = new DeleteOrganizationUseCase({
    organizationRepository,
    authorizationService,
  });

  // ============================================
  // Membership Use Cases (Feature 012)
  // ============================================
  const assignUserToOrganizationUseCase = new AssignUserToOrganizationUseCase({
    organizationRepository,
    membershipRepository: organizationMembershipRepository,
    userRepository,
    authorizationService,
    uuidGenerator,
  });

  const removeUserFromOrganizationUseCase = new RemoveUserFromOrganizationUseCase({
    membershipRepository: organizationMembershipRepository,
    authorizationService,
    dateTimeService,
  });

  const changeUserOrganizationRoleUseCase = new ChangeUserOrganizationRoleUseCase({
    membershipRepository: organizationMembershipRepository,
    authorizationService,
    dateTimeService,
  });

  const getOrganizationMembersUseCase = new GetOrganizationMembersUseCase({
    membershipRepository: organizationMembershipRepository,
    userRepository,
    authorizationService,
  });

  const getUserOrganizationsUseCase = new GetUserOrganizationsUseCase({
    membershipRepository: organizationMembershipRepository,
    organizationRepository,
    authorizationService,
  });

  // ============================================
  // RBAC Controllers (Feature 012)
  // ============================================
  const adminController = new AdminController({
    promoteToAdminUseCase,
    demoteToUserUseCase,
    grantAdminPermissionUseCase,
    revokeAdminPermissionUseCase,
    getAdminPermissionsUseCase,
  });

  const organizationController = new OrganizationController({
    createOrganizationUseCase,
    getOrganizationUseCase,
    listOrganizationsUseCase,
    updateOrganizationUseCase,
    deleteOrganizationUseCase,
  });

  const organizationMembershipController = new OrganizationMembershipController({
    assignUserToOrganizationUseCase,
    removeUserFromOrganizationUseCase,
    changeUserOrganizationRoleUseCase,
    getOrganizationMembersUseCase,
    getUserOrganizationsUseCase,
  });

  // ============================================
  // Authorization Middleware (Feature 012)
  // ============================================
  const authorizationMiddleware = new AuthorizationMiddleware(authorizationService);

  // ============================================
  // 5. RETURN CONTAINER
  // ============================================
  return {
    // Services
    logger,
    dateTimeService,
    uuidGenerator,
    hashingService,
    tokenService,
    rateLimiter,
    authorizationService,

    // Repositories
    userRepository,
    refreshTokenRepository,
    passwordResetTokenRepository,
    organizationRepository,
    organizationMembershipRepository,
    adminPermissionRepository,

    // Use Cases
    registerUserUseCase,
    loginUserUseCase,
    refreshSessionUseCase,
    verifyEmailUseCase,
    requestPasswordResetUseCase,
    confirmPasswordResetUseCase,

    // Controllers
    adminController,
    organizationController,
    organizationMembershipController,

    // Middlewares
    authorizationMiddleware,

    // Config
    config: {
      server: envConfig.server,
      jwt: jwtConfig,
    },
  };
}
