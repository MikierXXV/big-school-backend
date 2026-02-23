/**
 * ============================================
 * TEST: SystemRole Value Object
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * TDD - Tests first, then implementation
 */

import { describe, it, expect } from 'vitest';
import { SystemRole } from '../../../../src/domain/value-objects/system-role.value-object.js';
import { InvalidSystemRoleError } from '../../../../src/domain/errors/authorization.errors.js';

describe('SystemRole Value Object', () => {
  describe('create()', () => {
    it('should create SystemRole with super_admin', () => {
      const role = SystemRole.create('super_admin');

      expect(role).toBeInstanceOf(SystemRole);
      expect(role.getValue()).toBe('super_admin');
    });

    it('should create SystemRole with admin', () => {
      const role = SystemRole.create('admin');

      expect(role).toBeInstanceOf(SystemRole);
      expect(role.getValue()).toBe('admin');
    });

    it('should create SystemRole with user', () => {
      const role = SystemRole.create('user');

      expect(role).toBeInstanceOf(SystemRole);
      expect(role.getValue()).toBe('user');
    });

    it('should throw InvalidSystemRoleError for invalid role', () => {
      expect(() => SystemRole.create('invalid_role' as any)).toThrow(
        InvalidSystemRoleError
      );
    });

    it('should throw InvalidSystemRoleError for empty string', () => {
      expect(() => SystemRole.create('' as any)).toThrow(InvalidSystemRoleError);
    });

    it('should throw InvalidSystemRoleError for null', () => {
      expect(() => SystemRole.create(null as any)).toThrow(
        InvalidSystemRoleError
      );
    });

    it('should throw InvalidSystemRoleError for undefined', () => {
      expect(() => SystemRole.create(undefined as any)).toThrow(
        InvalidSystemRoleError
      );
    });
  });

  describe('Factory methods', () => {
    it('should create SUPER_ADMIN role via static method', () => {
      const role = SystemRole.SUPER_ADMIN();

      expect(role.getValue()).toBe('super_admin');
      expect(role.isSuperAdmin()).toBe(true);
    });

    it('should create ADMIN role via static method', () => {
      const role = SystemRole.ADMIN();

      expect(role.getValue()).toBe('admin');
      expect(role.isAdmin()).toBe(true);
    });

    it('should create USER role via static method', () => {
      const role = SystemRole.USER();

      expect(role.getValue()).toBe('user');
      expect(role.isUser()).toBe(true);
    });
  });

  describe('Type checking methods', () => {
    it('isSuperAdmin() should return true for super_admin', () => {
      const role = SystemRole.create('super_admin');

      expect(role.isSuperAdmin()).toBe(true);
      expect(role.isAdmin()).toBe(false);
      expect(role.isUser()).toBe(false);
    });

    it('isAdmin() should return true for admin', () => {
      const role = SystemRole.create('admin');

      expect(role.isSuperAdmin()).toBe(false);
      expect(role.isAdmin()).toBe(true);
      expect(role.isUser()).toBe(false);
    });

    it('isUser() should return true for user', () => {
      const role = SystemRole.create('user');

      expect(role.isSuperAdmin()).toBe(false);
      expect(role.isAdmin()).toBe(false);
      expect(role.isUser()).toBe(true);
    });
  });

  describe('equals()', () => {
    it('should return true for two SUPER_ADMIN roles', () => {
      const role1 = SystemRole.create('super_admin');
      const role2 = SystemRole.create('super_admin');

      expect(role1.equals(role2)).toBe(true);
    });

    it('should return true for two ADMIN roles', () => {
      const role1 = SystemRole.create('admin');
      const role2 = SystemRole.create('admin');

      expect(role1.equals(role2)).toBe(true);
    });

    it('should return true for two USER roles', () => {
      const role1 = SystemRole.create('user');
      const role2 = SystemRole.create('user');

      expect(role1.equals(role2)).toBe(true);
    });

    it('should return false for different roles', () => {
      const superAdmin = SystemRole.create('super_admin');
      const admin = SystemRole.create('admin');
      const user = SystemRole.create('user');

      expect(superAdmin.equals(admin)).toBe(false);
      expect(admin.equals(user)).toBe(false);
      expect(superAdmin.equals(user)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return string representation', () => {
      const superAdmin = SystemRole.create('super_admin');
      const admin = SystemRole.create('admin');
      const user = SystemRole.create('user');

      expect(superAdmin.toString()).toBe('super_admin');
      expect(admin.toString()).toBe('admin');
      expect(user.toString()).toBe('user');
    });
  });

  describe('getValue()', () => {
    it('should return the internal value', () => {
      const role = SystemRole.create('admin');

      expect(role.getValue()).toBe('admin');
    });
  });
});
