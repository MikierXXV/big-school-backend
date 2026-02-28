/**
 * ============================================
 * TEST: RBACAuthorizationService
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Tests for RBAC authorization service implementing three-tier authorization model:
 * 1. SUPER_ADMIN: always has ALL permissions
 * 2. ADMIN: has only explicitly granted permissions
 * 3. USER: has permissions only via organization membership
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RBACAuthorizationService } from '../../../../src/infrastructure/services/rbac-authorization.service.js';
import { InMemoryUserRepository } from '../../../../src/infrastructure/persistence/in-memory/in-memory-user.repository.js';
import { InMemoryAdminPermissionRepository } from '../../../../src/infrastructure/persistence/in-memory/in-memory-admin-permission.repository.js';
import { InMemoryOrganizationMembershipRepository } from '../../../../src/infrastructure/persistence/in-memory/in-memory-organization-membership.repository.js';
import { User } from '../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';
import { SystemRole } from '../../../../src/domain/value-objects/system-role.value-object.js';
import { AdminPermissionGrant } from '../../../../src/domain/entities/admin-permission-grant.entity.js';
import { AdminPermission } from '../../../../src/domain/value-objects/admin-permission.value-object.js';
import { OrganizationMembership } from '../../../../src/domain/entities/organization-membership.entity.js';
import { OrganizationRole } from '../../../../src/domain/value-objects/organization-role.value-object.js';

describe('RBACAuthorizationService', () => {
  let service: RBACAuthorizationService;
  let userRepo: InMemoryUserRepository;
  let adminPermRepo: InMemoryAdminPermissionRepository;
  let membershipRepo: InMemoryOrganizationMembershipRepository;

  // Test users
  let superAdminUser: User;
  let adminUser: User;
  let regularUser: User;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    adminPermRepo = new InMemoryAdminPermissionRepository();
    membershipRepo = new InMemoryOrganizationMembershipRepository();
    service = new RBACAuthorizationService(
      userRepo,
      adminPermRepo,
      membershipRepo
    );

    // Create test users with valid UUIDs
    superAdminUser = User.create({
      id: UserId.create('550e8400-e29b-41d4-a716-446655440001'),
      email: Email.create('super@test.com'),
      passwordHash: PasswordHash.fromHash('$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST'),
      firstName: 'Super',
      lastName: 'Admin',
      systemRole: SystemRole.SUPER_ADMIN(),
    });

    adminUser = User.create({
      id: UserId.create('550e8400-e29b-41d4-a716-446655440002'),
      email: Email.create('admin@test.com'),
      passwordHash: PasswordHash.fromHash('$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST'),
      firstName: 'Admin',
      lastName: 'User',
      systemRole: SystemRole.ADMIN(),
    });

    regularUser = User.create({
      id: UserId.create('550e8400-e29b-41d4-a716-446655440003'),
      email: Email.create('user@test.com'),
      passwordHash: PasswordHash.fromHash('$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST'),
      firstName: 'Regular',
      lastName: 'User',
      systemRole: SystemRole.USER(),
    });

    await userRepo.save(superAdminUser);
    await userRepo.save(adminUser);
    await userRepo.save(regularUser);
  });

  describe('isSuperAdmin()', () => {
    it('should return true for SUPER_ADMIN user', async () => {
      // Act
      const result = await service.isSuperAdmin('550e8400-e29b-41d4-a716-446655440001');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for ADMIN user', async () => {
      // Act
      const result = await service.isSuperAdmin('550e8400-e29b-41d4-a716-446655440002');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for regular USER', async () => {
      // Act
      const result = await service.isSuperAdmin('550e8400-e29b-41d4-a716-446655440003');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      // Act
      const result = await service.isSuperAdmin('550e8400-e29b-41d4-a716-446655440999');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isAdmin()', () => {
    it('should return true for ADMIN user', async () => {
      // Act
      const result = await service.isAdmin('550e8400-e29b-41d4-a716-446655440002');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for SUPER_ADMIN user', async () => {
      // Act
      const result = await service.isAdmin('550e8400-e29b-41d4-a716-446655440001');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for regular USER', async () => {
      // Act
      const result = await service.isAdmin('550e8400-e29b-41d4-a716-446655440003');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      // Act
      const result = await service.isAdmin('550e8400-e29b-41d4-a716-446655440999');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasAdminPermission()', () => {
    beforeEach(async () => {
      // Grant MANAGE_USERS permission to admin
      const grant = AdminPermissionGrant.create({
        id: 'grant-1',
        adminUserId: '550e8400-e29b-41d4-a716-446655440002',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await adminPermRepo.grant(grant);
    });

    it('should return true when admin has the permission', async () => {
      // Act
      const result = await service.hasAdminPermission(
        '550e8400-e29b-41d4-a716-446655440002',
        'manage_users'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when admin does not have the permission', async () => {
      // Act
      const result = await service.hasAdminPermission(
        '550e8400-e29b-41d4-a716-446655440002',
        'manage_organizations'
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasPermission() - SUPER_ADMIN', () => {
    it('should return true for any permission', async () => {
      // Act & Assert
      expect(await service.hasPermission('550e8400-e29b-41d4-a716-446655440001', 'manage_users')).toBe(true);
      expect(await service.hasPermission('550e8400-e29b-41d4-a716-446655440001', 'manage_organizations')).toBe(true);
      expect(await service.hasPermission('550e8400-e29b-41d4-a716-446655440001', 'view_all_data')).toBe(true);
      expect(await service.hasPermission('550e8400-e29b-41d4-a716-446655440001', 'any_permission')).toBe(true);
    });

    it('should return true for any permission with organization context', async () => {
      // Act & Assert
      expect(
        await service.hasPermission('550e8400-e29b-41d4-a716-446655440001', 'manage_members', 'org-1')
      ).toBe(true);
    });
  });

  describe('hasPermission() - ADMIN', () => {
    beforeEach(async () => {
      // Grant specific permissions
      const grant1 = AdminPermissionGrant.create({
        id: 'grant-1',
        adminUserId: '550e8400-e29b-41d4-a716-446655440002',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await adminPermRepo.grant(grant1);
    });

    it('should return true when admin has granted permission', async () => {
      // Act
      const result = await service.hasPermission('550e8400-e29b-41d4-a716-446655440002', 'manage_users');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when admin does not have permission', async () => {
      // Act
      const result = await service.hasPermission(
        '550e8400-e29b-41d4-a716-446655440002',
        'manage_organizations'
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasPermission() - USER with organization membership', () => {
    beforeEach(async () => {
      // Create membership with ORG_ADMIN role
      const membership = OrganizationMembership.create({
        id: 'mem-1',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        organizationId: 'org-1',
        role: OrganizationRole.ORG_ADMIN(),
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await membershipRepo.save(membership);
    });

    it('should return true when user has permission via organization role', async () => {
      // Act - ORG_ADMIN should be able to manage members
      const result = await service.hasPermission(
        '550e8400-e29b-41d4-a716-446655440003',
        'assign_members',
        'org-1'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have permission for that organization', async () => {
      // Act
      const result = await service.hasPermission(
        '550e8400-e29b-41d4-a716-446655440003',
        'assign_members',
        'org-2'
      );

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for platform permissions', async () => {
      // Act - Regular users cannot have platform permissions
      const result = await service.hasPermission('550e8400-e29b-41d4-a716-446655440003', 'manage_users');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasPermission() - USER with DOCTOR role', () => {
    beforeEach(async () => {
      const membership = OrganizationMembership.create({
        id: 'mem-1',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await membershipRepo.save(membership);
    });

    it('should return true for permissions granted to DOCTOR role', async () => {
      // Act
      const result = await service.hasPermission(
        '550e8400-e29b-41d4-a716-446655440003',
        'view_patients',
        'org-1'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for admin-only permissions', async () => {
      // Act
      const result = await service.hasPermission(
        '550e8400-e29b-41d4-a716-446655440003',
        'assign_members',
        'org-1'
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('canAccessOrganization()', () => {
    it('should return true for SUPER_ADMIN regardless of membership', async () => {
      // Act
      const result = await service.canAccessOrganization(
        '550e8400-e29b-41d4-a716-446655440001',
        'org-1'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for ADMIN with VIEW_ALL_DATA permission', async () => {
      // Arrange - Grant VIEW_ALL_DATA to admin
      const grant = AdminPermissionGrant.create({
        id: 'grant-1',
        adminUserId: '550e8400-e29b-41d4-a716-446655440002',
        permission: AdminPermission.VIEW_ALL_DATA(),
        grantedBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await adminPermRepo.grant(grant);

      // Act
      const result = await service.canAccessOrganization('550e8400-e29b-41d4-a716-446655440002', 'org-1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for ADMIN without VIEW_ALL_DATA and not a member', async () => {
      // Act
      const result = await service.canAccessOrganization('550e8400-e29b-41d4-a716-446655440002', 'org-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for USER who is an active member', async () => {
      // Arrange - Create membership
      const membership = OrganizationMembership.create({
        id: 'mem-1',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await membershipRepo.save(membership);

      // Act
      const result = await service.canAccessOrganization('550e8400-e29b-41d4-a716-446655440003', 'org-1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for USER who is not a member', async () => {
      // Act
      const result = await service.canAccessOrganization('550e8400-e29b-41d4-a716-446655440003', 'org-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for USER whose membership has ended', async () => {
      // Arrange - Create and end membership
      const membership = OrganizationMembership.create({
        id: 'mem-1',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await membershipRepo.save(membership);

      const leftMembership = membership.leave(new Date());
      await membershipRepo.update(leftMembership);

      // Act
      const result = await service.canAccessOrganization('550e8400-e29b-41d4-a716-446655440003', 'org-1');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUserOrganizationRole()', () => {
    beforeEach(async () => {
      const membership = OrganizationMembership.create({
        id: 'mem-1',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await membershipRepo.save(membership);
    });

    it('should return role for active member', async () => {
      // Act
      const role = await service.getUserOrganizationRole('550e8400-e29b-41d4-a716-446655440003', 'org-1');

      // Assert
      expect(role).toBe('doctor');
    });

    it('should return null for non-member', async () => {
      // Act
      const role = await service.getUserOrganizationRole('550e8400-e29b-41d4-a716-446655440003', 'org-2');

      // Assert
      expect(role).toBeNull();
    });

    it('should return null after membership ends', async () => {
      // Arrange - End membership
      const membership = await membershipRepo.findActiveMembership(
        '550e8400-e29b-41d4-a716-446655440003',
        'org-1'
      );
      const leftMembership = membership!.leave(new Date());
      await membershipRepo.update(leftMembership);

      // Act
      const role = await service.getUserOrganizationRole('550e8400-e29b-41d4-a716-446655440003', 'org-1');

      // Assert
      expect(role).toBeNull();
    });
  });

  describe('Role-specific permission tests', () => {
    it('should grant ORG_ADMIN full org permissions', async () => {
      // Arrange
      const membership = OrganizationMembership.create({
        id: 'mem-1',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        organizationId: 'org-1',
        role: OrganizationRole.ORG_ADMIN(),
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await membershipRepo.save(membership);

      // Act & Assert
      expect(
        await service.hasPermission('550e8400-e29b-41d4-a716-446655440003', 'assign_members', 'org-1')
      ).toBe(true);
      expect(
        await service.hasPermission('550e8400-e29b-41d4-a716-446655440003', 'remove_members', 'org-1')
      ).toBe(true);
      expect(
        await service.hasPermission('550e8400-e29b-41d4-a716-446655440003', 'change_member_role', 'org-1')
      ).toBe(true);
    });

    it('should grant NURSE appropriate permissions', async () => {
      // Arrange
      const membership = OrganizationMembership.create({
        id: 'mem-1',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        organizationId: 'org-1',
        role: OrganizationRole.NURSE(),
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await membershipRepo.save(membership);

      // Act & Assert
      expect(
        await service.hasPermission('550e8400-e29b-41d4-a716-446655440003', 'view_patients', 'org-1')
      ).toBe(true);
      expect(
        await service.hasPermission('550e8400-e29b-41d4-a716-446655440003', 'edit_patients', 'org-1')
      ).toBe(true);
      expect(
        await service.hasPermission('550e8400-e29b-41d4-a716-446655440003', 'assign_members', 'org-1')
      ).toBe(false);
    });

    it('should grant GUEST only read permissions', async () => {
      // Arrange
      const membership = OrganizationMembership.create({
        id: 'mem-1',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        organizationId: 'org-1',
        role: OrganizationRole.GUEST(),
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
      });
      await membershipRepo.save(membership);

      // Act & Assert
      expect(
        await service.hasPermission('550e8400-e29b-41d4-a716-446655440003', 'view_patients', 'org-1')
      ).toBe(true);
      expect(
        await service.hasPermission('550e8400-e29b-41d4-a716-446655440003', 'edit_patients', 'org-1')
      ).toBe(false);
    });
  });
});
