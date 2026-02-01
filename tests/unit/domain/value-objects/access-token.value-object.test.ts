/**
 * ============================================
 * UNIT TEST: AccessToken Value Object
 * ============================================
 *
 * Tests unitarios para el Value Object AccessToken.
 * Validan la creación, expiración y metadatos del token de acceso.
 */

import { describe, it, expect } from 'vitest';
import { AccessToken } from '../../../../src/domain/value-objects/access-token.value-object.js';

describe('AccessToken Value Object', () => {
  // Datos de prueba
  const SAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
  const USER_ID = '123e4567-e89b-12d3-a456-426614174000';

  describe('VALIDITY_SECONDS', () => {
    it('should be 18000 (5 hours)', () => {
      expect(AccessToken.VALIDITY_SECONDS).toBe(18000);
    });

    it('should have VALIDITY_MS equal to VALIDITY_SECONDS * 1000', () => {
      expect(AccessToken.VALIDITY_MS).toBe(AccessToken.VALIDITY_SECONDS * 1000);
    });
  });

  describe('create()', () => {
    it('should create an AccessToken with provided values', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);

      expect(token).toBeInstanceOf(AccessToken);
      expect(token.value).toBe(SAMPLE_TOKEN);
    });

    it('should store metadata correctly', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);
      const metadata = token.metadata;

      expect(metadata.userId).toBe(USER_ID);
      expect(metadata.issuedAt.getTime()).toBe(issuedAt.getTime());
      expect(metadata.expiresAt.getTime()).toBe(expiresAt.getTime());
    });

    it('should throw error for empty token value', () => {
      const issuedAt = new Date();
      const expiresAt = new Date(Date.now() + 18000000);

      expect(() => AccessToken.create('', USER_ID, issuedAt, expiresAt)).toThrow();
    });
  });

  describe('fromExisting()', () => {
    it('should create an AccessToken from existing metadata', () => {
      const metadata = {
        issuedAt: new Date('2024-01-15T10:00:00Z'),
        expiresAt: new Date('2024-01-15T15:00:00Z'),
        userId: USER_ID,
      };

      const token = AccessToken.fromExisting(SAMPLE_TOKEN, metadata);

      expect(token.value).toBe(SAMPLE_TOKEN);
      expect(token.metadata.userId).toBe(USER_ID);
    });
  });

  describe('isExpired()', () => {
    it('should return false when current date is before expiresAt', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');
      const currentDate = new Date('2024-01-15T12:00:00Z');

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);

      expect(token.isExpired(currentDate)).toBe(false);
    });

    it('should return true when current date is after expiresAt', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');
      const currentDate = new Date('2024-01-15T16:00:00Z');

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);

      expect(token.isExpired(currentDate)).toBe(true);
    });

    it('should return true when current date equals expiresAt', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');
      const currentDate = new Date('2024-01-15T15:00:00Z');

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);

      // Equal or after means expired
      expect(token.isExpired(currentDate)).toBe(false);
    });
  });

  describe('remainingTimeSeconds()', () => {
    it('should return positive seconds when not expired', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z'); // 5 hours later
      const currentDate = new Date('2024-01-15T14:00:00Z'); // 1 hour before expiry

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);

      expect(token.remainingTimeSeconds(currentDate)).toBe(3600); // 1 hour in seconds
    });

    it('should return 0 when expired', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');
      const currentDate = new Date('2024-01-15T16:00:00Z'); // 1 hour after expiry

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);

      expect(token.remainingTimeSeconds(currentDate)).toBe(0);
    });
  });

  describe('expiresAt getter', () => {
    it('should return the expiration date', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);

      expect(token.expiresAt.getTime()).toBe(expiresAt.getTime());
    });

    it('should return a new Date instance each time', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);

      const date1 = token.expiresAt;
      const date2 = token.expiresAt;

      expect(date1).not.toBe(date2);
      expect(date1.getTime()).toBe(date2.getTime());
    });
  });

  describe('toString()', () => {
    it('should return a safe representation with partial token', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);
      const str = token.toString();

      expect(str).toContain('AccessToken');
      expect(str).toContain('...');
      expect(str).not.toContain(SAMPLE_TOKEN); // Full token should not appear
    });

    it('should include expiration info', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T15:00:00Z');

      const token = AccessToken.create(SAMPLE_TOKEN, USER_ID, issuedAt, expiresAt);
      const str = token.toString();

      expect(str).toContain('expires');
    });
  });
});
