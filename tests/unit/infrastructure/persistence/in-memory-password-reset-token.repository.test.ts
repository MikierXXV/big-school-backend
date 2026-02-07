/**
 * ============================================
 * UNIT TEST: InMemoryPasswordResetTokenRepository
 * ============================================
 *
 * Tests unitarios para el repositorio en memoria
 * de tokens de recuperación de contraseña.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPasswordResetTokenRepository } from '../../../../src/infrastructure/persistence/in-memory/in-memory-password-reset-token.repository.js';
import {
  PasswordResetToken,
  PasswordResetTokenStatus,
} from '../../../../src/domain/value-objects/password-reset-token.value-object.js';
import { UserId } from '../../../../src/domain/value-objects/user-id.value-object.js';

describe('InMemoryPasswordResetTokenRepository', () => {
  let repository: InMemoryPasswordResetTokenRepository;

  // Test data
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testUserId2 = '223e4567-e89b-12d3-a456-426614174222';
  const testTokenId = '999e4567-e89b-12d3-a456-426614174999';
  const testTokenId2 = '888e4567-e89b-12d3-a456-426614174888';
  const testEmail = 'user@example.com';
  const testTokenValue = 'valid.jwt.token.value';
  const testTokenHash = 'hashed_token_value_sha256';
  const testNow = new Date('2024-01-15T10:00:00Z');
  const testExpiresAt = new Date('2024-01-15T10:30:00Z');

  const createTestToken = (
    tokenId = testTokenId,
    userId = testUserId,
    issuedAt = testNow,
    expiresAt = testExpiresAt
  ): PasswordResetToken => {
    return PasswordResetToken.createNew(
      testTokenValue,
      tokenId,
      userId,
      testEmail,
      issuedAt,
      expiresAt
    );
  };

  beforeEach(() => {
    repository = new InMemoryPasswordResetTokenRepository();
  });

  describe('save()', () => {
    it('should save a token correctly', async () => {
      const token = createTestToken();

      await repository.save(token, testTokenHash);

      const found = await repository.findById(testTokenId);
      expect(found).not.toBeNull();
      expect(found!.tokenId).toBe(testTokenId);
    });

    it('should save token with hash for lookup', async () => {
      const token = createTestToken();

      await repository.save(token, testTokenHash);

      const found = await repository.findByTokenHash(testTokenHash);
      expect(found).not.toBeNull();
      expect(found!.tokenId).toBe(testTokenId);
    });

    it('should save multiple tokens', async () => {
      const token1 = createTestToken(testTokenId, testUserId);
      const token2 = createTestToken(testTokenId2, testUserId2);

      await repository.save(token1, testTokenHash);
      await repository.save(token2, 'another_hash');

      expect(repository.count()).toBe(2);
    });
  });

  describe('findById()', () => {
    it('should find token by ID', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);

      const found = await repository.findById(testTokenId);

      expect(found).not.toBeNull();
      expect(found!.tokenId).toBe(testTokenId);
      expect(found!.userId).toBe(testUserId);
    });

    it('should return null if token not found', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByTokenHash()', () => {
    it('should find token by hash', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);

      const found = await repository.findByTokenHash(testTokenHash);

      expect(found).not.toBeNull();
      expect(found!.tokenId).toBe(testTokenId);
    });

    it('should return null if hash not found', async () => {
      const found = await repository.findByTokenHash('non-existent-hash');

      expect(found).toBeNull();
    });
  });

  describe('findActiveByUserId()', () => {
    it('should find active token for user', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);

      const userId = UserId.create(testUserId);
      const found = await repository.findActiveByUserId(userId);

      expect(found).not.toBeNull();
      expect(found!.tokenId).toBe(testTokenId);
    });

    it('should return null if no active token', async () => {
      const userId = UserId.create(testUserId);
      const found = await repository.findActiveByUserId(userId);

      expect(found).toBeNull();
    });

    it('should not return used token', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);
      await repository.markAsUsed(testTokenId, testNow);

      const userId = UserId.create(testUserId);
      const found = await repository.findActiveByUserId(userId);

      expect(found).toBeNull();
    });

    it('should not return revoked token', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);
      await repository.updateStatus(testTokenId, PasswordResetTokenStatus.REVOKED);

      const userId = UserId.create(testUserId);
      const found = await repository.findActiveByUserId(userId);

      expect(found).toBeNull();
    });
  });

  describe('markAsUsed()', () => {
    it('should mark token as used', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);

      const usedAt = new Date('2024-01-15T10:15:00Z');
      await repository.markAsUsed(testTokenId, usedAt);

      const found = await repository.findById(testTokenId);
      expect(found!.status).toBe(PasswordResetTokenStatus.USED);
      expect(found!.isUsed()).toBe(true);
    });

    it('should handle non-existent token gracefully', async () => {
      // Should not throw
      await expect(
        repository.markAsUsed('non-existent', testNow)
      ).resolves.not.toThrow();
    });
  });

  describe('updateStatus()', () => {
    it('should update token status to REVOKED', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);

      await repository.updateStatus(testTokenId, PasswordResetTokenStatus.REVOKED);

      const found = await repository.findById(testTokenId);
      expect(found!.status).toBe(PasswordResetTokenStatus.REVOKED);
    });

    it('should update token status to USED', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);

      await repository.updateStatus(testTokenId, PasswordResetTokenStatus.USED);

      const found = await repository.findById(testTokenId);
      expect(found!.status).toBe(PasswordResetTokenStatus.USED);
    });
  });

  describe('revokeAllByUser()', () => {
    it('should revoke all active tokens for user', async () => {
      const token1 = createTestToken(testTokenId, testUserId);
      const token2 = createTestToken(testTokenId2, testUserId);
      await repository.save(token1, testTokenHash);
      await repository.save(token2, 'another_hash');

      const userId = UserId.create(testUserId);
      const revokedAt = new Date('2024-01-15T10:20:00Z');
      const count = await repository.revokeAllByUser(userId, revokedAt);

      expect(count).toBe(2);

      const found1 = await repository.findById(testTokenId);
      const found2 = await repository.findById(testTokenId2);
      expect(found1!.status).toBe(PasswordResetTokenStatus.REVOKED);
      expect(found2!.status).toBe(PasswordResetTokenStatus.REVOKED);
    });

    it('should not revoke tokens of other users', async () => {
      const token1 = createTestToken(testTokenId, testUserId);
      const token2 = createTestToken(testTokenId2, testUserId2);
      await repository.save(token1, testTokenHash);
      await repository.save(token2, 'another_hash');

      const userId = UserId.create(testUserId);
      await repository.revokeAllByUser(userId, testNow);

      // Token of other user should remain active
      const found = await repository.findById(testTokenId2);
      expect(found!.status).toBe(PasswordResetTokenStatus.ACTIVE);
    });

    it('should not count already revoked tokens', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);
      await repository.updateStatus(testTokenId, PasswordResetTokenStatus.REVOKED);

      const userId = UserId.create(testUserId);
      const count = await repository.revokeAllByUser(userId, testNow);

      expect(count).toBe(0);
    });

    it('should return 0 if no tokens to revoke', async () => {
      const userId = UserId.create(testUserId);
      const count = await repository.revokeAllByUser(userId, testNow);

      expect(count).toBe(0);
    });
  });

  describe('deleteExpired()', () => {
    it('should delete expired tokens', async () => {
      const expiredToken = createTestToken(
        testTokenId,
        testUserId,
        new Date('2024-01-14T10:00:00Z'),
        new Date('2024-01-14T10:30:00Z') // Expired yesterday
      );
      await repository.save(expiredToken, testTokenHash);

      const deletedCount = await repository.deleteExpired(new Date('2024-01-15T00:00:00Z'));

      expect(deletedCount).toBe(1);
      expect(repository.count()).toBe(0);
    });

    it('should not delete non-expired tokens', async () => {
      const validToken = createTestToken(
        testTokenId,
        testUserId,
        new Date('2024-01-15T10:00:00Z'),
        new Date('2024-01-15T10:30:00Z') // Expires later today
      );
      await repository.save(validToken, testTokenHash);

      const deletedCount = await repository.deleteExpired(new Date('2024-01-15T09:00:00Z'));

      expect(deletedCount).toBe(0);
      expect(repository.count()).toBe(1);
    });

    it('should clean up hash index when deleting', async () => {
      const expiredToken = createTestToken(
        testTokenId,
        testUserId,
        new Date('2024-01-14T10:00:00Z'),
        new Date('2024-01-14T10:30:00Z')
      );
      await repository.save(expiredToken, testTokenHash);

      await repository.deleteExpired(new Date('2024-01-15T00:00:00Z'));

      const found = await repository.findByTokenHash(testTokenHash);
      expect(found).toBeNull();
    });
  });

  describe('hasActiveToken()', () => {
    it('should return true if user has active token', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);

      const userId = UserId.create(testUserId);
      const hasActive = await repository.hasActiveToken(userId);

      expect(hasActive).toBe(true);
    });

    it('should return false if user has no tokens', async () => {
      const userId = UserId.create(testUserId);
      const hasActive = await repository.hasActiveToken(userId);

      expect(hasActive).toBe(false);
    });

    it('should return false if all tokens are used', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);
      await repository.markAsUsed(testTokenId, testNow);

      const userId = UserId.create(testUserId);
      const hasActive = await repository.hasActiveToken(userId);

      expect(hasActive).toBe(false);
    });
  });

  describe('countRequestsSince()', () => {
    it('should count requests since given date', async () => {
      const token1 = createTestToken(testTokenId, testUserId, new Date('2024-01-15T09:00:00Z'));
      const token2 = createTestToken(testTokenId2, testUserId, new Date('2024-01-15T09:30:00Z'));
      await repository.save(token1, testTokenHash);
      await repository.save(token2, 'another_hash');

      const userId = UserId.create(testUserId);
      const count = await repository.countRequestsSince(userId, new Date('2024-01-15T08:00:00Z'));

      expect(count).toBe(2);
    });

    it('should not count requests before given date', async () => {
      const oldToken = createTestToken(testTokenId, testUserId, new Date('2024-01-14T10:00:00Z'));
      await repository.save(oldToken, testTokenHash);

      const userId = UserId.create(testUserId);
      const count = await repository.countRequestsSince(userId, new Date('2024-01-15T00:00:00Z'));

      expect(count).toBe(0);
    });

    it('should not count requests from other users', async () => {
      const token = createTestToken(testTokenId, testUserId2, testNow);
      await repository.save(token, testTokenHash);

      const userId = UserId.create(testUserId);
      const count = await repository.countRequestsSince(userId, new Date('2024-01-15T00:00:00Z'));

      expect(count).toBe(0);
    });
  });

  describe('Test helpers', () => {
    it('reset() should clear all tokens', async () => {
      const token = createTestToken();
      await repository.save(token, testTokenHash);

      repository.reset();

      expect(repository.count()).toBe(0);
      expect(await repository.findById(testTokenId)).toBeNull();
    });

    it('count() should return number of tokens', async () => {
      expect(repository.count()).toBe(0);

      await repository.save(createTestToken(testTokenId), testTokenHash);
      expect(repository.count()).toBe(1);

      await repository.save(createTestToken(testTokenId2), 'another_hash');
      expect(repository.count()).toBe(2);
    });
  });
});
