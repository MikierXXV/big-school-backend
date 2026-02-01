/**
 * ============================================
 * UNIT TEST: UserId Value Object
 * ============================================
 *
 * Tests unitarios para el Value Object UserId.
 * Validan la creación, validación y comparación de IDs de usuario.
 */

import { describe, it, expect } from 'vitest';
import { UserId } from '../../../../src/domain/value-objects/user-id.value-object.js';
import { InvalidUserIdError } from '../../../../src/domain/errors/user.errors.js';

describe('UserId Value Object', () => {
  // UUIDs válidos para tests
  const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
  const ANOTHER_VALID_UUID = '987fcdeb-51a2-3bc4-d567-890123456789';

  describe('create()', () => {
    it('should create a UserId with a valid UUID', () => {
      const userId = UserId.create(VALID_UUID);

      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toBe(VALID_UUID);
    });

    it('should throw InvalidUserIdError for empty string', () => {
      expect(() => UserId.create('')).toThrow(InvalidUserIdError);
    });

    it('should throw InvalidUserIdError for invalid UUID format', () => {
      expect(() => UserId.create('not-a-valid-uuid')).toThrow(InvalidUserIdError);
    });

    it('should throw InvalidUserIdError for UUID with invalid characters', () => {
      expect(() => UserId.create('123e4567-e89b-12d3-a456-42661417ZZZZ')).toThrow(InvalidUserIdError);
    });

    it('should throw InvalidUserIdError for UUID with wrong length', () => {
      expect(() => UserId.create('123e4567-e89b-12d3-a456')).toThrow(InvalidUserIdError);
    });
  });

  describe('fromGenerated()', () => {
    it('should create a UserId from a generated UUID', () => {
      const userId = UserId.fromGenerated(VALID_UUID);

      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toBe(VALID_UUID);
    });

    it('should throw InvalidUserIdError for invalid generated UUID', () => {
      expect(() => UserId.fromGenerated('invalid')).toThrow(InvalidUserIdError);
    });
  });

  describe('equals()', () => {
    it('should return true for UserIds with same value', () => {
      const userId1 = UserId.create(VALID_UUID);
      const userId2 = UserId.create(VALID_UUID);

      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should return false for UserIds with different values', () => {
      const userId1 = UserId.create(VALID_UUID);
      const userId2 = UserId.create(ANOTHER_VALID_UUID);

      expect(userId1.equals(userId2)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return the UUID string', () => {
      const userId = UserId.create(VALID_UUID);

      expect(userId.toString()).toBe(VALID_UUID);
    });
  });

  describe('value getter', () => {
    it('should return the internal UUID value', () => {
      const userId = UserId.create(VALID_UUID);

      expect(userId.value).toBe(VALID_UUID);
    });
  });
});
