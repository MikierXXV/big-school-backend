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
import { SystemRole } from '../../../../src/domain/value-objects/system-role.value-object.js';

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
        systemRole: SystemRole.USER(),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        emailVerifiedAt: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lockoutCount: 0,
        lastFailedLoginAt: null,
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
        systemRole: SystemRole.USER(),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-15T00:00:00Z'),
        lastLoginAt: new Date('2024-01-14T00:00:00Z'),
        emailVerifiedAt: new Date('2024-01-02T00:00:00Z'),
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lockoutCount: 0,
        lastFailedLoginAt: null,
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

  // ============================================
  // ACCOUNT LOCKOUT TESTS
  // ============================================

  describe('Account Lockout', () => {
    describe('Initial State', () => {
      it('should initialize with zero failed attempts', () => {
        const user = User.create(validUserData);

        expect(user.failedLoginAttempts).toBe(0);
      });

      it('should initialize with null lockoutUntil', () => {
        const user = User.create(validUserData);

        expect(user.lockoutUntil).toBeNull();
      });

      it('should initialize with zero lockout count', () => {
        const user = User.create(validUserData);

        expect(user.lockoutCount).toBe(0);
      });

      it('should initialize with null lastFailedLoginAt', () => {
        const user = User.create(validUserData);

        expect(user.lastFailedLoginAt).toBeNull();
      });
    });

    describe('isLockedOut()', () => {
      it('should return false when lockoutUntil is null', () => {
        const user = User.create(validUserData);
        const now = new Date();

        expect(user.isLockedOut(now)).toBe(false);
      });

      it('should return true when lockoutUntil is in the future', () => {
        const now = new Date();
        const futureDate = new Date(now.getTime() + 60000); // 1 minute in future
        const props = {
          id: UserId.create(VALID_UUID),
          email: Email.create(VALID_EMAIL),
          passwordHash: PasswordHash.fromHash(VALID_HASH),
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE,
          systemRole: SystemRole.USER(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          emailVerifiedAt: new Date(),
          failedLoginAttempts: 5,
          lockoutUntil: futureDate,
          lockoutCount: 1,
          lastFailedLoginAt: now,
        };
        const user = User.fromPersistence(props);

        expect(user.isLockedOut(now)).toBe(true);
      });

      it('should return false when lockoutUntil is in the past', () => {
        const now = new Date();
        const pastDate = new Date(now.getTime() - 60000); // 1 minute ago
        const props = {
          id: UserId.create(VALID_UUID),
          email: Email.create(VALID_EMAIL),
          passwordHash: PasswordHash.fromHash(VALID_HASH),
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE,
          systemRole: SystemRole.USER(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          emailVerifiedAt: new Date(),
          failedLoginAttempts: 5,
          lockoutUntil: pastDate,
          lockoutCount: 1,
          lastFailedLoginAt: now,
        };
        const user = User.fromPersistence(props);

        expect(user.isLockedOut(now)).toBe(false);
      });
    });

    describe('getRemainingLockoutSeconds()', () => {
      it('should return 0 when not locked', () => {
        const user = User.create(validUserData);
        const now = new Date();

        expect(user.getRemainingLockoutSeconds(now)).toBe(0);
      });

      it('should return remaining seconds when locked', () => {
        const now = new Date();
        const lockoutUntil = new Date(now.getTime() + 120000); // 2 minutes
        const props = {
          id: UserId.create(VALID_UUID),
          email: Email.create(VALID_EMAIL),
          passwordHash: PasswordHash.fromHash(VALID_HASH),
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE,
          systemRole: SystemRole.USER(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          emailVerifiedAt: new Date(),
          failedLoginAttempts: 5,
          lockoutUntil,
          lockoutCount: 1,
          lastFailedLoginAt: now,
        };
        const user = User.fromPersistence(props);

        const remaining = user.getRemainingLockoutSeconds(now);
        expect(remaining).toBe(120);
      });

      it('should return 0 when lockout has expired', () => {
        const now = new Date();
        const pastDate = new Date(now.getTime() - 60000);
        const props = {
          id: UserId.create(VALID_UUID),
          email: Email.create(VALID_EMAIL),
          passwordHash: PasswordHash.fromHash(VALID_HASH),
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE,
          systemRole: SystemRole.USER(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          emailVerifiedAt: new Date(),
          failedLoginAttempts: 5,
          lockoutUntil: pastDate,
          lockoutCount: 1,
          lastFailedLoginAt: now,
        };
        const user = User.fromPersistence(props);

        expect(user.getRemainingLockoutSeconds(now)).toBe(0);
      });
    });

    describe('recordFailedLogin()', () => {
      it('should increment failedLoginAttempts', () => {
        const user = User.create(validUserData);
        const now = new Date();

        const updatedUser = user.recordFailedLogin(now);

        expect(updatedUser.failedLoginAttempts).toBe(1);
      });

      it('should set lastFailedLoginAt', () => {
        const user = User.create(validUserData);
        const now = new Date();

        const updatedUser = user.recordFailedLogin(now);

        expect(updatedUser.lastFailedLoginAt?.getTime()).toBe(now.getTime());
      });

      it('should not lock account before MAX_FAILED_ATTEMPTS', () => {
        let user = User.create(validUserData);
        const now = new Date();

        // Make 4 failed attempts (less than MAX_FAILED_ATTEMPTS of 5)
        for (let i = 0; i < 4; i++) {
          user = user.recordFailedLogin(now);
        }

        expect(user.failedLoginAttempts).toBe(4);
        expect(user.lockoutUntil).toBeNull();
        expect(user.lockoutCount).toBe(0);
      });

      it('should lock account after MAX_FAILED_ATTEMPTS', () => {
        let user = User.create(validUserData);
        const now = new Date();

        // Make 5 failed attempts (equals MAX_FAILED_ATTEMPTS)
        for (let i = 0; i < 5; i++) {
          user = user.recordFailedLogin(now);
        }

        expect(user.failedLoginAttempts).toBe(5);
        expect(user.lockoutUntil).not.toBeNull();
        expect(user.lockoutCount).toBe(1);
        expect(user.isLockedOut(now)).toBe(true);
      });

      it('should set lockout duration to BASE_LOCKOUT_DURATION_MS for first lockout', () => {
        let user = User.create(validUserData);
        const now = new Date();

        for (let i = 0; i < 5; i++) {
          user = user.recordFailedLogin(now);
        }

        const expectedLockoutEnd = now.getTime() + User.BASE_LOCKOUT_DURATION_MS;
        expect(user.lockoutUntil?.getTime()).toBe(expectedLockoutEnd);
      });

      it('should return a new instance (immutability)', () => {
        const user = User.create(validUserData);
        const now = new Date();

        const updatedUser = user.recordFailedLogin(now);

        expect(updatedUser).not.toBe(user);
        expect(user.failedLoginAttempts).toBe(0);
      });
    });

    describe('recordSuccessfulLogin()', () => {
      it('should reset failedLoginAttempts to 0', () => {
        let user = User.create(validUserData);
        const now = new Date();

        // Make some failed attempts
        user = user.recordFailedLogin(now);
        user = user.recordFailedLogin(now);
        expect(user.failedLoginAttempts).toBe(2);

        // Successful login
        const successUser = user.recordSuccessfulLogin(now);

        expect(successUser.failedLoginAttempts).toBe(0);
      });

      it('should clear lockoutUntil', () => {
        let user = User.create(validUserData);
        const now = new Date();

        // Trigger lockout
        for (let i = 0; i < 5; i++) {
          user = user.recordFailedLogin(now);
        }
        expect(user.lockoutUntil).not.toBeNull();

        // Wait for lockout to expire (simulate)
        const later = new Date(now.getTime() + User.BASE_LOCKOUT_DURATION_MS + 1000);
        const successUser = user.recordSuccessfulLogin(later);

        expect(successUser.lockoutUntil).toBeNull();
      });

      it('should reset lockoutCount to 0', () => {
        let user = User.create(validUserData);
        const now = new Date();

        // Trigger lockout
        for (let i = 0; i < 5; i++) {
          user = user.recordFailedLogin(now);
        }
        expect(user.lockoutCount).toBe(1);

        const successUser = user.recordSuccessfulLogin(now);

        expect(successUser.lockoutCount).toBe(0);
      });

      it('should clear lastFailedLoginAt', () => {
        let user = User.create(validUserData);
        const now = new Date();

        user = user.recordFailedLogin(now);
        expect(user.lastFailedLoginAt).not.toBeNull();

        const successUser = user.recordSuccessfulLogin(now);

        expect(successUser.lastFailedLoginAt).toBeNull();
      });

      it('should update lastLoginAt', () => {
        const user = User.create(validUserData);
        const now = new Date();

        const successUser = user.recordSuccessfulLogin(now);

        expect(successUser.lastLoginAt?.getTime()).toBe(now.getTime());
      });
    });

    describe('Progressive Lockout', () => {
      it('should increase lockout duration for repeated lockouts', () => {
        const now = new Date();

        // First lockout cycle
        let user = User.create(validUserData);
        for (let i = 0; i < 5; i++) {
          user = user.recordFailedLogin(now);
        }
        expect(user.lockoutCount).toBe(1);
        const firstLockoutDuration = user.lockoutUntil!.getTime() - now.getTime();
        expect(firstLockoutDuration).toBe(User.BASE_LOCKOUT_DURATION_MS);

        // Simulate lockout expiring and user logging in successfully
        const afterFirstLockout = new Date(now.getTime() + User.BASE_LOCKOUT_DURATION_MS + 1000);

        // But they fail to login, simulating they forgot again
        // Create a user with lockoutCount = 1 but lockout expired
        const propsAfterFirstLockout = {
          id: UserId.create(VALID_UUID),
          email: Email.create(VALID_EMAIL),
          passwordHash: PasswordHash.fromHash(VALID_HASH),
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE,
          systemRole: SystemRole.USER(),
          createdAt: new Date(),
          updatedAt: afterFirstLockout,
          lastLoginAt: null,
          emailVerifiedAt: new Date(),
          failedLoginAttempts: 0,
          lockoutUntil: null,
          lockoutCount: 1, // Keep previous lockout count
          lastFailedLoginAt: null,
        };
        let userSecondCycle = User.fromPersistence(propsAfterFirstLockout);

        // Second lockout cycle
        for (let i = 0; i < 5; i++) {
          userSecondCycle = userSecondCycle.recordFailedLogin(afterFirstLockout);
        }

        expect(userSecondCycle.lockoutCount).toBe(2);
        const secondLockoutDuration = userSecondCycle.lockoutUntil!.getTime() - afterFirstLockout.getTime();
        expect(secondLockoutDuration).toBe(User.BASE_LOCKOUT_DURATION_MS * 2);
      });

      it('should cap lockout duration at MAX_LOCKOUT_DURATION_MS', () => {
        const now = new Date();

        // Create user with high lockout count
        const props = {
          id: UserId.create(VALID_UUID),
          email: Email.create(VALID_EMAIL),
          passwordHash: PasswordHash.fromHash(VALID_HASH),
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE,
          systemRole: SystemRole.USER(),
          createdAt: new Date(),
          updatedAt: now,
          lastLoginAt: null,
          emailVerifiedAt: new Date(),
          failedLoginAttempts: 0,
          lockoutUntil: null,
          lockoutCount: 10, // High lockout count
          lastFailedLoginAt: null,
        };
        let user = User.fromPersistence(props);

        // Trigger another lockout
        for (let i = 0; i < 5; i++) {
          user = user.recordFailedLogin(now);
        }

        const lockoutDuration = user.lockoutUntil!.getTime() - now.getTime();
        expect(lockoutDuration).toBe(User.MAX_LOCKOUT_DURATION_MS);
      });
    });

    describe('canAttemptLogin()', () => {
      it('should return true for ACTIVE user not locked out', () => {
        const user = User.create(validUserData).verifyEmail(new Date());
        const now = new Date();

        expect(user.canAttemptLogin(now)).toBe(true);
      });

      it('should return true for PENDING_VERIFICATION user', () => {
        const user = User.create(validUserData);
        const now = new Date();

        expect(user.canAttemptLogin(now)).toBe(true);
      });

      it('should return false when locked out', () => {
        let user = User.create(validUserData).verifyEmail(new Date());
        const now = new Date();

        // Trigger lockout
        for (let i = 0; i < 5; i++) {
          user = user.recordFailedLogin(now);
        }

        expect(user.canAttemptLogin(now)).toBe(false);
      });

      it('should return false for SUSPENDED user', () => {
        const user = User.create(validUserData)
          .verifyEmail(new Date())
          .suspend(new Date());
        const now = new Date();

        expect(user.canAttemptLogin(now)).toBe(false);
      });

      it('should return false for DEACTIVATED user', () => {
        const props = {
          id: UserId.create(VALID_UUID),
          email: Email.create(VALID_EMAIL),
          passwordHash: PasswordHash.fromHash(VALID_HASH),
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.DEACTIVATED,
          systemRole: SystemRole.USER(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          emailVerifiedAt: null,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          lockoutCount: 0,
          lastFailedLoginAt: null,
        };
        const user = User.fromPersistence(props);
        const now = new Date();

        expect(user.canAttemptLogin(now)).toBe(false);
      });
    });
  });

  describe('System Role', () => {
    describe('create() with systemRole', () => {
      it('should create user with USER role by default', () => {
        const user = User.create(validUserData);

        expect(user.systemRole).toBeInstanceOf(SystemRole);
        expect(user.systemRole.getValue()).toBe('user');
        expect(user.isUser()).toBe(true);
      });

      it('should create user with specified SUPER_ADMIN role', () => {
        const data: CreateUserData = {
          ...validUserData,
          systemRole: SystemRole.SUPER_ADMIN(),
        };
        const user = User.create(data);

        expect(user.systemRole.getValue()).toBe('super_admin');
        expect(user.isSuperAdmin()).toBe(true);
      });

      it('should create user with specified ADMIN role', () => {
        const data: CreateUserData = {
          ...validUserData,
          systemRole: SystemRole.ADMIN(),
        };
        const user = User.create(data);

        expect(user.systemRole.getValue()).toBe('admin');
        expect(user.isAdmin()).toBe(true);
      });
    });

    describe('systemRole getter', () => {
      it('should return systemRole value object', () => {
        const user = User.create(validUserData);

        expect(user.systemRole).toBeInstanceOf(SystemRole);
      });
    });

    describe('isSuperAdmin()', () => {
      it('should return true for SUPER_ADMIN user', () => {
        const data: CreateUserData = {
          ...validUserData,
          systemRole: SystemRole.SUPER_ADMIN(),
        };
        const user = User.create(data);

        expect(user.isSuperAdmin()).toBe(true);
        expect(user.isAdmin()).toBe(false);
        expect(user.isUser()).toBe(false);
      });

      it('should return false for non-SUPER_ADMIN users', () => {
        const regularUser = User.create(validUserData);
        const adminData: CreateUserData = {
          ...validUserData,
          systemRole: SystemRole.ADMIN(),
        };
        const adminUser = User.create(adminData);

        expect(regularUser.isSuperAdmin()).toBe(false);
        expect(adminUser.isSuperAdmin()).toBe(false);
      });
    });

    describe('isAdmin()', () => {
      it('should return true for ADMIN user', () => {
        const data: CreateUserData = {
          ...validUserData,
          systemRole: SystemRole.ADMIN(),
        };
        const user = User.create(data);

        expect(user.isAdmin()).toBe(true);
        expect(user.isSuperAdmin()).toBe(false);
        expect(user.isUser()).toBe(false);
      });

      it('should return false for non-ADMIN users', () => {
        const regularUser = User.create(validUserData);
        const superAdminData: CreateUserData = {
          ...validUserData,
          systemRole: SystemRole.SUPER_ADMIN(),
        };
        const superAdminUser = User.create(superAdminData);

        expect(regularUser.isAdmin()).toBe(false);
        expect(superAdminUser.isAdmin()).toBe(false);
      });
    });

    describe('isUser()', () => {
      it('should return true for USER role', () => {
        const user = User.create(validUserData);

        expect(user.isUser()).toBe(true);
        expect(user.isAdmin()).toBe(false);
        expect(user.isSuperAdmin()).toBe(false);
      });

      it('should return false for non-USER roles', () => {
        const adminData: CreateUserData = {
          ...validUserData,
          systemRole: SystemRole.ADMIN(),
        };
        const superAdminData: CreateUserData = {
          ...validUserData,
          systemRole: SystemRole.SUPER_ADMIN(),
        };
        const adminUser = User.create(adminData);
        const superAdminUser = User.create(superAdminData);

        expect(adminUser.isUser()).toBe(false);
        expect(superAdminUser.isUser()).toBe(false);
      });
    });

    describe('systemRole immutability', () => {
      it('should not allow systemRole to change after creation', () => {
        const user = User.create(validUserData);

        // systemRole is immutable - there's no method to change it
        expect(user.systemRole.getValue()).toBe('user');

        // Verify that operations don't change systemRole
        const verifiedUser = user.verifyEmail(new Date());
        expect(verifiedUser.systemRole.getValue()).toBe('user');
      });
    });
  });
});
