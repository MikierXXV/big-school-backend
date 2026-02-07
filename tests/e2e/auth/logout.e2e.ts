/**
 * ============================================
 * E2E TEST: User Logout
 * ============================================
 *
 * Tests End-to-End para el flujo de logout.
 */

import { test, expect } from '@playwright/test';
import { post, postWithAuth } from '../helpers/api.helper';
import { createLoggedInUser } from '../helpers/auth.helper';

test.describe('User Logout E2E', () => {
  test.describe('POST /auth/logout - Success Cases', () => {
    test('should logout successfully with valid token', async ({ request }) => {
      const { loginResult } = await createLoggedInUser(request);

      const response = await postWithAuth(
        request,
        '/auth/logout',
        {},
        loginResult.tokens.accessToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return success message on logout', async ({ request }) => {
      const { loginResult } = await createLoggedInUser(request);

      const response = await postWithAuth(
        request,
        '/auth/logout',
        {},
        loginResult.tokens.accessToken
      );

      expect(response.status).toBe(200);
      if (response.body.success) {
        const data = response.body.data as { message: string };
        expect(data.message).toContain('Logged out');
      }
    });
  });

  test.describe('POST /auth/logout - Unauthorized (401)', () => {
    test('should reject logout without token', async ({ request }) => {
      const response = await post(request, '/auth/logout', {});

      expect(response.status).toBe(401);
    });

    test('should reject logout with invalid token', async ({ request }) => {
      const response = await postWithAuth(
        request,
        '/auth/logout',
        {},
        'invalid.access.token'
      );

      expect(response.status).toBe(401);
    });
  });
});
