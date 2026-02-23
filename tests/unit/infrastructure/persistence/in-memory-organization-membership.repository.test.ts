/**
 * ============================================
 * TEST: InMemoryOrganizationMembershipRepository
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Tests for in-memory implementation of IOrganizationMembershipRepository
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryOrganizationMembershipRepository } from '../../../../src/infrastructure/persistence/in-memory/in-memory-organization-membership.repository.js';
import { OrganizationMembership } from '../../../../src/domain/entities/organization-membership.entity.js';
import { OrganizationRole } from '../../../../src/domain/value-objects/organization-role.value-object.js';
import { MembershipAlreadyExistsError } from '../../../../src/domain/errors/organization.errors.js';

describe('InMemoryOrganizationMembershipRepository', () => {
  let repository: InMemoryOrganizationMembershipRepository;

  beforeEach(() => {
    repository = new InMemoryOrganizationMembershipRepository();
  });

  describe('save()', () => {
    it('should save a new membership', async () => {
      // Arrange
      const membership = OrganizationMembership.create({
        id: 'mem-123',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });

      // Act
      await repository.save(membership);

      // Assert
      const found = await repository.findActiveMembership('user-1', 'org-1');
      expect(found).toBeDefined();
      expect(found?.userId).toBe('user-1');
      expect(found?.organizationId).toBe('org-1');
    });

    it('should throw MembershipAlreadyExistsError if active membership exists', async () => {
      // Arrange
      const membership1 = OrganizationMembership.create({
        id: 'mem-123',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      await repository.save(membership1);

      const membership2 = OrganizationMembership.create({
        id: 'mem-456',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.NURSE(),
        createdBy: 'admin-1',
      });

      // Act & Assert
      await expect(repository.save(membership2)).rejects.toThrow(
        MembershipAlreadyExistsError
      );
    });

    it('should allow new membership after previous was left', async () => {
      // Arrange
      const membership1 = OrganizationMembership.create({
        id: 'mem-123',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      await repository.save(membership1);

      // Mark as left
      const left = membership1.leave(new Date());
      await repository.update(left);

      // New membership for same user+org
      const membership2 = OrganizationMembership.create({
        id: 'mem-456',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.NURSE(),
        createdBy: 'admin-1',
      });

      // Act & Assert - should not throw
      await expect(repository.save(membership2)).resolves.not.toThrow();
    });

    it('should allow same user in different organizations', async () => {
      // Arrange
      const membership1 = OrganizationMembership.create({
        id: 'mem-123',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      await repository.save(membership1);

      const membership2 = OrganizationMembership.create({
        id: 'mem-456',
        userId: 'user-1',
        organizationId: 'org-2',
        role: OrganizationRole.NURSE(),
        createdBy: 'admin-1',
      });

      // Act & Assert - should not throw
      await expect(repository.save(membership2)).resolves.not.toThrow();
    });
  });

  describe('findByUserId()', () => {
    beforeEach(async () => {
      // Seed with test data
      const mem1 = OrganizationMembership.create({
        id: 'mem-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      const mem2 = OrganizationMembership.create({
        id: 'mem-2',
        userId: 'user-1',
        organizationId: 'org-2',
        role: OrganizationRole.NURSE(),
        createdBy: 'admin-1',
      });
      const mem3 = OrganizationMembership.create({
        id: 'mem-3',
        userId: 'user-2',
        organizationId: 'org-1',
        role: OrganizationRole.STAFF(),
        createdBy: 'admin-1',
      });

      await repository.save(mem1);
      await repository.save(mem2);
      await repository.save(mem3);

      // Mark one as left
      const left = mem2.leave(new Date());
      await repository.update(left);
    });

    it('should return all memberships for a user', async () => {
      // Act
      const memberships = await repository.findByUserId('user-1');

      // Assert
      expect(memberships).toHaveLength(2);
      expect(memberships.every((m) => m.userId === 'user-1')).toBe(true);
    });

    it('should return only active memberships when activeOnly=true', async () => {
      // Act
      const memberships = await repository.findByUserId('user-1', true);

      // Assert
      expect(memberships).toHaveLength(1);
      expect(memberships[0].isActive()).toBe(true);
    });

    it('should return empty array when user has no memberships', async () => {
      // Act
      const memberships = await repository.findByUserId('non-existent');

      // Assert
      expect(memberships).toHaveLength(0);
    });
  });

  describe('findByOrganizationId()', () => {
    beforeEach(async () => {
      // Seed with test data
      const mem1 = OrganizationMembership.create({
        id: 'mem-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      const mem2 = OrganizationMembership.create({
        id: 'mem-2',
        userId: 'user-2',
        organizationId: 'org-1',
        role: OrganizationRole.NURSE(),
        createdBy: 'admin-1',
      });
      const mem3 = OrganizationMembership.create({
        id: 'mem-3',
        userId: 'user-3',
        organizationId: 'org-2',
        role: OrganizationRole.STAFF(),
        createdBy: 'admin-1',
      });

      await repository.save(mem1);
      await repository.save(mem2);
      await repository.save(mem3);

      // Mark one as left
      const left = mem2.leave(new Date());
      await repository.update(left);
    });

    it('should return all memberships in an organization', async () => {
      // Act
      const memberships = await repository.findByOrganizationId('org-1');

      // Assert
      expect(memberships).toHaveLength(2);
      expect(memberships.every((m) => m.organizationId === 'org-1')).toBe(
        true
      );
    });

    it('should return only active memberships when activeOnly=true', async () => {
      // Act
      const memberships = await repository.findByOrganizationId('org-1', true);

      // Assert
      expect(memberships).toHaveLength(1);
      expect(memberships[0].isActive()).toBe(true);
    });

    it('should return empty array when organization has no memberships', async () => {
      // Act
      const memberships = await repository.findByOrganizationId(
        'non-existent'
      );

      // Assert
      expect(memberships).toHaveLength(0);
    });
  });

  describe('findActiveMembership()', () => {
    beforeEach(async () => {
      const mem1 = OrganizationMembership.create({
        id: 'mem-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      await repository.save(mem1);

      const mem2 = OrganizationMembership.create({
        id: 'mem-2',
        userId: 'user-2',
        organizationId: 'org-1',
        role: OrganizationRole.NURSE(),
        createdBy: 'admin-1',
      });
      await repository.save(mem2);

      // Mark mem2 as left
      const left = mem2.leave(new Date());
      await repository.update(left);
    });

    it('should return active membership for user in organization', async () => {
      // Act
      const membership = await repository.findActiveMembership(
        'user-1',
        'org-1'
      );

      // Assert
      expect(membership).toBeDefined();
      expect(membership?.userId).toBe('user-1');
      expect(membership?.organizationId).toBe('org-1');
      expect(membership?.isActive()).toBe(true);
    });

    it('should return null when membership was left', async () => {
      // Act
      const membership = await repository.findActiveMembership(
        'user-2',
        'org-1'
      );

      // Assert
      expect(membership).toBeNull();
    });

    it('should return null when no membership exists', async () => {
      // Act
      const membership = await repository.findActiveMembership(
        'user-1',
        'org-999'
      );

      // Assert
      expect(membership).toBeNull();
    });
  });

  describe('update()', () => {
    it('should update an existing membership', async () => {
      // Arrange
      const membership = OrganizationMembership.create({
        id: 'mem-123',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      await repository.save(membership);

      const updated = membership.changeRole(OrganizationRole.NURSE(), new Date());

      // Act
      await repository.update(updated);

      // Assert
      const found = await repository.findActiveMembership('user-1', 'org-1');
      expect(found?.role.getValue()).toBe('nurse');
    });

    it('should throw error if membership does not exist', async () => {
      // Arrange
      const membership = OrganizationMembership.create({
        id: 'non-existent',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });

      // Act & Assert
      await expect(repository.update(membership)).rejects.toThrow();
    });

    it('should mark membership as left', async () => {
      // Arrange
      const membership = OrganizationMembership.create({
        id: 'mem-123',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      await repository.save(membership);

      const left = membership.leave(new Date());

      // Act
      await repository.update(left);

      // Assert
      const found = await repository.findActiveMembership('user-1', 'org-1');
      expect(found).toBeNull();
    });
  });

  describe('remove()', () => {
    it('should remove a membership', async () => {
      // Arrange
      const membership = OrganizationMembership.create({
        id: 'mem-123',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      await repository.save(membership);

      // Act
      await repository.remove('mem-123');

      // Assert
      const found = await repository.findActiveMembership('user-1', 'org-1');
      expect(found).toBeNull();
    });

    it('should throw error if membership does not exist', async () => {
      // Act & Assert
      await expect(repository.remove('non-existent')).rejects.toThrow();
    });
  });

  describe('Test Helpers', () => {
    it('should reset the repository', async () => {
      // Arrange
      const membership = OrganizationMembership.create({
        id: 'mem-123',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      await repository.save(membership);

      // Act
      repository.reset();

      // Assert
      const found = await repository.findActiveMembership('user-1', 'org-1');
      expect(found).toBeNull();
      expect(repository.count()).toBe(0);
    });

    it('should count memberships', async () => {
      // Arrange
      const mem1 = OrganizationMembership.create({
        id: 'mem-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: OrganizationRole.DOCTOR(),
        createdBy: 'admin-1',
      });
      const mem2 = OrganizationMembership.create({
        id: 'mem-2',
        userId: 'user-2',
        organizationId: 'org-1',
        role: OrganizationRole.NURSE(),
        createdBy: 'admin-1',
      });
      await repository.save(mem1);
      await repository.save(mem2);

      // Act
      const count = repository.count();

      // Assert
      expect(count).toBe(2);
    });
  });
});
