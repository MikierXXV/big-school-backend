/**
 * ============================================
 * SEED: Super Admin Initial User
 * ============================================
 *
 * Creates the initial SUPER_ADMIN user from environment variables.
 *
 * This seed runs automatically on app startup (when NODE_ENV !== 'test'):
 * - Checks if a SUPER_ADMIN with the configured email exists
 * - If not, creates the SUPER_ADMIN user with credentials from .env
 *
 * Environment variables required:
 * - SUPER_ADMIN_EMAIL
 * - SUPER_ADMIN_PASSWORD
 * - SUPER_ADMIN_FIRST_NAME
 * - SUPER_ADMIN_LAST_NAME
 *
 * Feature 012: RBAC + Organizations
 */

import { UserId } from '../../domain/value-objects/user-id.value-object.js';
import { Email } from '../../domain/value-objects/email.value-object.js';
import { User, UserStatus } from '../../domain/entities/user.entity.js';
import { SystemRole } from '../../domain/value-objects/system-role.value-object.js';
import { AdminPermission } from '../../domain/value-objects/admin-permission.value-object.js';
import { AdminPermissionGrant } from '../../domain/entities/admin-permission-grant.entity.js';
import type { UserRepository } from '../../domain/repositories/user.repository.interface.js';
import type { IAdminPermissionRepository } from '../../domain/repositories/admin-permission.repository.interface.js';
import type { IHashingService } from '../../application/ports/hashing.service.port.js';
import type { IUuidGenerator } from '../../application/ports/uuid-generator.port.js';
import type { ILogger } from '../../application/ports/logger.port.js';

/**
 * Super Admin configuration from environment
 */
interface SuperAdminConfig {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Loads Super Admin configuration from environment variables
 *
 * @throws Error if any required env variable is missing
 */
function loadSuperAdminConfig(): SuperAdminConfig {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME;
  const lastName = process.env.SUPER_ADMIN_LAST_NAME;

  if (!email || !password || !firstName || !lastName) {
    throw new Error(
      'Missing SUPER_ADMIN environment variables. Required: ' +
        'SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_FIRST_NAME, SUPER_ADMIN_LAST_NAME'
    );
  }

  if (password.length < 8) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 8 characters');
  }

  return { email, password, firstName, lastName };
}

/**
 * Seeds the initial SUPER_ADMIN user
 *
 * - Checks if a user with SUPER_ADMIN_EMAIL exists
 * - If exists and is already SUPER_ADMIN → logs info, does nothing
 * - If exists but is not SUPER_ADMIN → logs warning, does nothing (manual intervention required)
 * - If doesn't exist → creates SUPER_ADMIN user with ACTIVE status and verified email
 *
 * @param userRepository - User repository for persistence
 * @param adminPermissionRepository - Admin permission repository for granting permissions
 * @param hashingService - Service to hash the password
 * @param uuidGenerator - Service to generate UUID for the user
 * @param logger - Logger for seed progress
 */
export async function seedSuperAdmin(
  userRepository: UserRepository,
  adminPermissionRepository: IAdminPermissionRepository,
  hashingService: IHashingService,
  uuidGenerator: IUuidGenerator,
  logger: ILogger
): Promise<void> {
  try {
    logger.info('🌱 Running SUPER_ADMIN seed...');

    // Load configuration
    const config = loadSuperAdminConfig();

    // Check if user exists
    const emailVO = Email.create(config.email);
    const existingUser = await userRepository.findByEmail(emailVO);

    if (existingUser) {
      // Check if user is already SUPER_ADMIN
      if (existingUser.systemRole.getValue() === 'super_admin') {
        logger.info(`✓ SUPER_ADMIN already exists: ${config.email}`);
        return;
      } else {
        logger.warn(`⚠️  User ${config.email} exists but is not SUPER_ADMIN (role: ${existingUser.systemRole.getValue()})`);
        logger.warn('   Manual intervention required. Please promote this user or use a different email.');
        return;
      }
    }

    // Create SUPER_ADMIN user
    logger.info(`Creating SUPER_ADMIN user: ${config.email}`);

    const userId = UserId.create(uuidGenerator.generate());
    const passwordHashVO = await hashingService.hash(config.password);

    // Create user with ACTIVE status and verified email (no verification needed for super admin)
    const now = new Date();
    const superAdmin = User.fromPersistence({
      id: userId,
      email: emailVO,
      passwordHash: passwordHashVO,
      firstName: config.firstName,
      lastName: config.lastName,
      status: UserStatus.ACTIVE,
      systemRole: SystemRole.create('super_admin'),
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      emailVerifiedAt: now, // Auto-verified
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lockoutCount: 0,
      lastFailedLoginAt: null,
    });

    // Save to database
    await userRepository.save(superAdmin);

    // Grant all permissions to SUPER_ADMIN
    const allPermissions = [
      'manage_users',
      'manage_organizations',
      'assign_members',
      'view_all_data',
    ];

    for (const permission of allPermissions) {
      const permissionVO = AdminPermission.create(permission);
      const grantId = uuidGenerator.generate();
      const permissionGrant = AdminPermissionGrant.create({
        id: grantId,
        adminUserId: userId.value, // Convert UserId to string
        permission: permissionVO,
        grantedBy: userId.value, // Convert UserId to string
      });
      await adminPermissionRepository.grant(permissionGrant);
    }

    logger.info(`✅ SUPER_ADMIN created successfully: ${config.email}`);
    logger.info('  System Role: super_admin');
    logger.info('  Status: ACTIVE');
    logger.info('  Email Verified: Yes');
    logger.info(`  Permissions: ${allPermissions.join(', ')}`);
  } catch (error) {
    logger.error('❌ Error seeding SUPER_ADMIN:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
