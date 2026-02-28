/**
 * ============================================
 * TEST: Organization Entity
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * TDD - Tests first, then implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Organization } from '../../../../src/domain/entities/organization.entity.js';
import { OrganizationType } from '../../../../src/domain/value-objects/organization-type.value-object.js';

describe('Organization Entity', () => {
  const VALID_ID = '123e4567-e89b-12d3-a456-426614174000';

  describe('create()', () => {
    it('should create Organization with valid data', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'City Hospital',
        type: OrganizationType.HOSPITAL(),
        description: 'Main city hospital',
        address: '123 Main St',
        contactEmail: 'contact@cityhospital.com',
        contactPhone: '+1234567890',
      });

      expect(org).toBeInstanceOf(Organization);
      expect(org.id).toBe(VALID_ID);
      expect(org.name).toBe('City Hospital');
      expect(org.type.getValue()).toBe('hospital');
      expect(org.description).toBe('Main city hospital');
      expect(org.address).toBe('123 Main St');
      expect(org.contactEmail).toBe('contact@cityhospital.com');
      expect(org.contactPhone).toBe('+1234567890');
    });

    it('should create Organization with active status by default', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'City Hospital',
        type: OrganizationType.HOSPITAL(),
      });

      expect(org.active).toBe(true);
    });

    it('should set createdAt and updatedAt to current date', () => {
      const before = new Date();
      const org = Organization.create({
        id: VALID_ID,
        name: 'City Hospital',
        type: OrganizationType.HOSPITAL(),
      });
      const after = new Date();

      expect(org.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(org.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(org.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(org.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw error when name is empty', () => {
      expect(() =>
        Organization.create({
          id: VALID_ID,
          name: '',
          type: OrganizationType.HOSPITAL(),
        })
      ).toThrow('name cannot be empty');
    });

    it('should throw error when id is empty', () => {
      expect(() =>
        Organization.create({
          id: '',
          name: 'City Hospital',
          type: OrganizationType.HOSPITAL(),
        })
      ).toThrow('id cannot be empty');
    });

    it('should allow null/undefined optional fields', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'City Hospital',
        type: OrganizationType.HOSPITAL(),
        description: null,
        address: undefined,
        contactEmail: null,
        contactPhone: undefined,
      });

      expect(org.description).toBeNull();
      expect(org.address).toBeNull();
      expect(org.contactEmail).toBeNull();
      expect(org.contactPhone).toBeNull();
    });
  });

  describe('Getters', () => {
    let org: Organization;

    beforeEach(() => {
      org = Organization.create({
        id: VALID_ID,
        name: 'Medical Clinic',
        type: OrganizationType.CLINIC(),
        description: 'A medical clinic',
        address: '456 Clinic Ave',
        contactEmail: 'info@clinic.com',
        contactPhone: '+9876543210',
      });
    });

    it('should return id', () => {
      expect(org.id).toBe(VALID_ID);
    });

    it('should return name', () => {
      expect(org.name).toBe('Medical Clinic');
    });

    it('should return type', () => {
      expect(org.type).toBeInstanceOf(OrganizationType);
      expect(org.type.getValue()).toBe('clinic');
    });

    it('should return description', () => {
      expect(org.description).toBe('A medical clinic');
    });

    it('should return address', () => {
      expect(org.address).toBe('456 Clinic Ave');
    });

    it('should return contactEmail', () => {
      expect(org.contactEmail).toBe('info@clinic.com');
    });

    it('should return contactPhone', () => {
      expect(org.contactPhone).toBe('+9876543210');
    });

    it('should return active status', () => {
      expect(org.active).toBe(true);
    });

    it('should return createdAt', () => {
      expect(org.createdAt).toBeInstanceOf(Date);
    });

    it('should return updatedAt', () => {
      expect(org.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('activate()', () => {
    it('should activate an inactive organization', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Lab',
        type: OrganizationType.LABORATORY(),
      });
      const deactivated = org.deactivate(new Date());

      const activated = deactivated.activate(new Date());

      expect(activated.active).toBe(true);
      expect(activated).not.toBe(deactivated); // Immutability
    });

    it('should update updatedAt when activating', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Lab',
        type: OrganizationType.LABORATORY(),
      });
      const deactivated = org.deactivate(new Date());
      const activationDate = new Date();

      const activated = deactivated.activate(activationDate);

      expect(activated.updatedAt.getTime()).toBe(activationDate.getTime());
    });
  });

  describe('deactivate()', () => {
    it('should deactivate an active organization', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Pharmacy',
        type: OrganizationType.PHARMACY(),
      });

      const deactivated = org.deactivate(new Date());

      expect(deactivated.active).toBe(false);
      expect(deactivated).not.toBe(org); // Immutability
    });

    it('should update updatedAt when deactivating', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Pharmacy',
        type: OrganizationType.PHARMACY(),
      });
      const deactivationDate = new Date();

      const deactivated = org.deactivate(deactivationDate);

      expect(deactivated.updatedAt.getTime()).toBe(deactivationDate.getTime());
    });
  });

  describe('updateInfo()', () => {
    it('should update name only', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Old Name',
        type: OrganizationType.CLINIC(),
      });

      const updated = org.updateInfo({ name: 'New Name' }, new Date());

      expect(updated.name).toBe('New Name');
      expect(updated.type.getValue()).toBe('clinic');
    });

    it('should update description', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Hospital',
        type: OrganizationType.HOSPITAL(),
        description: 'Old description',
      });

      const updated = org.updateInfo({ description: 'New description' }, new Date());

      expect(updated.description).toBe('New description');
    });

    it('should update multiple fields', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Hospital',
        type: OrganizationType.HOSPITAL(),
      });

      const updated = org.updateInfo(
        {
          address: 'New Address',
          contactEmail: 'new@email.com',
          contactPhone: '+1111111111',
        },
        new Date()
      );

      expect(updated.address).toBe('New Address');
      expect(updated.contactEmail).toBe('new@email.com');
      expect(updated.contactPhone).toBe('+1111111111');
    });

    it('should update updatedAt', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Hospital',
        type: OrganizationType.HOSPITAL(),
      });
      const updateDate = new Date();

      const updated = org.updateInfo({ name: 'New Name' }, updateDate);

      expect(updated.updatedAt.getTime()).toBe(updateDate.getTime());
    });

    it('should throw error when updating name to empty string', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Hospital',
        type: OrganizationType.HOSPITAL(),
      });

      expect(() => org.updateInfo({ name: '' }, new Date())).toThrow('name cannot be empty');
    });

    it('should return new instance (immutability)', () => {
      const org = Organization.create({
        id: VALID_ID,
        name: 'Hospital',
        type: OrganizationType.HOSPITAL(),
      });

      const updated = org.updateInfo({ name: 'New Name' }, new Date());

      expect(updated).not.toBe(org);
      expect(org.name).toBe('Hospital');
      expect(updated.name).toBe('New Name');
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct Organization from stored props', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-15T00:00:00Z');

      const org = Organization.fromPersistence({
        id: VALID_ID,
        name: 'Health Center',
        type: OrganizationType.HEALTH_CENTER(),
        description: 'Community health center',
        address: '789 Health Rd',
        contactEmail: 'contact@health.com',
        contactPhone: '+5555555555',
        active: false,
        createdAt,
        updatedAt,
      });

      expect(org.id).toBe(VALID_ID);
      expect(org.name).toBe('Health Center');
      expect(org.type.getValue()).toBe('health_center');
      expect(org.active).toBe(false);
      expect(org.createdAt.getTime()).toBe(createdAt.getTime());
      expect(org.updatedAt.getTime()).toBe(updatedAt.getTime());
    });
  });

  describe('equals()', () => {
    it('should return true for organizations with same id', () => {
      const org1 = Organization.create({
        id: VALID_ID,
        name: 'Hospital A',
        type: OrganizationType.HOSPITAL(),
      });

      const org2 = Organization.create({
        id: VALID_ID,
        name: 'Hospital B',
        type: OrganizationType.CLINIC(),
      });

      expect(org1.equals(org2)).toBe(true);
    });

    it('should return false for organizations with different ids', () => {
      const org1 = Organization.create({
        id: VALID_ID,
        name: 'Hospital A',
        type: OrganizationType.HOSPITAL(),
      });

      const org2 = Organization.create({
        id: '999e8888-e77b-66d5-a555-444433332222',
        name: 'Hospital A',
        type: OrganizationType.HOSPITAL(),
      });

      expect(org1.equals(org2)).toBe(false);
    });
  });
});
