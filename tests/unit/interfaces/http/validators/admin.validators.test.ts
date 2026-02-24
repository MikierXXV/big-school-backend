/**
 * ============================================
 * UNIT TEST: Admin Validators
 * ============================================
 *
 * Tests para validadores de requests de administración.
 */

import { describe, it, expect } from 'vitest';
import {
  validatePromoteToAdmin,
  validateDemoteFromAdmin,
  validateGrantPermission,
  validateRevokePermission,
} from '../../../../../src/interfaces/http/validators/admin.validators.js';

describe('Admin Validators', () => {
  describe('validatePromoteToAdmin()', () => {
    it('should pass validation with valid data', () => {
      const validData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
      };

      const result = validatePromoteToAdmin(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when body is not an object', () => {
      const result = validatePromoteToAdmin(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('body');
    });

    it('should fail when userId is missing', () => {
      const result = validatePromoteToAdmin({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('userId');
      expect(result.errors[0]?.message).toContain('required');
    });

    it('should fail when userId is not a string', () => {
      const result = validatePromoteToAdmin({ userId: 123 });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('userId');
      expect(result.errors[0]?.message).toContain('string');
    });

    it('should fail when userId is empty string', () => {
      const result = validatePromoteToAdmin({ userId: '   ' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('userId');
      expect(result.errors[0]?.message).toContain('empty');
    });
  });

  describe('validateDemoteFromAdmin()', () => {
    it('should pass validation with valid data', () => {
      const validData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
      };

      const result = validateDemoteFromAdmin(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when userId is missing', () => {
      const result = validateDemoteFromAdmin({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('userId');
    });
  });

  describe('validateGrantPermission()', () => {
    const validPermissions = ['manage_users', 'manage_organizations', 'assign_members', 'view_all_data'];

    it('should pass validation with valid data', () => {
      const validData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        permissions: ['manage_users'],
      };

      const result = validateGrantPermission(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when body is not an object', () => {
      const result = validateGrantPermission('invalid');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('body');
    });

    it('should fail when userId is missing', () => {
      const result = validateGrantPermission({ permissions: ['manage_users'] });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'userId')).toBe(true);
    });

    it('should fail when permissions is missing', () => {
      const result = validateGrantPermission({ userId: '123' });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'permissions')).toBe(true);
    });

    it('should fail when userId is not a string', () => {
      const result = validateGrantPermission({
        userId: 123,
        permissions: ['manage_users'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'userId')).toBe(true);
    });

    it('should fail when userId is empty', () => {
      const result = validateGrantPermission({
        userId: '  ',
        permissions: ['manage_users'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'userId')).toBe(true);
    });

    it('should fail when permissions is not an array', () => {
      const result = validateGrantPermission({
        userId: '123',
        permissions: 'manage_users',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'permissions')).toBe(true);
    });

    it('should fail when permissions is empty array', () => {
      const result = validateGrantPermission({
        userId: '123',
        permissions: [],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'permissions')).toBe(true);
    });

    it('should fail when permissions contains invalid value', () => {
      const result = validateGrantPermission({
        userId: '123',
        permissions: ['invalid_permission'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'permissions')).toBe(true);
    });

    validPermissions.forEach(permission => {
      it(`should pass validation with permission "${permission}"`, () => {
        const result = validateGrantPermission({
          userId: '123',
          permissions: [permission],
        });

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateRevokePermission()', () => {
    it('should pass validation with valid data', () => {
      const validData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        permission: 'manage_users',
      };

      const result = validateRevokePermission(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when userId is missing', () => {
      const result = validateRevokePermission({ permission: 'manage_users' });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'userId')).toBe(true);
    });

    it('should fail when permission is invalid', () => {
      const result = validateRevokePermission({
        userId: '123',
        permission: 'invalid',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'permission')).toBe(true);
    });
  });
});
