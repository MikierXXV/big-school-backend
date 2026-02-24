/**
 * ============================================
 * UNIT TEST: Membership Validators
 * ============================================
 *
 * Tests para validadores de requests de membresías.
 */

import { describe, it, expect } from 'vitest';
import {
  validateAssignMember,
  validateChangeRole,
} from '../../../../../src/interfaces/http/validators/membership.validators.js';

describe('Membership Validators', () => {
  const validRoles = ['org_admin', 'doctor', 'nurse', 'specialist', 'staff', 'guest'];

  describe('validateAssignMember()', () => {
    it('should pass validation with valid data', () => {
      const validData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        role: 'doctor',
      };

      const result = validateAssignMember(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when body is not an object', () => {
      const result = validateAssignMember(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('body');
    });

    it('should fail when userId is missing', () => {
      const result = validateAssignMember({ role: 'doctor' });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'userId')).toBe(true);
    });

    it('should fail when role is missing', () => {
      const result = validateAssignMember({ userId: '123' });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'role')).toBe(true);
    });

    it('should fail when userId is not a string', () => {
      const result = validateAssignMember({
        userId: 123,
        role: 'doctor',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'userId')).toBe(true);
    });

    it('should fail when userId is empty string', () => {
      const result = validateAssignMember({
        userId: '   ',
        role: 'doctor',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'userId')).toBe(true);
    });

    it('should fail when role is not a string', () => {
      const result = validateAssignMember({
        userId: '123',
        role: 123,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'role')).toBe(true);
    });

    it('should fail when role is invalid value', () => {
      const result = validateAssignMember({
        userId: '123',
        role: 'invalid_role',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'role')).toBe(true);
      expect(result.errors.find(e => e.field === 'role')?.message).toContain('must be one of');
    });

    validRoles.forEach(role => {
      it(`should pass validation with role "${role}"`, () => {
        const result = validateAssignMember({
          userId: '123',
          role,
        });

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateChangeRole()', () => {
    it('should pass validation with valid data', () => {
      const validData = {
        newRole: 'nurse',
      };

      const result = validateChangeRole(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when body is not an object', () => {
      const result = validateChangeRole('invalid');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('body');
    });

    it('should fail when newRole is missing', () => {
      const result = validateChangeRole({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('newRole');
    });

    it('should fail when newRole is not a string', () => {
      const result = validateChangeRole({ newRole: 123 });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'newRole')).toBe(true);
    });

    it('should fail when newRole is invalid value', () => {
      const result = validateChangeRole({ newRole: 'invalid_role' });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'newRole')).toBe(true);
      expect(result.errors.find(e => e.field === 'newRole')?.message).toContain('must be one of');
    });

    validRoles.forEach(role => {
      it(`should pass validation with newRole "${role}"`, () => {
        const result = validateChangeRole({ newRole: role });

        expect(result.isValid).toBe(true);
      });
    });
  });
});
