/**
 * ============================================
 * UNIT TEST: RefreshToken Value Object
 * ============================================
 *
 * Tests unitarios para el Value Object RefreshToken.
 * Validan la creación, rotación, revocación y validación de tokens de refresco.
 */

import { describe, it, expect } from 'vitest';
import {
  RefreshToken,
  RefreshTokenStatus,
} from '../../../../src/domain/value-objects/refresh-token.value-object.js';

describe('RefreshToken Value Object', () => {
  // Datos de prueba
  const SAMPLE_TOKEN = 'refresh_token_abc123xyz789';
  const TOKEN_ID = 'token-id-001';
  const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
  const DEVICE_INFO = 'Chrome/Windows';

  describe('VALIDITY_SECONDS', () => {
    it('should be 259200 (3 days)', () => {
      expect(RefreshToken.VALIDITY_SECONDS).toBe(259200);
    });

    it('should have VALIDITY_MS equal to VALIDITY_SECONDS * 1000', () => {
      expect(RefreshToken.VALIDITY_MS).toBe(RefreshToken.VALIDITY_SECONDS * 1000);
    });
  });

  describe('createNew()', () => {
    it('should create a new RefreshToken with ACTIVE status', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-18T10:00:00Z');

      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        issuedAt,
        expiresAt,
        DEVICE_INFO
      );

      expect(token).toBeInstanceOf(RefreshToken);
      expect(token.value).toBe(SAMPLE_TOKEN);
      expect(token.tokenId).toBe(TOKEN_ID);
      expect(token.userId).toBe(USER_ID);
      expect(token.status).toBe(RefreshTokenStatus.ACTIVE);
      expect(token.parentTokenId).toBeNull();
      expect(token.deviceInfo).toBe(DEVICE_INFO);
    });

    it('should create a token without deviceInfo', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-18T10:00:00Z');

      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        issuedAt,
        expiresAt
      );

      expect(token.deviceInfo).toBeUndefined();
    });

    it('should throw error for empty token value', () => {
      const issuedAt = new Date();
      const expiresAt = new Date(Date.now() + 259200000);

      expect(() =>
        RefreshToken.createNew('', TOKEN_ID, USER_ID, issuedAt, expiresAt)
      ).toThrow();
    });
  });

  describe('createRotated()', () => {
    it('should create a rotated token with parent reference', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-18T10:00:00Z');

      const parentToken = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        issuedAt,
        expiresAt,
        DEVICE_INFO
      );

      const newIssuedAt = new Date('2024-01-16T10:00:00Z');
      const newExpiresAt = new Date('2024-01-19T10:00:00Z');

      const rotatedToken = RefreshToken.createRotated(
        'new_token_value',
        'token-id-002',
        parentToken,
        newIssuedAt,
        newExpiresAt
      );

      expect(rotatedToken.parentTokenId).toBe(TOKEN_ID);
      expect(rotatedToken.userId).toBe(USER_ID);
      expect(rotatedToken.deviceInfo).toBe(DEVICE_INFO);
      expect(rotatedToken.status).toBe(RefreshTokenStatus.ACTIVE);
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct a token from metadata', () => {
      const metadata = {
        tokenId: TOKEN_ID,
        userId: USER_ID,
        issuedAt: new Date('2024-01-15T10:00:00Z'),
        expiresAt: new Date('2024-01-18T10:00:00Z'),
        parentTokenId: null,
        status: RefreshTokenStatus.ROTATED,
        deviceInfo: DEVICE_INFO,
      };

      const token = RefreshToken.fromPersistence(SAMPLE_TOKEN, metadata);

      expect(token.status).toBe(RefreshTokenStatus.ROTATED);
      expect(token.tokenId).toBe(TOKEN_ID);
    });
  });

  describe('isActive()', () => {
    it('should return true when status is ACTIVE', () => {
      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        new Date(),
        new Date(Date.now() + 259200000)
      );

      expect(token.isActive()).toBe(true);
    });

    it('should return false when status is ROTATED', () => {
      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        new Date(),
        new Date(Date.now() + 259200000)
      );
      const rotatedToken = token.markAsRotated();

      expect(rotatedToken.isActive()).toBe(false);
    });

    it('should return false when status is REVOKED', () => {
      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        new Date(),
        new Date(Date.now() + 259200000)
      );
      const revokedToken = token.markAsRevoked();

      expect(revokedToken.isActive()).toBe(false);
    });
  });

  describe('isExpired()', () => {
    it('should return false when current date is before expiresAt', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-18T10:00:00Z');
      const currentDate = new Date('2024-01-16T10:00:00Z');

      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        issuedAt,
        expiresAt
      );

      expect(token.isExpired(currentDate)).toBe(false);
    });

    it('should return true when current date is after expiresAt', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-18T10:00:00Z');
      const currentDate = new Date('2024-01-19T10:00:00Z');

      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        issuedAt,
        expiresAt
      );

      expect(token.isExpired(currentDate)).toBe(true);
    });
  });

  describe('isValidForUse()', () => {
    it('should return true when active and not expired', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-18T10:00:00Z');
      const currentDate = new Date('2024-01-16T10:00:00Z');

      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        issuedAt,
        expiresAt
      );

      expect(token.isValidForUse(currentDate)).toBe(true);
    });

    it('should return false when expired', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-18T10:00:00Z');
      const currentDate = new Date('2024-01-19T10:00:00Z');

      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        issuedAt,
        expiresAt
      );

      expect(token.isValidForUse(currentDate)).toBe(false);
    });

    it('should return false when rotated', () => {
      const issuedAt = new Date('2024-01-15T10:00:00Z');
      const expiresAt = new Date('2024-01-18T10:00:00Z');
      const currentDate = new Date('2024-01-16T10:00:00Z');

      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        issuedAt,
        expiresAt
      );
      const rotatedToken = token.markAsRotated();

      expect(rotatedToken.isValidForUse(currentDate)).toBe(false);
    });
  });

  describe('markAsRotated()', () => {
    it('should return a new token with ROTATED status', () => {
      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        new Date(),
        new Date(Date.now() + 259200000)
      );

      const rotatedToken = token.markAsRotated();

      expect(rotatedToken.status).toBe(RefreshTokenStatus.ROTATED);
      expect(rotatedToken.tokenId).toBe(TOKEN_ID);
      expect(token.status).toBe(RefreshTokenStatus.ACTIVE); // Original unchanged
    });
  });

  describe('markAsRevoked()', () => {
    it('should return a new token with REVOKED status', () => {
      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        new Date(),
        new Date(Date.now() + 259200000)
      );

      const revokedToken = token.markAsRevoked();

      expect(revokedToken.status).toBe(RefreshTokenStatus.REVOKED);
      expect(revokedToken.tokenId).toBe(TOKEN_ID);
      expect(token.status).toBe(RefreshTokenStatus.ACTIVE); // Original unchanged
    });
  });

  describe('toString()', () => {
    it('should return a safe representation', () => {
      const token = RefreshToken.createNew(
        SAMPLE_TOKEN,
        TOKEN_ID,
        USER_ID,
        new Date(),
        new Date(Date.now() + 259200000)
      );

      const str = token.toString();

      expect(str).toContain('RefreshToken');
      expect(str).toContain(TOKEN_ID);
      expect(str).toContain('status');
      expect(str).not.toContain(SAMPLE_TOKEN);
    });
  });
});
