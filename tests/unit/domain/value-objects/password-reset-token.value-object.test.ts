/**
 * ============================================
 * UNIT TEST: PasswordResetToken Value Object
 * ============================================
 *
 * Tests unitarios para el Value Object PasswordResetToken.
 * Validan la creación, expiración, uso único y estados del token.
 *
 * SEGURIDAD:
 * - Tokens expiran en 30 minutos
 * - Tokens son de un solo uso
 * - Tokens pueden ser revocados
 */

import { describe, it, expect } from 'vitest';
import {
  PasswordResetToken,
  PasswordResetTokenStatus,
} from '../../../../src/domain/value-objects/password-reset-token.value-object.js';

describe('PasswordResetToken Value Object', () => {
  // Test data
  const SAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwdXJwb3NlIjoicGFzc3dvcmRfcmVzZXQifQ';
  const TOKEN_ID = '123e4567-e89b-12d3-a456-426614174000';
  const USER_ID = '987e6543-e21b-12d3-a456-426614174999';
  const USER_EMAIL = 'user@example.com';

  describe('VALIDITY_SECONDS', () => {
    it('should be 1800 (30 minutes)', () => {
      expect(PasswordResetToken.VALIDITY_SECONDS).toBe(1800);
    });

    it('should have VALIDITY_MS equal to VALIDITY_SECONDS * 1000', () => {
      expect(PasswordResetToken.VALIDITY_MS).toBe(PasswordResetToken.VALIDITY_SECONDS * 1000);
    });
  });

  describe('createNew()', () => {
    it('should create a PasswordResetToken with valid data', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token).toBeInstanceOf(PasswordResetToken);
      expect(token.value).toBe(SAMPLE_TOKEN);
      expect(token.tokenId).toBe(TOKEN_ID);
      expect(token.userId).toBe(USER_ID);
      expect(token.email).toBe(USER_EMAIL);
    });

    it('should set status to ACTIVE on creation', () => {
      const issuedAt = new Date();
      const expiresAt = new Date(Date.now() + 1800000);

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token.status).toBe(PasswordResetTokenStatus.ACTIVE);
    });

    it('should not have usedAt or revokedAt on creation', () => {
      const issuedAt = new Date();
      const expiresAt = new Date(Date.now() + 1800000);

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token.usedAt).toBeNull();
      expect(token.revokedAt).toBeNull();
    });

    it('should throw error for empty token value', () => {
      const issuedAt = new Date();
      const expiresAt = new Date(Date.now() + 1800000);

      expect(() =>
        PasswordResetToken.createNew('', TOKEN_ID, USER_ID, USER_EMAIL, issuedAt, expiresAt)
      ).toThrow();
    });

    it('should throw error for empty token ID', () => {
      const issuedAt = new Date();
      const expiresAt = new Date(Date.now() + 1800000);

      expect(() =>
        PasswordResetToken.createNew(SAMPLE_TOKEN, '', USER_ID, USER_EMAIL, issuedAt, expiresAt)
      ).toThrow();
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct token from persistence data', () => {
      const metadata = {
        tokenId: TOKEN_ID,
        userId: USER_ID,
        email: USER_EMAIL,
        issuedAt: new Date('2024-01-15T10:00:00Z'),
        expiresAt: new Date('2024-01-15T10:30:00Z'),
        status: PasswordResetTokenStatus.ACTIVE,
        usedAt: null,
        revokedAt: null,
      };

      const token = PasswordResetToken.fromPersistence(SAMPLE_TOKEN, metadata);

      expect(token.value).toBe(SAMPLE_TOKEN);
      expect(token.tokenId).toBe(TOKEN_ID);
      expect(token.status).toBe(PasswordResetTokenStatus.ACTIVE);
    });

    it('should reconstruct used token correctly', () => {
      const usedAt = new Date('2024-01-15T10:15:00Z');
      const metadata = {
        tokenId: TOKEN_ID,
        userId: USER_ID,
        email: USER_EMAIL,
        issuedAt: new Date('2024-01-15T10:00:00Z'),
        expiresAt: new Date('2024-01-15T10:30:00Z'),
        status: PasswordResetTokenStatus.USED,
        usedAt,
        revokedAt: null,
      };

      const token = PasswordResetToken.fromPersistence(SAMPLE_TOKEN, metadata);

      expect(token.status).toBe(PasswordResetTokenStatus.USED);
      expect(token.usedAt?.getTime()).toBe(usedAt.getTime());
    });
  });

  describe('isExpired()', () => {
    it('should return false when current date is before expiresAt', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const currentDate = new Date('2024-01-15T10:15:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token.isExpired(currentDate)).toBe(false);
    });

    it('should return true when current date is after expiresAt', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const currentDate = new Date('2024-01-15T11:00:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token.isExpired(currentDate)).toBe(true);
    });

    it('should return true when current date equals expiresAt (boundary)', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const currentDate = new Date('2024-01-15T10:30:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      // At expiration time, consider it expired (strict boundary)
      expect(token.isExpired(currentDate)).toBe(true);
    });
  });

  describe('isUsed()', () => {
    it('should return false for new token', () => {
      const issuedAt = new Date();
      const expiresAt = new Date(Date.now() + 1800000);

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token.isUsed()).toBe(false);
    });

    it('should return true for token with USED status', () => {
      const metadata = {
        tokenId: TOKEN_ID,
        userId: USER_ID,
        email: USER_EMAIL,
        issuedAt: new Date('2024-01-15T10:00:00Z'),
        expiresAt: new Date('2024-01-15T10:30:00Z'),
        status: PasswordResetTokenStatus.USED,
        usedAt: new Date('2024-01-15T10:15:00Z'),
        revokedAt: null,
      };

      const token = PasswordResetToken.fromPersistence(SAMPLE_TOKEN, metadata);

      expect(token.isUsed()).toBe(true);
    });
  });

  describe('isRevoked()', () => {
    it('should return false for new token', () => {
      const issuedAt = new Date();
      const expiresAt = new Date(Date.now() + 1800000);

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token.isRevoked()).toBe(false);
    });

    it('should return true for token with REVOKED status', () => {
      const metadata = {
        tokenId: TOKEN_ID,
        userId: USER_ID,
        email: USER_EMAIL,
        issuedAt: new Date('2024-01-15T10:00:00Z'),
        expiresAt: new Date('2024-01-15T10:30:00Z'),
        status: PasswordResetTokenStatus.REVOKED,
        usedAt: null,
        revokedAt: new Date('2024-01-15T10:10:00Z'),
      };

      const token = PasswordResetToken.fromPersistence(SAMPLE_TOKEN, metadata);

      expect(token.isRevoked()).toBe(true);
    });
  });

  describe('isValidForUse()', () => {
    it('should return true for active, non-expired, unused token', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const currentDate = new Date('2024-01-15T10:15:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token.isValidForUse(currentDate)).toBe(true);
    });

    it('should return false for expired token', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const currentDate = new Date('2024-01-15T11:00:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token.isValidForUse(currentDate)).toBe(false);
    });

    it('should return false for used token', () => {
      const metadata = {
        tokenId: TOKEN_ID,
        userId: USER_ID,
        email: USER_EMAIL,
        issuedAt: new Date('2024-01-15T10:00:00Z'),
        expiresAt: new Date('2024-01-15T10:30:00Z'),
        status: PasswordResetTokenStatus.USED,
        usedAt: new Date('2024-01-15T10:15:00Z'),
        revokedAt: null,
      };
      const currentDate = new Date('2024-01-15T10:20:00Z');

      const token = PasswordResetToken.fromPersistence(SAMPLE_TOKEN, metadata);

      expect(token.isValidForUse(currentDate)).toBe(false);
    });

    it('should return false for revoked token', () => {
      const metadata = {
        tokenId: TOKEN_ID,
        userId: USER_ID,
        email: USER_EMAIL,
        issuedAt: new Date('2024-01-15T10:00:00Z'),
        expiresAt: new Date('2024-01-15T10:30:00Z'),
        status: PasswordResetTokenStatus.REVOKED,
        usedAt: null,
        revokedAt: new Date('2024-01-15T10:10:00Z'),
      };
      const currentDate = new Date('2024-01-15T10:15:00Z');

      const token = PasswordResetToken.fromPersistence(SAMPLE_TOKEN, metadata);

      expect(token.isValidForUse(currentDate)).toBe(false);
    });
  });

  describe('markAsUsed()', () => {
    it('should create a new token with USED status', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const usedAt = new Date('2024-01-15T10:15:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      const usedToken = token.markAsUsed(usedAt);

      expect(usedToken.status).toBe(PasswordResetTokenStatus.USED);
      expect(usedToken.usedAt?.getTime()).toBe(usedAt.getTime());
    });

    it('should not modify the original token (immutability)', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const usedAt = new Date('2024-01-15T10:15:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      token.markAsUsed(usedAt);

      // Original token should remain unchanged
      expect(token.status).toBe(PasswordResetTokenStatus.ACTIVE);
      expect(token.usedAt).toBeNull();
    });

    it('should preserve other metadata when marking as used', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const usedAt = new Date('2024-01-15T10:15:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      const usedToken = token.markAsUsed(usedAt);

      expect(usedToken.value).toBe(SAMPLE_TOKEN);
      expect(usedToken.tokenId).toBe(TOKEN_ID);
      expect(usedToken.userId).toBe(USER_ID);
      expect(usedToken.email).toBe(USER_EMAIL);
    });
  });

  describe('markAsRevoked()', () => {
    it('should create a new token with REVOKED status', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const revokedAt = new Date('2024-01-15T10:10:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      const revokedToken = token.markAsRevoked(revokedAt);

      expect(revokedToken.status).toBe(PasswordResetTokenStatus.REVOKED);
      expect(revokedToken.revokedAt?.getTime()).toBe(revokedAt.getTime());
    });

    it('should not modify the original token (immutability)', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');
      const revokedAt = new Date('2024-01-15T10:10:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      token.markAsRevoked(revokedAt);

      // Original token should remain unchanged
      expect(token.status).toBe(PasswordResetTokenStatus.ACTIVE);
      expect(token.revokedAt).toBeNull();
    });
  });

  describe('expiresAt getter', () => {
    it('should return the expiration date', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      expect(token.expiresAt.getTime()).toBe(expiresAt.getTime());
    });

    it('should return a new Date instance each time (defensive copy)', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );

      const date1 = token.expiresAt;
      const date2 = token.expiresAt;

      expect(date1).not.toBe(date2);
      expect(date1.getTime()).toBe(date2.getTime());
    });
  });

  describe('toString()', () => {
    it('should return a safe representation without full token', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );
      const str = token.toString();

      expect(str).toContain('PasswordResetToken');
      expect(str).toContain(TOKEN_ID);
      expect(str).not.toContain(SAMPLE_TOKEN); // Full token should not appear
    });

    it('should include status in string representation', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-15T10:30:00Z');

      const token = PasswordResetToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        USER_EMAIL,
        issuedAt,
        expiresAt
      );
      const str = token.toString();

      expect(str).toContain('ACTIVE');
    });
  });
});
