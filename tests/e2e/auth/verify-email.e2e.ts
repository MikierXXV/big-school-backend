/**
 * ============================================
 * E2E TEST: Email Verification
 * ============================================
 *
 * Tests End-to-End para verificación de email.
 */

import { test, expect } from '@playwright/test';
import { post } from '../helpers/api.helper';
import { registerUser } from '../helpers/auth.helper';

test.describe('Email Verification E2E', () => {
  test.describe('POST /auth/verify-email - Success Cases', () => {
    test('should verify email with valid token', async ({ request }) => {
      const { registeredUser } = await registerUser(request);

      expect(registeredUser.verificationToken).toBeDefined();

      const response = await post(request, '/auth/verify-email', {
        token: registeredUser.verificationToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      if (response.body.success) {
        const data = response.body.data as { user: { status: string; emailVerifiedAt?: string } };
        expect(data.user.status).toBe('ACTIVE');
        expect(data.user.emailVerifiedAt).toBeDefined();
      }
    });

    test('should return user data after verification', async ({ request }) => {
      const { registeredUser } = await registerUser(request);

      const response = await post(request, '/auth/verify-email', {
        token: registeredUser.verificationToken,
      });

      expect(response.status).toBe(200);
      if (response.body.success) {
        const data = response.body.data as { user: { id: string; email: string } };
        expect(data.user.id).toBe(registeredUser.id);
        expect(data.user.email).toBe(registeredUser.email);
      }
    });
  });

  test.describe('POST /auth/verify-email - Invalid Token', () => {
    test('should reject invalid token', async ({ request }) => {
      const response = await post(request, '/auth/verify-email', {
        token: 'invalid.token.here',
      });

      // Server returns 400 for invalid tokens (validation layer catches it)
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject empty token', async ({ request }) => {
      const response = await post(request, '/auth/verify-email', {
        token: '',
      });

      expect(response.status).toBe(400);
    });

    test('should reject malformed token', async ({ request }) => {
      const response = await post(request, '/auth/verify-email', {
        token: 'not-a-jwt',
      });

      // Server returns 400 for malformed tokens
      expect(response.status).toBe(400);
    });
  });

  test.describe('POST /auth/verify-email - Already Verified', () => {
    test('should reject verification for already verified email', async ({ request }) => {
      const { registeredUser } = await registerUser(request);

      // First verification
      const first = await post(request, '/auth/verify-email', {
        token: registeredUser.verificationToken,
      });
      expect(first.status).toBe(200);

      // Second attempt - server returns 400 with DOMAIN_EMAIL_ALREADY_VERIFIED
      const second = await post(request, '/auth/verify-email', {
        token: registeredUser.verificationToken,
      });

      expect(second.status).toBe(400);
      if (!second.body.success) {
        expect(second.body.error.code).toBe('DOMAIN_EMAIL_ALREADY_VERIFIED');
      }
    });
  });
});
