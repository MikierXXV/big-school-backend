/**
 * ============================================
 * UNIT TEST: InMemoryRateLimiter
 * ============================================
 *
 * Tests unitarios para el servicio de rate limiting en memoria.
 *
 * CASOS TESTEADOS:
 * - Verificar límites dentro del rango
 * - Bloquear cuando se excede el límite
 * - Expiración de ventanas
 * - Reset de contadores
 * - Cleanup de entries expiradas
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InMemoryRateLimiter } from '../../../../src/infrastructure/services/in-memory-rate-limiter.service.js';

describe('InMemoryRateLimiter', () => {
  let rateLimiter: InMemoryRateLimiter;

  const TEST_KEY = 'test-key-127.0.0.1';
  const LIMIT = 5;
  const WINDOW_MS = 60000; // 1 minute

  beforeEach(() => {
    rateLimiter = new InMemoryRateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('check()', () => {
    it('should allow first request', async () => {
      const result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(LIMIT - 1);
      expect(result.retryAfterMs).toBe(0);
      expect(result.total).toBe(LIMIT);
    });

    it('should return correct remaining count', async () => {
      // Increment a few times
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);

      const result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(LIMIT - 3 - 1); // 5 - 3 - 1 = 1
    });

    it('should block when limit is exceeded', async () => {
      // Exhaust the limit
      for (let i = 0; i < LIMIT; i++) {
        await rateLimiter.increment(TEST_KEY, WINDOW_MS);
      }

      const result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('should allow requests after window expires', async () => {
      // Exhaust the limit
      for (let i = 0; i < LIMIT; i++) {
        await rateLimiter.increment(TEST_KEY, WINDOW_MS);
      }

      // Verify blocked
      let result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);
      expect(result.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(WINDOW_MS + 1);

      // Should be allowed now
      result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(LIMIT - 1);
    });

    it('should track different keys independently', async () => {
      const key1 = 'user:1';
      const key2 = 'user:2';

      // Exhaust limit for key1
      for (let i = 0; i < LIMIT; i++) {
        await rateLimiter.increment(key1, WINDOW_MS);
      }

      // key1 should be blocked
      const result1 = await rateLimiter.check(key1, LIMIT, WINDOW_MS);
      expect(result1.allowed).toBe(false);

      // key2 should still be allowed
      const result2 = await rateLimiter.check(key2, LIMIT, WINDOW_MS);
      expect(result2.allowed).toBe(true);
    });

    it('should include resetAt timestamp', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);

      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.resetAt.getTime()).toBe(now + WINDOW_MS);
    });
  });

  describe('increment()', () => {
    it('should create new entry for unknown key', async () => {
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);

      const result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);
      expect(result.remaining).toBe(LIMIT - 1 - 1); // 1 from increment, 1 from check
    });

    it('should increment existing entry', async () => {
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);

      const result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);
      expect(result.remaining).toBe(LIMIT - 3 - 1);
    });

    it('should reset entry after window expires', async () => {
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);

      // Advance time past the window
      vi.advanceTimersByTime(WINDOW_MS + 1);

      // Increment should start fresh
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);

      const result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);
      expect(result.remaining).toBe(LIMIT - 1 - 1); // Only 1 increment, not 3
    });
  });

  describe('reset()', () => {
    it('should clear the counter for a key', async () => {
      // Add some requests
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);
      await rateLimiter.increment(TEST_KEY, WINDOW_MS);

      // Reset
      await rateLimiter.reset(TEST_KEY);

      // Should be back to full limit
      const result = await rateLimiter.check(TEST_KEY, LIMIT, WINDOW_MS);
      expect(result.remaining).toBe(LIMIT - 1);
    });

    it('should not affect other keys', async () => {
      const key1 = 'user:1';
      const key2 = 'user:2';

      await rateLimiter.increment(key1, WINDOW_MS);
      await rateLimiter.increment(key1, WINDOW_MS);
      await rateLimiter.increment(key2, WINDOW_MS);

      // Reset only key1
      await rateLimiter.reset(key1);

      // key1 should be reset
      const result1 = await rateLimiter.check(key1, LIMIT, WINDOW_MS);
      expect(result1.remaining).toBe(LIMIT - 1);

      // key2 should still have its count
      const result2 = await rateLimiter.check(key2, LIMIT, WINDOW_MS);
      expect(result2.remaining).toBe(LIMIT - 1 - 1);
    });

    it('should handle reset for non-existent key', async () => {
      // Should not throw
      await expect(rateLimiter.reset('non-existent-key')).resolves.toBeUndefined();
    });
  });

  describe('cleanup()', () => {
    it('should remove expired entries', async () => {
      await rateLimiter.increment('key1', 1000);
      await rateLimiter.increment('key2', 5000);

      // Advance time to expire key1 but not key2
      vi.advanceTimersByTime(2000);

      await rateLimiter.cleanup();

      // key1 should be cleaned (expired), key2 should remain
      expect(rateLimiter.getActiveEntriesCount()).toBe(1);
    });

    it('should keep non-expired entries', async () => {
      await rateLimiter.increment('key1', WINDOW_MS);
      await rateLimiter.increment('key2', WINDOW_MS);

      await rateLimiter.cleanup();

      expect(rateLimiter.getActiveEntriesCount()).toBe(2);
    });
  });

  describe('getActiveEntriesCount()', () => {
    it('should return 0 for empty store', () => {
      expect(rateLimiter.getActiveEntriesCount()).toBe(0);
    });

    it('should return correct count', async () => {
      await rateLimiter.increment('key1', WINDOW_MS);
      await rateLimiter.increment('key2', WINDOW_MS);
      await rateLimiter.increment('key3', WINDOW_MS);

      expect(rateLimiter.getActiveEntriesCount()).toBe(3);
    });

    it('should not count expired entries', async () => {
      await rateLimiter.increment('key1', 1000);
      await rateLimiter.increment('key2', 5000);

      vi.advanceTimersByTime(2000);

      expect(rateLimiter.getActiveEntriesCount()).toBe(1);
    });
  });

  describe('clear()', () => {
    it('should remove all entries', async () => {
      await rateLimiter.increment('key1', WINDOW_MS);
      await rateLimiter.increment('key2', WINDOW_MS);
      await rateLimiter.increment('key3', WINDOW_MS);

      rateLimiter.clear();

      expect(rateLimiter.getActiveEntriesCount()).toBe(0);
    });
  });
});
