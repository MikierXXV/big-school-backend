/**
 * ============================================
 * TEST: OrganizationMembership Entity
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * TDD - Tests first, then implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OrganizationMembership } from '../../../../src/domain/entities/organization-membership.entity.js';
import { OrganizationRole } from '../../../../src/domain/value-objects/organization-role.value-object.js';

describe('OrganizationMembership Entity', () => {
  const VALID_ID = '123e4567-e89b-12d3-a456-426614174000';
  const USER_ID = '987fcdeb-51a2-3bc4-d567-890123456789';
  const ORG_ID = '111e2222-e33b-44d5-a666-777788889999';
  const CREATED_BY = '555e6666-e77b-88d9-a000-111122223333';

  describe('create()', () => {
    it('should create OrganizationMembership with valid data', () => {
      const membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.DOCTOR(),
        createdBy: CREATED_BY,
      });

      expect(membership).toBeInstanceOf(OrganizationMembership);
      expect(membership.id).toBe(VALID_ID);
      expect(membership.userId).toBe(USER_ID);
      expect(membership.organizationId).toBe(ORG_ID);
      expect(membership.role.getValue()).toBe('doctor');
      expect(membership.createdBy).toBe(CREATED_BY);
      expect(membership.leftAt).toBeNull();
    });

    it('should set joinedAt to current date', () => {
      const before = new Date();
      const membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.NURSE(),
        createdBy: CREATED_BY,
      });
      const after = new Date();

      expect(membership.joinedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(membership.joinedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should set createdAt and updatedAt to current date', () => {
      const before = new Date();
      const membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.STAFF(),
        createdBy: CREATED_BY,
      });
      const after = new Date();

      expect(membership.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(membership.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(membership.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(membership.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw error when id is empty', () => {
      expect(() =>
        OrganizationMembership.create({
          id: '',
          userId: USER_ID,
          organizationId: ORG_ID,
          role: OrganizationRole.DOCTOR(),
          createdBy: CREATED_BY,
        })
      ).toThrow('id cannot be empty');
    });

    it('should throw error when userId is empty', () => {
      expect(() =>
        OrganizationMembership.create({
          id: VALID_ID,
          userId: '',
          organizationId: ORG_ID,
          role: OrganizationRole.DOCTOR(),
          createdBy: CREATED_BY,
        })
      ).toThrow('userId cannot be empty');
    });

    it('should throw error when organizationId is empty', () => {
      expect(() =>
        OrganizationMembership.create({
          id: VALID_ID,
          userId: USER_ID,
          organizationId: '',
          role: OrganizationRole.DOCTOR(),
          createdBy: CREATED_BY,
        })
      ).toThrow('organizationId cannot be empty');
    });

    it('should throw error when createdBy is empty', () => {
      expect(() =>
        OrganizationMembership.create({
          id: VALID_ID,
          userId: USER_ID,
          organizationId: ORG_ID,
          role: OrganizationRole.DOCTOR(),
          createdBy: '',
        })
      ).toThrow('createdBy cannot be empty');
    });
  });

  describe('Getters', () => {
    let membership: OrganizationMembership;

    beforeEach(() => {
      membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.SPECIALIST(),
        createdBy: CREATED_BY,
      });
    });

    it('should return id', () => {
      expect(membership.id).toBe(VALID_ID);
    });

    it('should return userId', () => {
      expect(membership.userId).toBe(USER_ID);
    });

    it('should return organizationId', () => {
      expect(membership.organizationId).toBe(ORG_ID);
    });

    it('should return role', () => {
      expect(membership.role).toBeInstanceOf(OrganizationRole);
      expect(membership.role.getValue()).toBe('specialist');
    });

    it('should return createdBy', () => {
      expect(membership.createdBy).toBe(CREATED_BY);
    });

    it('should return joinedAt', () => {
      expect(membership.joinedAt).toBeInstanceOf(Date);
    });

    it('should return leftAt', () => {
      expect(membership.leftAt).toBeNull();
    });

    it('should return createdAt', () => {
      expect(membership.createdAt).toBeInstanceOf(Date);
    });

    it('should return updatedAt', () => {
      expect(membership.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('leave()', () => {
    it('should mark membership as left', () => {
      const membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.GUEST(),
        createdBy: CREATED_BY,
      });
      const leaveDate = new Date();

      const left = membership.leave(leaveDate);

      expect(left.leftAt).not.toBeNull();
      expect(left.leftAt?.getTime()).toBe(leaveDate.getTime());
      expect(left).not.toBe(membership); // Immutability
    });

    it('should update updatedAt when leaving', () => {
      const membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.STAFF(),
        createdBy: CREATED_BY,
      });
      const leaveDate = new Date();

      const left = membership.leave(leaveDate);

      expect(left.updatedAt.getTime()).toBe(leaveDate.getTime());
    });
  });

  describe('changeRole()', () => {
    it('should change role to new role', () => {
      const membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.NURSE(),
        createdBy: CREATED_BY,
      });
      const changeDate = new Date();

      const changed = membership.changeRole(OrganizationRole.DOCTOR(), changeDate);

      expect(changed.role.getValue()).toBe('doctor');
      expect(changed).not.toBe(membership); // Immutability
    });

    it('should update updatedAt when changing role', () => {
      const membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.STAFF(),
        createdBy: CREATED_BY,
      });
      const changeDate = new Date();

      const changed = membership.changeRole(OrganizationRole.ORG_ADMIN(), changeDate);

      expect(changed.updatedAt.getTime()).toBe(changeDate.getTime());
    });
  });

  describe('isActive()', () => {
    it('should return true when leftAt is null', () => {
      const membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.DOCTOR(),
        createdBy: CREATED_BY,
      });

      expect(membership.isActive()).toBe(true);
    });

    it('should return false when leftAt is set', () => {
      const membership = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.DOCTOR(),
        createdBy: CREATED_BY,
      });
      const left = membership.leave(new Date());

      expect(left.isActive()).toBe(false);
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct OrganizationMembership from stored props', () => {
      const joinedAt = new Date('2024-01-01T00:00:00Z');
      const leftAt = new Date('2024-02-01T00:00:00Z');
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-02-01T00:00:00Z');

      const membership = OrganizationMembership.fromPersistence({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.ORG_ADMIN(),
        joinedAt,
        leftAt,
        createdBy: CREATED_BY,
        createdAt,
        updatedAt,
      });

      expect(membership.id).toBe(VALID_ID);
      expect(membership.userId).toBe(USER_ID);
      expect(membership.organizationId).toBe(ORG_ID);
      expect(membership.role.getValue()).toBe('org_admin');
      expect(membership.joinedAt.getTime()).toBe(joinedAt.getTime());
      expect(membership.leftAt?.getTime()).toBe(leftAt.getTime());
      expect(membership.createdBy).toBe(CREATED_BY);
      expect(membership.createdAt.getTime()).toBe(createdAt.getTime());
      expect(membership.updatedAt.getTime()).toBe(updatedAt.getTime());
    });

    it('should reconstruct active membership with null leftAt', () => {
      const membership = OrganizationMembership.fromPersistence({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.NURSE(),
        joinedAt: new Date(),
        leftAt: null,
        createdBy: CREATED_BY,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(membership.leftAt).toBeNull();
      expect(membership.isActive()).toBe(true);
    });
  });

  describe('equals()', () => {
    it('should return true for memberships with same id', () => {
      const membership1 = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.DOCTOR(),
        createdBy: CREATED_BY,
      });

      const membership2 = OrganizationMembership.create({
        id: VALID_ID,
        userId: 'different-user',
        organizationId: 'different-org',
        role: OrganizationRole.NURSE(),
        createdBy: 'different-creator',
      });

      expect(membership1.equals(membership2)).toBe(true);
    });

    it('should return false for memberships with different ids', () => {
      const membership1 = OrganizationMembership.create({
        id: VALID_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.DOCTOR(),
        createdBy: CREATED_BY,
      });

      const membership2 = OrganizationMembership.create({
        id: '999e8888-e77b-66d5-a555-444433332222',
        userId: USER_ID,
        organizationId: ORG_ID,
        role: OrganizationRole.DOCTOR(),
        createdBy: CREATED_BY,
      });

      expect(membership1.equals(membership2)).toBe(false);
    });
  });
});
