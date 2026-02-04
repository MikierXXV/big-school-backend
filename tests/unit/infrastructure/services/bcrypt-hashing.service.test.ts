/**
 * ============================================
 * UNIT TEST: BcryptHashingService
 * ============================================
 *
 * Tests para el servicio de hashing con bcryptjs.
 */

import { describe, it, expect } from 'vitest';
import { BcryptHashingService } from '../../../../src/infrastructure/services/bcrypt-hashing.service.js';
import { PasswordHash } from '../../../../src/domain/value-objects/password-hash.value-object.js';

describe('BcryptHashingService', () => {
  // Use lower salt rounds for faster tests
  const service = new BcryptHashingService({ saltRounds: 4 });

  describe('hash()', () => {
    it('should return a PasswordHash value object', async () => {
      const password = 'MySecurePassword123!';

      const result = await service.hash(password);

      expect(result).toBeInstanceOf(PasswordHash);
      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('string');
    });

    it('should generate a valid bcrypt hash', async () => {
      const password = 'TestPassword456!';

      const result = await service.hash(password);

      // bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(result.value).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('should generate different hashes for same password (unique salt)', async () => {
      const password = 'SamePassword789!';

      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1.value).not.toBe(hash2.value);
    });

    it('should generate hash with correct salt rounds', async () => {
      const customService = new BcryptHashingService({ saltRounds: 6 });
      const password = 'TestPassword!';

      const result = await customService.hash(password);

      // Hash format: $2b$XX$... where XX is salt rounds (zero-padded)
      expect(result.value).toMatch(/^\$2[aby]\$06\$/);
    });
  });

  describe('verify()', () => {
    it('should return true for correct password', async () => {
      const password = 'CorrectPassword123!';
      const hash = await service.hash(password);

      const result = await service.verify(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await service.hash(password);

      const result = await service.verify(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('should return false for similar but not identical password', async () => {
      const password = 'MyPassword123!';
      const similarPassword = 'MyPassword123'; // Missing !
      const hash = await service.hash(password);

      const result = await service.verify(similarPassword, hash);

      expect(result).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const password = 'SomePassword!';
      const hash = await service.hash(password);

      const result = await service.verify('', hash);

      expect(result).toBe(false);
    });

    it('should work with existing hash from persistence', async () => {
      const password = 'PersistenceTest!';
      const hash = await service.hash(password);

      // Simulate loading hash from database
      const loadedHash = PasswordHash.fromHash(hash.value);

      const result = await service.verify(password, loadedHash);

      expect(result).toBe(true);
    });
  });

  describe('needsRehash()', () => {
    it('should return false when hash has same or higher rounds', async () => {
      const serviceWith10Rounds = new BcryptHashingService({ saltRounds: 10 });
      const password = 'TestPassword!';
      const hash = await serviceWith10Rounds.hash(password);

      // Same rounds
      expect(serviceWith10Rounds.needsRehash(hash)).toBe(false);

      // Lower configured rounds (current hash has MORE rounds)
      const serviceWith8Rounds = new BcryptHashingService({ saltRounds: 8 });
      expect(serviceWith8Rounds.needsRehash(hash)).toBe(false);
    });

    it('should return true when hash has fewer rounds than configured', async () => {
      const lowRoundsService = new BcryptHashingService({ saltRounds: 4 });
      const password = 'TestPassword!';
      const hash = await lowRoundsService.hash(password);

      // Higher configured rounds
      const highRoundsService = new BcryptHashingService({ saltRounds: 12 });

      expect(highRoundsService.needsRehash(hash)).toBe(true);
    });

    it('should return true for invalid hash format', () => {
      // Hash must be at least 50 chars to pass PasswordHash validation
      // but doesn't match bcrypt format
      const invalidHash = PasswordHash.fromHash(
        'not-a-valid-bcrypt-hash-but-long-enough-to-pass-validation-check'
      );

      expect(service.needsRehash(invalidHash)).toBe(true);
    });
  });

  describe('constructor', () => {
    it('should use default salt rounds (12) when not specified', () => {
      const defaultService = new BcryptHashingService();

      // We can't directly access private properties, but we can verify
      // by checking needsRehash behavior
      const hashWith12Rounds = PasswordHash.fromHash(
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2z6FMnXcHJqvKi'
      );

      expect(defaultService.needsRehash(hashWith12Rounds)).toBe(false);
    });

    it('should accept custom salt rounds', async () => {
      const customService = new BcryptHashingService({ saltRounds: 8 });
      const password = 'Test!';

      const hash = await customService.hash(password);

      // Verify it used 8 rounds
      expect(hash.value).toMatch(/^\$2[aby]\$08\$/);
    });
  });
});
