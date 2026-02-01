/**
 * ============================================
 * UNIT TEST: PasswordHash Value Object
 * ============================================
 *
 * Tests unitarios para el Value Object PasswordHash.
 * Validan la creación y encapsulación segura de hashes de contraseña.
 */

import { describe, it, expect } from 'vitest';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';
import { InvalidPasswordHashError } from '../../../../src/domain/errors/user.errors.js';

describe('PasswordHash Value Object', () => {
  // Hash bcrypt válido de ejemplo (60 caracteres)
  const VALID_BCRYPT_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';
  const ANOTHER_VALID_HASH = '$2b$12$abcdefghijklmnopqrstuuOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi';

  describe('fromHash()', () => {
    it('should create a PasswordHash from a valid hash', () => {
      const passwordHash = PasswordHash.fromHash(VALID_BCRYPT_HASH);

      expect(passwordHash).toBeInstanceOf(PasswordHash);
      expect(passwordHash.value).toBe(VALID_BCRYPT_HASH);
    });

    it('should throw InvalidPasswordHashError for empty string', () => {
      expect(() => PasswordHash.fromHash('')).toThrow(InvalidPasswordHashError);
    });

    it('should throw InvalidPasswordHashError for hash below minimum length', () => {
      const shortHash = 'tooshort';
      expect(() => PasswordHash.fromHash(shortHash)).toThrow(InvalidPasswordHashError);
    });
  });

  describe('fromNewlyHashed()', () => {
    it('should create a PasswordHash from a newly generated hash', () => {
      const passwordHash = PasswordHash.fromNewlyHashed(VALID_BCRYPT_HASH);

      expect(passwordHash).toBeInstanceOf(PasswordHash);
      expect(passwordHash.value).toBe(VALID_BCRYPT_HASH);
    });

    it('should throw InvalidPasswordHashError for invalid hash', () => {
      expect(() => PasswordHash.fromNewlyHashed('')).toThrow(InvalidPasswordHashError);
    });
  });

  describe('value getter', () => {
    it('should return the hash value', () => {
      const passwordHash = PasswordHash.fromHash(VALID_BCRYPT_HASH);

      expect(passwordHash.value).toBe(VALID_BCRYPT_HASH);
    });
  });

  describe('equals()', () => {
    it('should return true for PasswordHashes with same value', () => {
      const hash1 = PasswordHash.fromHash(VALID_BCRYPT_HASH);
      const hash2 = PasswordHash.fromHash(VALID_BCRYPT_HASH);

      expect(hash1.equals(hash2)).toBe(true);
    });

    it('should return false for PasswordHashes with different values', () => {
      const hash1 = PasswordHash.fromHash(VALID_BCRYPT_HASH);
      const hash2 = PasswordHash.fromHash(ANOTHER_VALID_HASH);

      expect(hash1.equals(hash2)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return protected string, not the actual hash', () => {
      const passwordHash = PasswordHash.fromHash(VALID_BCRYPT_HASH);

      expect(passwordHash.toString()).toBe('[PROTECTED_HASH]');
      expect(passwordHash.toString()).not.toContain(VALID_BCRYPT_HASH);
    });
  });

  describe('MIN_HASH_LENGTH', () => {
    it('should have MIN_HASH_LENGTH of 50', () => {
      expect(PasswordHash.MIN_HASH_LENGTH).toBe(50);
    });
  });
});
