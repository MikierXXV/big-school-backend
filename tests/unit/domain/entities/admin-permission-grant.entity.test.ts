/**
 * ============================================
 * TEST: AdminPermissionGrant Entity
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * TDD - Tests first, then implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdminPermissionGrant } from '../../../../src/domain/entities/admin-permission-grant.entity.js';
import { AdminPermission } from '../../../../src/domain/value-objects/admin-permission.value-object.js';

describe('AdminPermissionGrant Entity', () => {
  const VALID_ID = '123e4567-e89b-12d3-a456-426614174000';
  const ADMIN_USER_ID = '987fcdeb-51a2-3bc4-d567-890123456789';
  const GRANTED_BY_ID = '111e2222-e33b-44d5-a666-777788889999';

  describe('create()', () => {
    it('should create AdminPermissionGrant with valid data', () => {
      const grant = AdminPermissionGrant.create({
        id: VALID_ID,
        adminUserId: ADMIN_USER_ID,
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: GRANTED_BY_ID,
      });

      expect(grant).toBeInstanceOf(AdminPermissionGrant);
      expect(grant.id).toBe(VALID_ID);
      expect(grant.adminUserId).toBe(ADMIN_USER_ID);
      expect(grant.permission.getValue()).toBe('manage_users');
      expect(grant.grantedBy).toBe(GRANTED_BY_ID);
    });

    it('should set grantedAt to current date', () => {
      const before = new Date();
      const grant = AdminPermissionGrant.create({
        id: VALID_ID,
        adminUserId: ADMIN_USER_ID,
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: GRANTED_BY_ID,
      });
      const after = new Date();

      expect(grant.grantedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(grant.grantedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw error when adminUserId is empty', () => {
      expect(() =>
        AdminPermissionGrant.create({
          id: VALID_ID,
          adminUserId: '',
          permission: AdminPermission.MANAGE_USERS(),
          grantedBy: GRANTED_BY_ID,
        })
      ).toThrow('adminUserId cannot be empty');
    });

    it('should throw error when grantedBy is empty', () => {
      expect(() =>
        AdminPermissionGrant.create({
          id: VALID_ID,
          adminUserId: ADMIN_USER_ID,
          permission: AdminPermission.MANAGE_USERS(),
          grantedBy: '',
        })
      ).toThrow('grantedBy cannot be empty');
    });

    it('should throw error when id is empty', () => {
      expect(() =>
        AdminPermissionGrant.create({
          id: '',
          adminUserId: ADMIN_USER_ID,
          permission: AdminPermission.MANAGE_USERS(),
          grantedBy: GRANTED_BY_ID,
        })
      ).toThrow('id cannot be empty');
    });
  });

  describe('Getters', () => {
    let grant: AdminPermissionGrant;

    beforeEach(() => {
      grant = AdminPermissionGrant.create({
        id: VALID_ID,
        adminUserId: ADMIN_USER_ID,
        permission: AdminPermission.MANAGE_ORGANIZATIONS(),
        grantedBy: GRANTED_BY_ID,
      });
    });

    it('should return id', () => {
      expect(grant.id).toBe(VALID_ID);
    });

    it('should return adminUserId', () => {
      expect(grant.adminUserId).toBe(ADMIN_USER_ID);
    });

    it('should return permission', () => {
      expect(grant.permission).toBeInstanceOf(AdminPermission);
      expect(grant.permission.getValue()).toBe('manage_organizations');
    });

    it('should return grantedBy', () => {
      expect(grant.grantedBy).toBe(GRANTED_BY_ID);
    });

    it('should return grantedAt', () => {
      expect(grant.grantedAt).toBeInstanceOf(Date);
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct AdminPermissionGrant from stored props', () => {
      const grantedAt = new Date('2024-01-01T00:00:00Z');

      const grant = AdminPermissionGrant.fromPersistence({
        id: VALID_ID,
        adminUserId: ADMIN_USER_ID,
        permission: AdminPermission.VIEW_ALL_DATA(),
        grantedBy: GRANTED_BY_ID,
        grantedAt,
      });

      expect(grant.id).toBe(VALID_ID);
      expect(grant.adminUserId).toBe(ADMIN_USER_ID);
      expect(grant.permission.getValue()).toBe('view_all_data');
      expect(grant.grantedBy).toBe(GRANTED_BY_ID);
      expect(grant.grantedAt.getTime()).toBe(grantedAt.getTime());
    });
  });

  describe('equals()', () => {
    it('should return true for grants with same id', () => {
      const grant1 = AdminPermissionGrant.create({
        id: VALID_ID,
        adminUserId: ADMIN_USER_ID,
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: GRANTED_BY_ID,
      });

      const grant2 = AdminPermissionGrant.create({
        id: VALID_ID,
        adminUserId: 'different-user',
        permission: AdminPermission.VIEW_ALL_DATA(),
        grantedBy: 'different-granter',
      });

      expect(grant1.equals(grant2)).toBe(true);
    });

    it('should return false for grants with different ids', () => {
      const grant1 = AdminPermissionGrant.create({
        id: VALID_ID,
        adminUserId: ADMIN_USER_ID,
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: GRANTED_BY_ID,
      });

      const grant2 = AdminPermissionGrant.create({
        id: '999e8888-e77b-66d5-a555-444433332222',
        adminUserId: ADMIN_USER_ID,
        permission: AdminPermission.MANAGE_USERS(),
        grantedBy: GRANTED_BY_ID,
      });

      expect(grant1.equals(grant2)).toBe(false);
    });
  });
});
