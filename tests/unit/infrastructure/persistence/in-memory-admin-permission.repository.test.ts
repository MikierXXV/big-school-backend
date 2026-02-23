/**
 * ============================================
 * TEST: InMemoryAdminPermissionRepository
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Tests for in-memory implementation of IAdminPermissionRepository
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAdminPermissionRepository } from '../../../../src/infrastructure/persistence/in-memory/in-memory-admin-permission.repository.js';
import { AdminPermissionGrant } from '../../../../src/domain/entities/admin-permission-grant.entity.js';
import { AdminPermission } from '../../../../src/domain/value-objects/admin-permission.value-object.js';

describe('InMemoryAdminPermissionRepository', () => {
  let repository: InMemoryAdminPermissionRepository;

  beforeEach(() => {
    repository = new InMemoryAdminPermissionRepository();
  });

  describe('grant()', () => {
    it('should grant a new permission', async () => {
      // Arrange
      const grant = AdminPermissionGrant.create({
        id: 'grant-123',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: 'super-admin-1',
      });

      // Act
      await repository.grant(grant);

      // Assert
      const hasPermission = await repository.hasPermission(
        'admin-1',
        AdminPermission.MANAGE_USERS()
      );
      expect(hasPermission).toBe(true);
    });

    it('should be idempotent when granting same permission twice', async () => {
      // Arrange
      const grant1 = AdminPermissionGrant.create({
        id: 'grant-123',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: 'super-admin-1',
      });
      await repository.grant(grant1);

      const grant2 = AdminPermissionGrant.create({
        id: 'grant-456',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: 'super-admin-1',
      });

      // Act & Assert - should not throw
      await expect(repository.grant(grant2)).resolves.not.toThrow();

      // Should still have the permission
      const hasPermission = await repository.hasPermission(
        'admin-1',
        AdminPermission.MANAGE_USERS()
      );
      expect(hasPermission).toBe(true);
    });

    it('should allow granting different permissions to same user', async () => {
      // Arrange
      const grant1 = AdminPermissionGrant.create({
        id: 'grant-1',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: 'super-admin-1',
      });
      const grant2 = AdminPermissionGrant.create({
        id: 'grant-2',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_ORGANIZATIONS(),
        grantedBy: 'super-admin-1',
      });

      // Act
      await repository.grant(grant1);
      await repository.grant(grant2);

      // Assert
      const grants = await repository.findByUserId('admin-1');
      expect(grants).toHaveLength(2);
    });
  });

  describe('revoke()', () => {
    it('should revoke an existing permission grant', async () => {
      // Arrange
      const grant = AdminPermissionGrant.create({
        id: 'grant-123',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: 'super-admin-1',
      });
      await repository.grant(grant);

      // Act
      await repository.revoke('grant-123');

      // Assert
      const hasPermission = await repository.hasPermission(
        'admin-1',
        AdminPermission.MANAGE_USERS()
      );
      expect(hasPermission).toBe(false);
    });

    it('should be idempotent when revoking non-existent grant', async () => {
      // Act & Assert - should not throw
      await expect(repository.revoke('non-existent')).resolves.not.toThrow();
    });
  });

  describe('findByUserId()', () => {
    beforeEach(async () => {
      // Seed with test data
      const grant1 = AdminPermissionGrant.create({
        id: 'grant-1',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: 'super-admin-1',
      });
      const grant2 = AdminPermissionGrant.create({
        id: 'grant-2',
        adminUserId: 'admin-1',
        permission: AdminPermission.VIEW_ALL_DATA(),
        grantedBy: 'super-admin-1',
      });
      const grant3 = AdminPermissionGrant.create({
        id: 'grant-3',
        adminUserId: 'admin-2',
        permission: AdminPermission.MANAGE_ORGANIZATIONS(),
        grantedBy: 'super-admin-1',
      });

      await repository.grant(grant1);
      await repository.grant(grant2);
      await repository.grant(grant3);
    });

    it('should return all grants for a user', async () => {
      // Act
      const grants = await repository.findByUserId('admin-1');

      // Assert
      expect(grants).toHaveLength(2);
      expect(grants.every((g) => g.adminUserId === 'admin-1')).toBe(true);
    });

    it('should return empty array when user has no grants', async () => {
      // Act
      const grants = await repository.findByUserId('admin-no-permissions');

      // Assert
      expect(grants).toHaveLength(0);
    });
  });

  describe('hasPermission()', () => {
    beforeEach(async () => {
      const grant = AdminPermissionGrant.create({
        id: 'grant-1',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: 'super-admin-1',
      });
      await repository.grant(grant);
    });

    it('should return true when user has the permission', async () => {
      // Act
      const hasPermission = await repository.hasPermission(
        'admin-1',
        AdminPermission.MANAGE_USERS()
      );

      // Assert
      expect(hasPermission).toBe(true);
    });

    it('should return false when user does not have the permission', async () => {
      // Act
      const hasPermission = await repository.hasPermission(
        'admin-1',
        AdminPermission.MANAGE_ORGANIZATIONS()
      );

      // Assert
      expect(hasPermission).toBe(false);
    });

    it('should return false when user has no grants', async () => {
      // Act
      const hasPermission = await repository.hasPermission(
        'admin-no-permissions',
        AdminPermission.MANAGE_USERS()
      );

      // Assert
      expect(hasPermission).toBe(false);
    });
  });

  describe('Test Helpers', () => {
    it('should reset the repository', async () => {
      // Arrange
      const grant = AdminPermissionGrant.create({
        id: 'grant-123',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: 'super-admin-1',
      });
      await repository.grant(grant);

      // Act
      repository.reset();

      // Assert
      const hasPermission = await repository.hasPermission(
        'admin-1',
        AdminPermission.MANAGE_USERS()
      );
      expect(hasPermission).toBe(false);
      expect(repository.count()).toBe(0);
    });

    it('should count grants', async () => {
      // Arrange
      const grant1 = AdminPermissionGrant.create({
        id: 'grant-1',
        adminUserId: 'admin-1',
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: 'super-admin-1',
      });
      const grant2 = AdminPermissionGrant.create({
        id: 'grant-2',
        adminUserId: 'admin-2',
        permission: AdminPermission.MANAGE_ORGANIZATIONS(),
        grantedBy: 'super-admin-1',
      });
      await repository.grant(grant1);
      await repository.grant(grant2);

      // Act
      const count = repository.count();

      // Assert
      expect(count).toBe(2);
    });
  });
});
