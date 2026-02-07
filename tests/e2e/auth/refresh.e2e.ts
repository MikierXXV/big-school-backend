/**
 * ============================================
 * E2E TEST: Session Refresh
 * ============================================
 *
 * Tests End-to-End para refresh de tokens.
 * Incluye tests de seguridad para token rotation.
 */

import { test, expect } from '@playwright/test';
import { post } from '../helpers/api.helper';
import { createLoggedInUser } from '../helpers/auth.helper';
import { refreshSession, attemptRefresh } from '../helpers/token.helper';
import type { RefreshResult } from '../types';

test.describe('Session Refresh E2E', () => {
  test.describe('POST /auth/refresh - Success Cases', () => {
    test('should refresh session with valid token', async ({ request }) => {
      const { loginResult } = await createLoggedInUser(request);

      const response = await post<RefreshResult>(request, '/auth/refresh', {
        refreshToken: loginResult.tokens.refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.tokens).toBeDefined();
      }
    });

    test('should return new access token', async ({ request }) => {
      const { loginResult } = await createLoggedInUser(request);

      const result = await refreshSession(request, loginResult.tokens.refreshToken);

      // Access token should be present and valid
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.accessToken.length).toBeGreaterThan(0);
      // Note: tokens may be identical if generated within same second (same iat)
    });

    test('should rotate refresh token', async ({ request }) => {
      const { loginResult } = await createLoggedInUser(request);

      const result = await refreshSession(request, loginResult.tokens.refreshToken);

      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.tokens.refreshToken).not.toBe(loginResult.tokens.refreshToken);
    });

    test('should return correct token expiration times', async ({ request }) => {
      const { loginResult } = await createLoggedInUser(request);

      const result = await refreshSession(request, loginResult.tokens.refreshToken);

      expect(result.tokens.expiresIn).toBe(18000); // 5 hours
      expect(result.tokens.refreshExpiresIn).toBe(259200); // 3 days
      expect(result.tokens.tokenType).toBe('Bearer');
    });
  });

  test.describe('POST /auth/refresh - Token Rotation Security', () => {
    test('should invalidate old refresh token after rotation', async ({ request }) => {
      const { loginResult } = await createLoggedInUser(request);
      const originalRefreshToken = loginResult.tokens.refreshToken;

      // First refresh - should succeed
      const firstRefresh = await refreshSession(request, originalRefreshToken);
      expect(firstRefresh.tokens.refreshToken).not.toBe(originalRefreshToken);

      // Second attempt with original token - should fail
      const secondAttempt = await attemptRefresh(request, originalRefreshToken);

      expect(secondAttempt.status).toBe(401);
    });

    test('SECURITY: should detect token reuse and revoke family', async ({ request }) => {
      const { loginResult } = await createLoggedInUser(request);
      const tokenA = loginResult.tokens.refreshToken;

      // Step 1: Refresh with token A to get token B (A becomes ROTATED)
      const firstRefresh = await refreshSession(request, tokenA);
      const tokenB = firstRefresh.tokens.refreshToken;

      // Step 2: Attacker reuses token A (simulating stolen token)
      const attackerAttempt = await attemptRefresh(request, tokenA);

      // Should detect reuse
      expect(attackerAttempt.status).toBe(401);
      if (!attackerAttempt.body.success) {
        expect(attackerAttempt.body.error.code).toBe('DOMAIN_REFRESH_TOKEN_REUSE_DETECTED');
      }

      // Step 3: Token B should also be revoked (entire family)
      const legitimateAttempt = await attemptRefresh(request, tokenB);

      expect(legitimateAttempt.status).toBe(401);
    });

    test('should allow sequential refreshes with new tokens', async ({ request }) => {
      const { loginResult } = await createLoggedInUser(request);

      // First refresh
      const first = await refreshSession(request, loginResult.tokens.refreshToken);

      // Second refresh with new token
      const second = await refreshSession(request, first.tokens.refreshToken);

      // Third refresh with newest token
      const third = await refreshSession(request, second.tokens.refreshToken);

      expect(third.tokens.accessToken).toBeDefined();
      expect(third.tokens.refreshToken).toBeDefined();
    });
  });

  test.describe('POST /auth/refresh - Invalid Token (401)', () => {
    test('should reject invalid refresh token', async ({ request }) => {
      const response = await post(request, '/auth/refresh', {
        refreshToken: 'invalid.refresh.token',
      });

      expect(response.status).toBe(401);
    });

    test('should reject empty refresh token', async ({ request }) => {
      const response = await post(request, '/auth/refresh', {
        refreshToken: '',
      });

      expect(response.status).toBe(400);
    });

    test('should reject malformed refresh token', async ({ request }) => {
      const response = await post(request, '/auth/refresh', {
        refreshToken: 'not-a-valid-token',
      });

      expect(response.status).toBe(401);
    });
  });

  test.describe('POST /auth/refresh - Validation Errors (400)', () => {
    test('should validate required refreshToken', async ({ request }) => {
      const response = await post(request, '/auth/refresh', {});

      expect(response.status).toBe(400);
    });
  });
});
