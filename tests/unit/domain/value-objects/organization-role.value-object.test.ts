/**
 * ============================================
 * TEST: OrganizationRole Value Object
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * TDD - Tests first, then implementation
 */

import { describe, it, expect } from 'vitest';
import { OrganizationRole } from '../../../../src/domain/value-objects/organization-role.value-object.js';
import { InvalidOrganizationRoleError } from '../../../../src/domain/errors/authorization.errors.js';

describe('OrganizationRole Value Object', () => {
  describe('create()', () => {
    it('should create OrganizationRole with org_admin', () => {
      const role = OrganizationRole.create('org_admin');

      expect(role).toBeInstanceOf(OrganizationRole);
      expect(role.getValue()).toBe('org_admin');
    });

    it('should create OrganizationRole with doctor', () => {
      const role = OrganizationRole.create('doctor');

      expect(role).toBeInstanceOf(OrganizationRole);
      expect(role.getValue()).toBe('doctor');
    });

    it('should create OrganizationRole with nurse', () => {
      const role = OrganizationRole.create('nurse');

      expect(role).toBeInstanceOf(OrganizationRole);
      expect(role.getValue()).toBe('nurse');
    });

    it('should create OrganizationRole with specialist', () => {
      const role = OrganizationRole.create('specialist');

      expect(role).toBeInstanceOf(OrganizationRole);
      expect(role.getValue()).toBe('specialist');
    });

    it('should create OrganizationRole with staff', () => {
      const role = OrganizationRole.create('staff');

      expect(role).toBeInstanceOf(OrganizationRole);
      expect(role.getValue()).toBe('staff');
    });

    it('should create OrganizationRole with guest', () => {
      const role = OrganizationRole.create('guest');

      expect(role).toBeInstanceOf(OrganizationRole);
      expect(role.getValue()).toBe('guest');
    });

    it('should throw InvalidOrganizationRoleError for invalid role', () => {
      expect(() => OrganizationRole.create('invalid_role')).toThrow(
        InvalidOrganizationRoleError
      );
    });

    it('should throw InvalidOrganizationRoleError for empty string', () => {
      expect(() => OrganizationRole.create('')).toThrow(
        InvalidOrganizationRoleError
      );
    });

    it('should throw InvalidOrganizationRoleError for null', () => {
      expect(() => OrganizationRole.create(null as any)).toThrow(
        InvalidOrganizationRoleError
      );
    });

    it('should throw InvalidOrganizationRoleError for undefined', () => {
      expect(() => OrganizationRole.create(undefined as any)).toThrow(
        InvalidOrganizationRoleError
      );
    });
  });

  describe('Factory methods', () => {
    it('should create ORG_ADMIN role via static method', () => {
      const role = OrganizationRole.ORG_ADMIN();

      expect(role.getValue()).toBe('org_admin');
    });

    it('should create DOCTOR role via static method', () => {
      const role = OrganizationRole.DOCTOR();

      expect(role.getValue()).toBe('doctor');
    });

    it('should create NURSE role via static method', () => {
      const role = OrganizationRole.NURSE();

      expect(role.getValue()).toBe('nurse');
    });

    it('should create SPECIALIST role via static method', () => {
      const role = OrganizationRole.SPECIALIST();

      expect(role.getValue()).toBe('specialist');
    });

    it('should create STAFF role via static method', () => {
      const role = OrganizationRole.STAFF();

      expect(role.getValue()).toBe('staff');
    });

    it('should create GUEST role via static method', () => {
      const role = OrganizationRole.GUEST();

      expect(role.getValue()).toBe('guest');
    });
  });

  describe('equals()', () => {
    it('should return true for two identical roles', () => {
      const role1 = OrganizationRole.create('doctor');
      const role2 = OrganizationRole.create('doctor');

      expect(role1.equals(role2)).toBe(true);
    });

    it('should return false for different roles', () => {
      const doctor = OrganizationRole.create('doctor');
      const nurse = OrganizationRole.create('nurse');

      expect(doctor.equals(nurse)).toBe(false);
    });

    it('should return false when comparing with non-OrganizationRole', () => {
      const role = OrganizationRole.create('doctor');

      expect(role.equals({} as any)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return string representation', () => {
      const doctor = OrganizationRole.create('doctor');
      const nurse = OrganizationRole.create('nurse');

      expect(doctor.toString()).toBe('doctor');
      expect(nurse.toString()).toBe('nurse');
    });
  });

  describe('getValue()', () => {
    it('should return the internal value', () => {
      const role = OrganizationRole.create('specialist');

      expect(role.getValue()).toBe('specialist');
    });
  });
});
