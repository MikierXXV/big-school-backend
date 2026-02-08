/**
 * ============================================
 * E2E TEST: Rate Limiting
 * ============================================
 *
 * Tests End-to-End para el rate limiting en endpoints de auth.
 *
 * IMPORTANT: These tests use a fixed IP via X-Forwarded-For to test
 * rate limiting behavior. Other tests use unique IPs to avoid conflicts.
 */

import { test, expect } from '@playwright/test';
import { post, generateUniqueIp } from '../helpers/api.helper';
import { generateValidUserData } from '../helpers/test-data.helper';

test.describe('Rate Limiting E2E', () => {
  test.describe('Auth Rate Limit Headers', () => {
    test('should include rate limit headers in response', async ({ request }) => {
      const userData = generateValidUserData();

      const response = await post(request, '/auth/register', userData);

      // Check rate limit headers
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    test('should decrement remaining count with each request', async ({ request }) => {
      // Use a unique fixed IP for this test to see the decrement
      const testIp = `192.168.100.${Math.floor(Math.random() * 255)}`;

      const userData1 = generateValidUserData();
      const userData2 = generateValidUserData();

      const response1 = await post(request, '/auth/register', userData1, { clientIp: testIp });
      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);

      const response2 = await post(request, '/auth/register', userData2, { clientIp: testIp });
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

      // Verify the header exists, is a number, and decrements
      expect(typeof remaining1).toBe('number');
      expect(typeof remaining2).toBe('number');
      expect(remaining2).toBeLessThan(remaining1);
    });
  });

  test.describe('Auth Endpoint Rate Limit', () => {
    test('should block requests when auth rate limit exceeded', async ({ request }) => {
      // Use a unique fixed IP for this test so all requests share the same rate limit bucket
      const testIp = generateUniqueIp();

      // The auth rate limit is 5 requests per minute
      // Make 7 rapid requests to exceed the limit
      const responses = [];

      for (let i = 0; i < 7; i++) {
        const userData = generateValidUserData();
        const response = await post(request, '/auth/register', userData, { clientIp: testIp });
        responses.push(response);
      }

      // At least one should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);

      // Verify rate limited response structure
      const limitedResponse = rateLimited[0];
      expect(limitedResponse.body.success).toBe(false);
      if (!limitedResponse.body.success) {
        expect(limitedResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(limitedResponse.body.error.retryAfter).toBeGreaterThan(0);
      }

      // Should include Retry-After header
      expect(limitedResponse.headers['retry-after']).toBeDefined();
    });

    test('should return 429 with proper error structure', async ({ request }) => {
      // Use a unique fixed IP for this test
      const testIp = generateUniqueIp();

      // Exhaust the rate limit (5 requests)
      for (let i = 0; i < 5; i++) {
        const userData = generateValidUserData();
        await post(request, '/auth/register', userData, { clientIp: testIp });
      }

      // 6th request should be rate limited
      const userData = generateValidUserData();
      const response = await post(request, '/auth/register', userData, { clientIp: testIp });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      if (!response.body.success) {
        expect(response.body.error).toEqual(
          expect.objectContaining({
            code: 'RATE_LIMIT_EXCEEDED',
            message: expect.any(String),
            retryAfter: expect.any(Number),
          })
        );
      }
    });
  });

  test.describe('Login Endpoint Rate Limit', () => {
    test('should rate limit login attempts', async ({ request }) => {
      // Use a unique fixed IP for this test
      const testIp = generateUniqueIp();

      // Make 7 login attempts with the same IP
      const responses = [];

      for (let i = 0; i < 7; i++) {
        const response = await post(request, '/auth/login', {
          email: `test${i}@example.com`,
          password: 'TestP@ssword123',
        }, { clientIp: testIp });
        responses.push(response);
      }

      // Check if any got rate limited
      const rateLimited = responses.filter(r => r.status === 429);

      // At least one should be rate limited after exceeding the limit
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  test.describe('Health Endpoint (No Auth Rate Limit)', () => {
    test('should only apply global rate limit to health endpoint', async ({ request }) => {
      // Health endpoint should only have global rate limit (100/15min)
      // Not the stricter auth rate limit (5/min)
      const responses = [];

      // Make 10 rapid requests - should all succeed under global limit
      for (let i = 0; i < 10; i++) {
        const response = await request.get('/health');
        responses.push({ status: response.status() });
      }

      // All should succeed (no 429s for just 10 requests)
      const successful = responses.filter(r => r.status === 200);
      expect(successful.length).toBe(10);
    });
  });
});
