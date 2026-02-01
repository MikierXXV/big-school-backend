/**
 * ============================================
 * UNIT TEST: User Entity
 * ============================================
 *
 * Tests unitarios para la entidad User (Aggregate Root).
 * Validan las reglas de negocio del contexto de autenticación.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { User, UserStatus, CreateUserData } from '../../../../src/domain/entities/user.entity.js';
import { UserId } from '../../../../src/domain/value-objects/user-id.value-object.js';
import { Email } from '../../../../src/domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';

describe('User Entity', () => {
  // Datos de prueba válidos
  const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
  const ANOTHER_UUID = '987fcdeb-51a2-3bc4-d567-890123456789';
  const VALID_EMAIL = 'test@example.com';
  const VALID_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';
  const ANOTHER_HASH = '$2b$12$abcdefghijklmnopqrstuuOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';

  let validUserData: CreateUserData;

  beforeEach(() => {
    validUserData = {
      id: UserId.create(VALID_UUID),
      email: Email.create(VALID_EMAIL),
      passwordHash: PasswordHash.fromHash(VALID_HASH),
      firstName: 'John',
      lastName: 'Doe',
    };
  });

  describe('create()', () => {
    it('should create a user with PENDING_VERIFICATION status', () => {
      const user = User.create(validUserData);

      expect(user).toBeInstanceOf(User);
      expect(user.status).toBe(UserStatus.PENDING_VERIFICATION);
    });

    it('should set createdAt and updatedAt to current date', () => {
      const before = new Date();
      const user = User.create(validUserData);
      const after = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should set lastLoginAt to null', () => {
      const user = User.create(validUserData);

      expect(user.lastLoginAt).toBeNull();
    });

    it('should set emailVerifiedAt to null', () => {
      const user = User.create(validUserData);

      expect(user.emailVerifiedAt).toBeNull();
    });

    it('should correctly store user data', () => {
      const user = User.create(validUserData);

      expect(user.id.value).toBe(VALID_UUID);
      expect(user.email.value).toBe(VALID_EMAIL);
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.fullName).toBe('John Doe');
    });
  });

  describe('canLogin()', () => {
    it('should return true when user is ACTIVE', () => {
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(new Date());

      expect(verifiedUser.canLogin()).toBe(true);
    });

    it('should return false when user is PENDING_VERIFICATION', () => {
      const user = User.create(validUserData);

      expect(user.canLogin()).toBe(false);
    });

    it('should return false when user is SUSPENDED', () => {
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(new Date());
      const suspendedUser = verifiedUser.suspend(new Date());

      expect(suspendedUser.canLogin()).toBe(false);
    });

    it('should return false when user is DEACTIVATED', () => {
      // Create a user and set it to DEACTIVATED via fromPersistence
      const props = {
        id: UserId.create(VALID_UUID),
        email: Email.create(VALID_EMAIL),
        passwordHash: PasswordHash.fromHash(VALID_HASH),
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.DEACTIVATED,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        emailVerifiedAt: null,
      };
      const user = User.fromPersistence(props);

      expect(user.canLogin()).toBe(false);
    });
  });

  describe('isEmailVerified()', () => {
    it('should return false when email is not verified', () => {
      const user = User.create(validUserData);

      expect(user.isEmailVerified()).toBe(false);
    });

    it('should return true when email is verified', () => {
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(new Date());

      expect(verifiedUser.isEmailVerified()).toBe(true);
    });
  });

  describe('isActive()', () => {
    it('should return false when user is PENDING_VERIFICATION', () => {
      const user = User.create(validUserData);

      expect(user.isActive()).toBe(false);
    });

    it('should return true when user is ACTIVE', () => {
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(new Date());

      expect(verifiedUser.isActive()).toBe(true);
    });
  });

  describe('verifyEmail()', () => {
    it('should set emailVerifiedAt to provided date', () => {
      const verificationDate = new Date('2024-01-15T10:00:00Z');
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(verificationDate);

      expect(verifiedUser.emailVerifiedAt?.getTime()).toBe(verificationDate.getTime());
    });

    it('should change status to ACTIVE if was PENDING_VERIFICATION', () => {
      const user = User.create(validUserData);

      expect(user.status).toBe(UserStatus.PENDING_VERIFICATION);

      const verifiedUser = user.verifyEmail(new Date());

      expect(verifiedUser.status).toBe(UserStatus.ACTIVE);
    });

    it('should not change status if was already ACTIVE', () => {
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(new Date());

      expect(verifiedUser.status).toBe(UserStatus.ACTIVE);

      // Verify again (should stay ACTIVE)
      const reVerifiedUser = verifiedUser.verifyEmail(new Date());

      expect(reVerifiedUser.status).toBe(UserStatus.ACTIVE);
    });

    it('should update updatedAt', () => {
      const verificationDate = new Date('2024-01-15T10:00:00Z');
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(verificationDate);

      expect(verifiedUser.updatedAt.getTime()).toBe(verificationDate.getTime());
    });

    it('should return a new instance (immutability)', () => {
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(new Date());

      expect(verifiedUser).not.toBe(user);
      expect(user.emailVerifiedAt).toBeNull();
    });
  });

  describe('recordLogin()', () => {
    it('should update lastLoginAt', () => {
      const loginDate = new Date('2024-01-15T10:00:00Z');
      const user = User.create(validUserData);
      const loggedInUser = user.recordLogin(loginDate);

      expect(loggedInUser.lastLoginAt?.getTime()).toBe(loginDate.getTime());
    });

    it('should update updatedAt', () => {
      const loginDate = new Date('2024-01-15T10:00:00Z');
      const user = User.create(validUserData);
      const loggedInUser = user.recordLogin(loginDate);

      expect(loggedInUser.updatedAt.getTime()).toBe(loginDate.getTime());
    });

    it('should return a new instance (immutability)', () => {
      const user = User.create(validUserData);
      const loggedInUser = user.recordLogin(new Date());

      expect(loggedInUser).not.toBe(user);
      expect(user.lastLoginAt).toBeNull();
    });
  });

  describe('updatePassword()', () => {
    it('should update passwordHash', () => {
      const newHash = PasswordHash.fromHash(ANOTHER_HASH);
      const user = User.create(validUserData);
      const updatedUser = user.updatePassword(newHash, new Date());

      expect(updatedUser.passwordHash.value).toBe(ANOTHER_HASH);
    });

    it('should update updatedAt', () => {
      const updateDate = new Date('2024-01-15T10:00:00Z');
      const newHash = PasswordHash.fromHash(ANOTHER_HASH);
      const user = User.create(validUserData);
      const updatedUser = user.updatePassword(newHash, updateDate);

      expect(updatedUser.updatedAt.getTime()).toBe(updateDate.getTime());
    });

    it('should return a new instance (immutability)', () => {
      const newHash = PasswordHash.fromHash(ANOTHER_HASH);
      const user = User.create(validUserData);
      const updatedUser = user.updatePassword(newHash, new Date());

      expect(updatedUser).not.toBe(user);
      expect(user.passwordHash.value).toBe(VALID_HASH);
    });
  });

  describe('suspend()', () => {
    it('should change status to SUSPENDED', () => {
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(new Date());
      const suspendedUser = verifiedUser.suspend(new Date());

      expect(suspendedUser.status).toBe(UserStatus.SUSPENDED);
    });

    it('should update updatedAt', () => {
      const suspendDate = new Date('2024-01-15T10:00:00Z');
      const user = User.create(validUserData);
      const suspendedUser = user.suspend(suspendDate);

      expect(suspendedUser.updatedAt.getTime()).toBe(suspendDate.getTime());
    });

    it('should return a new instance (immutability)', () => {
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(new Date());
      const suspendedUser = verifiedUser.suspend(new Date());

      expect(suspendedUser).not.toBe(verifiedUser);
      expect(verifiedUser.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('reactivate()', () => {
    it('should change status to ACTIVE', () => {
      const user = User.create(validUserData);
      const verifiedUser = user.verifyEmail(new Date());
      const suspendedUser = verifiedUser.suspend(new Date());
      const reactivatedUser = suspendedUser.reactivate(new Date());

      expect(reactivatedUser.status).toBe(UserStatus.ACTIVE);
    });

    it('should update updatedAt', () => {
      const reactivateDate = new Date('2024-01-15T10:00:00Z');
      const user = User.create(validUserData);
      const suspendedUser = user.suspend(new Date());
      const reactivatedUser = suspendedUser.reactivate(reactivateDate);

      expect(reactivatedUser.updatedAt.getTime()).toBe(reactivateDate.getTime());
    });

    it('should return a new instance (immutability)', () => {
      const user = User.create(validUserData);
      const suspendedUser = user.suspend(new Date());
      const reactivatedUser = suspendedUser.reactivate(new Date());

      expect(reactivatedUser).not.toBe(suspendedUser);
      expect(suspendedUser.status).toBe(UserStatus.SUSPENDED);
    });
  });

  describe('equals()', () => {
    it('should return true for users with same id', () => {
      const user1 = User.create(validUserData);
      const user2 = User.create(validUserData);

      expect(user1.equals(user2)).toBe(true);
    });

    it('should return false for users with different ids', () => {
      const user1 = User.create(validUserData);
      const user2 = User.create({
        ...validUserData,
        id: UserId.create(ANOTHER_UUID),
      });

      expect(user1.equals(user2)).toBe(false);
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct a user from stored props', () => {
      const props = {
        id: UserId.create(VALID_UUID),
        email: Email.create(VALID_EMAIL),
        passwordHash: PasswordHash.fromHash(VALID_HASH),
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-15T00:00:00Z'),
        lastLoginAt: new Date('2024-01-14T00:00:00Z'),
        emailVerifiedAt: new Date('2024-01-02T00:00:00Z'),
      };

      const user = User.fromPersistence(props);

      expect(user.id.value).toBe(VALID_UUID);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.lastLoginAt?.getTime()).toBe(props.lastLoginAt.getTime());
      expect(user.emailVerifiedAt?.getTime()).toBe(props.emailVerifiedAt.getTime());
    });
  });

  describe('domainEvents', () => {
    it('should start with empty domain events', () => {
      const user = User.create(validUserData);

      expect(user.domainEvents).toEqual([]);
    });

    it('should clear domain events', () => {
      const user = User.create(validUserData);
      user.clearDomainEvents();

      expect(user.domainEvents).toEqual([]);
    });
  });
});
