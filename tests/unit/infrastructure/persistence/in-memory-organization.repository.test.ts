/**
 * ============================================
 * TEST: InMemoryOrganizationRepository
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Tests for in-memory implementation of IOrganizationRepository
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryOrganizationRepository } from '../../../../src/infrastructure/persistence/in-memory/in-memory-organization.repository.js';
import { Organization } from '../../../../src/domain/entities/organization.entity.js';
import { OrganizationType } from '../../../../src/domain/value-objects/organization-type.value-object.js';
import {
  OrganizationAlreadyExistsError,
  OrganizationNotFoundError,
} from '../../../../src/domain/errors/organization.errors.js';

describe('InMemoryOrganizationRepository', () => {
  let repository: InMemoryOrganizationRepository;

  beforeEach(() => {
    repository = new InMemoryOrganizationRepository();
  });

  describe('save()', () => {
    it('should save a new organization', async () => {
      // Arrange
      const org = Organization.create({
        id: 'org-123',
        name: 'Hospital General',
        type: OrganizationType.HOSPITAL(),
      });

      // Act
      await repository.save(org);

      // Assert
      const found = await repository.findById('org-123');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Hospital General');
    });

    it('should throw OrganizationAlreadyExistsError if name already exists', async () => {
      // Arrange
      const org1 = Organization.create({
        id: 'org-123',
        name: 'Hospital General',
        type: OrganizationType.HOSPITAL(),
      });
      await repository.save(org1);

      const org2 = Organization.create({
        id: 'org-456',
        name: 'Hospital General',
        type: OrganizationType.HOSPITAL(),
      });

      // Act & Assert
      await expect(repository.save(org2)).rejects.toThrow(
        OrganizationAlreadyExistsError
      );
    });

    it('should allow saving organization with same name if first is deleted', async () => {
      // Arrange
      const org1 = Organization.create({
        id: 'org-123',
        name: 'Hospital General',
        type: OrganizationType.HOSPITAL(),
      });
      await repository.save(org1);
      await repository.delete('org-123');

      const org2 = Organization.create({
        id: 'org-456',
        name: 'Hospital General',
        type: OrganizationType.HOSPITAL(),
      });

      // Act & Assert - should not throw
      await expect(repository.save(org2)).resolves.not.toThrow();
    });
  });

  describe('findById()', () => {
    it('should return organization when found', async () => {
      // Arrange
      const org = Organization.create({
        id: 'org-123',
        name: 'Clinica San Jose',
        type: OrganizationType.CLINIC(),
      });
      await repository.save(org);

      // Act
      const found = await repository.findById('org-123');

      // Assert
      expect(found).toBeDefined();
      expect(found?.id).toBe('org-123');
      expect(found?.name).toBe('Clinica San Jose');
    });

    it('should return null when organization not found', async () => {
      // Act
      const found = await repository.findById('non-existent');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('findByName()', () => {
    it('should return organization when found by name', async () => {
      // Arrange
      const org = Organization.create({
        id: 'org-123',
        name: 'Hospital Central',
        type: OrganizationType.HOSPITAL(),
      });
      await repository.save(org);

      // Act
      const found = await repository.findByName('Hospital Central');

      // Assert
      expect(found).toBeDefined();
      expect(found?.id).toBe('org-123');
      expect(found?.name).toBe('Hospital Central');
    });

    it('should return null when organization not found by name', async () => {
      // Act
      const found = await repository.findByName('Non Existent Hospital');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('findAll()', () => {
    beforeEach(async () => {
      // Seed with test data
      const org1 = Organization.create({
        id: 'org-1',
        name: 'Hospital A',
        type: OrganizationType.HOSPITAL(),
      });
      const org2 = Organization.create({
        id: 'org-2',
        name: 'Clinic B',
        type: OrganizationType.CLINIC(),
      });
      const org3 = Organization.create({
        id: 'org-3',
        name: 'Hospital C',
        type: OrganizationType.HOSPITAL(),
      });

      await repository.save(org1);
      await repository.save(org2);
      await repository.save(org3);

      // Deactivate one
      const deactivated = org3.deactivate(new Date());
      await repository.update(deactivated);
    });

    it('should return all active organizations by default', async () => {
      // Act
      const orgs = await repository.findAll();

      // Assert
      expect(orgs).toHaveLength(2);
      expect(orgs.every((org) => org.active)).toBe(true);
    });

    it('should return inactive organizations when active=false', async () => {
      // Act
      const orgs = await repository.findAll({ active: false });

      // Assert
      expect(orgs).toHaveLength(1);
      expect(orgs[0].id).toBe('org-3');
      expect(orgs[0].active).toBe(false);
    });

    it('should return all organizations when active is undefined', async () => {
      // Act
      const orgs = await repository.findAll({ active: undefined });

      // Assert
      expect(orgs).toHaveLength(3);
    });

    it('should apply pagination with limit', async () => {
      // Act
      const orgs = await repository.findAll({ limit: 1 });

      // Assert
      expect(orgs).toHaveLength(1);
    });

    it('should apply pagination with offset', async () => {
      // Act
      const orgs = await repository.findAll({ offset: 1, limit: 10 });

      // Assert
      expect(orgs).toHaveLength(1); // Only 2 active, skip first
    });

    it('should return empty array when offset exceeds results', async () => {
      // Act
      const orgs = await repository.findAll({ offset: 10 });

      // Assert
      expect(orgs).toHaveLength(0);
    });
  });

  describe('update()', () => {
    it('should update an existing organization', async () => {
      // Arrange
      const org = Organization.create({
        id: 'org-123',
        name: 'Hospital Original',
        type: OrganizationType.HOSPITAL(),
      });
      await repository.save(org);

      const updated = org.updateInfo(
        { name: 'Hospital Updated' },
        new Date()
      );

      // Act
      await repository.update(updated);

      // Assert
      const found = await repository.findById('org-123');
      expect(found?.name).toBe('Hospital Updated');
    });

    it('should throw OrganizationNotFoundError if organization does not exist', async () => {
      // Arrange
      const org = Organization.create({
        id: 'non-existent',
        name: 'Hospital',
        type: OrganizationType.HOSPITAL(),
      });

      // Act & Assert
      await expect(repository.update(org)).rejects.toThrow(
        OrganizationNotFoundError
      );
    });

    it('should allow updating to a name that existed before but was deleted', async () => {
      // Arrange
      const org1 = Organization.create({
        id: 'org-1',
        name: 'Hospital A',
        type: OrganizationType.HOSPITAL(),
      });
      await repository.save(org1);
      await repository.delete('org-1');

      const org2 = Organization.create({
        id: 'org-2',
        name: 'Hospital B',
        type: OrganizationType.HOSPITAL(),
      });
      await repository.save(org2);

      const updated = org2.updateInfo({ name: 'Hospital A' }, new Date());

      // Act & Assert - should not throw
      await expect(repository.update(updated)).resolves.not.toThrow();
    });
  });

  describe('delete()', () => {
    it('should soft delete an existing organization (sets active=false)', async () => {
      // Arrange
      const org = Organization.create({
        id: 'org-123',
        name: 'Hospital to Delete',
        type: OrganizationType.HOSPITAL(),
      });
      await repository.save(org);

      // Act
      await repository.delete('org-123');

      // Assert
      const found = await repository.findById('org-123');
      expect(found).not.toBeNull();
      expect(found!.active).toBe(false);
    });

    it('should throw OrganizationNotFoundError if organization does not exist', async () => {
      // Act & Assert
      await expect(repository.delete('non-existent')).rejects.toThrow(
        OrganizationNotFoundError
      );
    });
  });

  describe('Test Helpers', () => {
    it('should reset the repository', async () => {
      // Arrange
      const org = Organization.create({
        id: 'org-123',
        name: 'Hospital',
        type: OrganizationType.HOSPITAL(),
      });
      await repository.save(org);

      // Act
      repository.reset();

      // Assert
      const found = await repository.findById('org-123');
      expect(found).toBeNull();
      expect(repository.count()).toBe(0);
    });

    it('should count organizations', async () => {
      // Arrange
      const org1 = Organization.create({
        id: 'org-1',
        name: 'Hospital A',
        type: OrganizationType.HOSPITAL(),
      });
      const org2 = Organization.create({
        id: 'org-2',
        name: 'Clinic B',
        type: OrganizationType.CLINIC(),
      });
      await repository.save(org1);
      await repository.save(org2);

      // Act
      const count = repository.count();

      // Assert
      expect(count).toBe(2);
    });
  });
});
