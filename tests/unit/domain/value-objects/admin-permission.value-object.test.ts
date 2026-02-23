/**
 * ============================================
 * TEST: AdminPermission Value Object
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * TDD - Tests first, then implementation
 */

import { describe, it, expect } from 'vitest';
import { AdminPermission } from '../../../../src/domain/value-objects/admin-permission.value-object.js';
import { InvalidAdminPermissionError } from '../../../../src/domain/errors/authorization.errors.js';

describe('AdminPermission Value Object', () => {
  describe('create()', () => {
    it('should create AdminPermission with manage_users', () => {
      const permission = AdminPermission.create('manage_users');

      expect(permission).toBeInstanceOf(AdminPermission);
      expect(permission.getValue()).toBe('manage_users');
    });

    it('should create AdminPermission with manage_organizations', () => {
      const permission = AdminPermission.create('manage_organizations');

      expect(permission).toBeInstanceOf(AdminPermission);
      expect(permission.getValue()).toBe('manage_organizations');
    });

    it('should create AdminPermission with assign_members', () => {
      const permission = AdminPermission.create('assign_members');

      expect(permission).toBeInstanceOf(AdminPermission);
      expect(permission.getValue()).toBe('assign_members');
    });

    it('should create AdminPermission with view_all_data', () => {
      const permission = AdminPermission.create('view_all_data');

      expect(permission).toBeInstanceOf(AdminPermission);
      expect(permission.getValue()).toBe('view_all_data');
    });

    it('should throw InvalidAdminPermissionError for invalid permission', () => {
      expect(() => AdminPermission.create('invalid_permission' as any)).toThrow(
        InvalidAdminPermissionError
      );
    });

    it('should throw InvalidAdminPermissionError for empty string', () => {
      expect(() => AdminPermission.create('' as any)).toThrow(
        InvalidAdminPermissionError
      );
    });

    it('should throw InvalidAdminPermissionError for null', () => {
      expect(() => AdminPermission.create(null as any)).toThrow(
        InvalidAdminPermissionError
      );
    });

    it('should throw InvalidAdminPermissionError for undefined', () => {
      expect(() => AdminPermission.create(undefined as any)).toThrow(
        InvalidAdminPermissionError
      );
    });
  });

  describe('Factory methods', () => {
    it('should create MANAGE_USERS permission via static method', () => {
      const permission = AdminPermission.MANAGE_USERS();

      expect(permission.getValue()).toBe('manage_users');
    });

    it('should create MANAGE_ORGANIZATIONS permission via static method', () => {
      const permission = AdminPermission.MANAGE_ORGANIZATIONS();

      expect(permission.getValue()).toBe('manage_organizations');
    });

    it('should create ASSIGN_MEMBERS permission via static method', () => {
      const permission = AdminPermission.ASSIGN_MEMBERS();

      expect(permission.getValue()).toBe('assign_members');
    });

    it('should create VIEW_ALL_DATA permission via static method', () => {
      const permission = AdminPermission.VIEW_ALL_DATA();

      expect(permission.getValue()).toBe('view_all_data');
    });
  });

  describe('equals()', () => {
    it('should return true for same permissions', () => {
      const permission1 = AdminPermission.create('manage_users');
      const permission2 = AdminPermission.create('manage_users');

      expect(permission1.equals(permission2)).toBe(true);
    });

    it('should return false for different permissions', () => {
      const permission1 = AdminPermission.create('manage_users');
      const permission2 = AdminPermission.create('manage_organizations');

      expect(permission1.equals(permission2)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return string representation', () => {
      const permission = AdminPermission.create('assign_members');

      expect(permission.toString()).toBe('assign_members');
    });
  });

  describe('getValue()', () => {
    it('should return the internal value', () => {
      const permission = AdminPermission.create('view_all_data');

      expect(permission.getValue()).toBe('view_all_data');
    });
  });
});
