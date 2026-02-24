/**
 * ============================================
 * UNIT TEST: Organization Validators
 * ============================================
 *
 * Tests para validadores de requests de organizaciones.
 */

import { describe, it, expect } from 'vitest';
import {
  validateCreateOrganization,
  validateUpdateOrganization,
} from '../../../../../src/interfaces/http/validators/organization.validators.js';

describe('Organization Validators', () => {
  const validTypes = ['hospital', 'clinic', 'health_center', 'laboratory', 'pharmacy', 'other'];

  describe('validateCreateOrganization()', () => {
    it('should pass validation with required fields only', () => {
      const validData = {
        name: 'Hospital Central',
        type: 'hospital',
      };

      const result = validateCreateOrganization(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation with all fields', () => {
      const validData = {
        name: 'Hospital Central',
        type: 'hospital',
        description: 'Main hospital',
        address: '123 Main St',
        contactEmail: 'contact@hospital.com',
        contactPhone: '+1234567890',
      };

      const result = validateCreateOrganization(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when body is not an object', () => {
      const result = validateCreateOrganization(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('body');
    });

    it('should fail when name is missing', () => {
      const result = validateCreateOrganization({ type: 'hospital' });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should fail when type is missing', () => {
      const result = validateCreateOrganization({ name: 'Hospital' });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should fail when name is not a string', () => {
      const result = validateCreateOrganization({
        name: 123,
        type: 'hospital',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should fail when name is empty string', () => {
      const result = validateCreateOrganization({
        name: '   ',
        type: 'hospital',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should fail when type is not a string', () => {
      const result = validateCreateOrganization({
        name: 'Hospital',
        type: 123,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should fail when type is invalid value', () => {
      const result = validateCreateOrganization({
        name: 'Hospital',
        type: 'invalid_type',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
      expect(result.errors.find(e => e.field === 'type')?.message).toContain('must be one of');
    });

    validTypes.forEach(type => {
      it(`should pass validation with type "${type}"`, () => {
        const result = validateCreateOrganization({
          name: 'Test Org',
          type,
        });

        expect(result.isValid).toBe(true);
      });
    });

    it('should fail when description is not a string', () => {
      const result = validateCreateOrganization({
        name: 'Hospital',
        type: 'hospital',
        description: 123,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'description')).toBe(true);
    });

    it('should fail when address is not a string', () => {
      const result = validateCreateOrganization({
        name: 'Hospital',
        type: 'hospital',
        address: 123,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'address')).toBe(true);
    });

    it('should fail when contactEmail is not a string', () => {
      const result = validateCreateOrganization({
        name: 'Hospital',
        type: 'hospital',
        contactEmail: 123,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'contactEmail')).toBe(true);
    });

    it('should fail when contactPhone is not a string', () => {
      const result = validateCreateOrganization({
        name: 'Hospital',
        type: 'hospital',
        contactPhone: 123,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'contactPhone')).toBe(true);
    });
  });

  describe('validateUpdateOrganization()', () => {
    it('should pass validation with empty body (no updates)', () => {
      const result = validateUpdateOrganization({});

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation with partial updates', () => {
      const validData = {
        name: 'Updated Hospital',
      };

      const result = validateUpdateOrganization(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation with all fields', () => {
      const validData = {
        name: 'Updated Hospital',
        type: 'clinic',
        description: 'Updated description',
        address: 'New address',
        contactEmail: 'new@example.com',
        contactPhone: '+9876543210',
      };

      const result = validateUpdateOrganization(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when body is not an object', () => {
      const result = validateUpdateOrganization('invalid');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('body');
    });

    it('should fail when name is not a string', () => {
      const result = validateUpdateOrganization({ name: 123 });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should fail when name is empty string', () => {
      const result = validateUpdateOrganization({ name: '   ' });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    // Note: type field is not validated in updates because it cannot be changed after creation

    it('should fail when description is not a string', () => {
      const result = validateUpdateOrganization({ description: 123 });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'description')).toBe(true);
    });

    it('should fail when address is not a string', () => {
      const result = validateUpdateOrganization({ address: 123 });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'address')).toBe(true);
    });

    it('should fail when contactEmail is not a string', () => {
      const result = validateUpdateOrganization({ contactEmail: 123 });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'contactEmail')).toBe(true);
    });

    it('should fail when contactPhone is not a string', () => {
      const result = validateUpdateOrganization({ contactPhone: 123 });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'contactPhone')).toBe(true);
    });
  });
});
