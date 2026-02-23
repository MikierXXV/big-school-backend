/**
 * ============================================
 * TEST: OrganizationType Value Object
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * TDD - Tests first, then implementation
 */

import { describe, it, expect } from 'vitest';
import { OrganizationType } from '../../../../src/domain/value-objects/organization-type.value-object.js';
import { InvalidOrganizationTypeError } from '../../../../src/domain/errors/organization.errors.js';

describe('OrganizationType Value Object', () => {
  describe('create()', () => {
    it('should create OrganizationType with hospital', () => {
      const type = OrganizationType.create('hospital');

      expect(type).toBeInstanceOf(OrganizationType);
      expect(type.getValue()).toBe('hospital');
    });

    it('should create OrganizationType with clinic', () => {
      const type = OrganizationType.create('clinic');

      expect(type).toBeInstanceOf(OrganizationType);
      expect(type.getValue()).toBe('clinic');
    });

    it('should create OrganizationType with health_center', () => {
      const type = OrganizationType.create('health_center');

      expect(type).toBeInstanceOf(OrganizationType);
      expect(type.getValue()).toBe('health_center');
    });

    it('should create OrganizationType with laboratory', () => {
      const type = OrganizationType.create('laboratory');

      expect(type).toBeInstanceOf(OrganizationType);
      expect(type.getValue()).toBe('laboratory');
    });

    it('should create OrganizationType with pharmacy', () => {
      const type = OrganizationType.create('pharmacy');

      expect(type).toBeInstanceOf(OrganizationType);
      expect(type.getValue()).toBe('pharmacy');
    });

    it('should create OrganizationType with other', () => {
      const type = OrganizationType.create('other');

      expect(type).toBeInstanceOf(OrganizationType);
      expect(type.getValue()).toBe('other');
    });

    it('should throw InvalidOrganizationTypeError for invalid type', () => {
      expect(() => OrganizationType.create('invalid_type')).toThrow(
        InvalidOrganizationTypeError
      );
    });

    it('should throw InvalidOrganizationTypeError for empty string', () => {
      expect(() => OrganizationType.create('')).toThrow(
        InvalidOrganizationTypeError
      );
    });

    it('should throw InvalidOrganizationTypeError for null', () => {
      expect(() => OrganizationType.create(null as any)).toThrow(
        InvalidOrganizationTypeError
      );
    });

    it('should throw InvalidOrganizationTypeError for undefined', () => {
      expect(() => OrganizationType.create(undefined as any)).toThrow(
        InvalidOrganizationTypeError
      );
    });
  });

  describe('Factory methods', () => {
    it('should create HOSPITAL type via static method', () => {
      const type = OrganizationType.HOSPITAL();

      expect(type.getValue()).toBe('hospital');
    });

    it('should create CLINIC type via static method', () => {
      const type = OrganizationType.CLINIC();

      expect(type.getValue()).toBe('clinic');
    });

    it('should create HEALTH_CENTER type via static method', () => {
      const type = OrganizationType.HEALTH_CENTER();

      expect(type.getValue()).toBe('health_center');
    });

    it('should create LABORATORY type via static method', () => {
      const type = OrganizationType.LABORATORY();

      expect(type.getValue()).toBe('laboratory');
    });

    it('should create PHARMACY type via static method', () => {
      const type = OrganizationType.PHARMACY();

      expect(type.getValue()).toBe('pharmacy');
    });

    it('should create OTHER type via static method', () => {
      const type = OrganizationType.OTHER();

      expect(type.getValue()).toBe('other');
    });
  });

  describe('equals()', () => {
    it('should return true for two identical types', () => {
      const type1 = OrganizationType.create('hospital');
      const type2 = OrganizationType.create('hospital');

      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different types', () => {
      const hospital = OrganizationType.create('hospital');
      const clinic = OrganizationType.create('clinic');

      expect(hospital.equals(clinic)).toBe(false);
    });

    it('should return false when comparing with non-OrganizationType', () => {
      const type = OrganizationType.create('hospital');

      expect(type.equals({} as any)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return string representation', () => {
      const hospital = OrganizationType.create('hospital');
      const clinic = OrganizationType.create('clinic');

      expect(hospital.toString()).toBe('hospital');
      expect(clinic.toString()).toBe('clinic');
    });
  });

  describe('getValue()', () => {
    it('should return the internal value', () => {
      const type = OrganizationType.create('laboratory');

      expect(type.getValue()).toBe('laboratory');
    });
  });
});
