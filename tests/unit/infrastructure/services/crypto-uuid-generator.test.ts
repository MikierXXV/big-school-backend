/**
 * ============================================
 * UNIT TEST: CryptoUuidGenerator Service
 * ============================================
 *
 * Tests para el generador de UUIDs usando crypto.
 */

import { describe, it, expect } from 'vitest';
import { CryptoUuidGenerator } from '../../../../src/infrastructure/services/crypto-uuid-generator.service.js';

describe('CryptoUuidGenerator', () => {
  const generator = new CryptoUuidGenerator();

  describe('generate()', () => {
    it('should return a valid UUID v4 string', () => {
      const uuid = generator.generate();

      expect(uuid).toBeDefined();
      expect(typeof uuid).toBe('string');
      expect(generator.isValid(uuid)).toBe(true);
    });

    it('should return a UUID in correct format', () => {
      const uuid = generator.generate();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidV4Regex);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        uuids.add(generator.generate());
      }

      // All generated UUIDs should be unique
      expect(uuids.size).toBe(iterations);
    });

    it('should generate UUIDs with version 4 indicator', () => {
      const uuid = generator.generate();
      const parts = uuid.split('-');

      // Third part should start with '4' (version 4)
      expect(parts[2][0]).toBe('4');
    });

    it('should generate UUIDs with correct variant bits', () => {
      const uuid = generator.generate();
      const parts = uuid.split('-');

      // Fourth part should start with 8, 9, a, or b (variant 1)
      expect(parts[3][0]).toMatch(/[89ab]/i);
    });
  });

  describe('isValid()', () => {
    it('should return true for valid UUID v4', () => {
      // UUID v4 has '4' in version position and 8/9/a/b in variant position
      const validUuid = '123e4567-e89b-42d3-a456-426614174000';
      expect(generator.isValid(validUuid)).toBe(true);
    });

    it('should return true for generated UUIDs', () => {
      const uuid = generator.generate();
      expect(generator.isValid(uuid)).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      expect(generator.isValid('invalid-uuid')).toBe(false);
      expect(generator.isValid('')).toBe(false);
      expect(generator.isValid('123')).toBe(false);
    });

    it('should return false for UUID with wrong version', () => {
      // Version 1 UUID (has 1 instead of 4 in version position)
      const v1Uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(generator.isValid(v1Uuid)).toBe(false);

      // Invalid character in version position
      expect(generator.isValid('123e4567-e89b-X2d3-a456-426614174000')).toBe(false);
    });

    it('should be case insensitive', () => {
      const lowercase = '123e4567-e89b-42d3-a456-426614174000';
      const uppercase = '123E4567-E89B-42D3-A456-426614174000';
      const mixed = '123e4567-E89B-42d3-A456-426614174000';

      expect(generator.isValid(lowercase)).toBe(true);
      expect(generator.isValid(uppercase)).toBe(true);
      expect(generator.isValid(mixed)).toBe(true);
    });
  });
});
