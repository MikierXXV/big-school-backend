/**
 * ============================================
 * E2E TEST: Password Reset
 * ============================================
 *
 * Tests End-to-End para recuperación de contraseña.
 *
 * FLUJOS:
 * - Solicitud de reset (POST /auth/password-reset)
 * - Confirmación de reset (POST /auth/password-reset/confirm)
 * - Flujo completo: solicitar → confirmar → login con nueva contraseña
 */

import { test, expect } from '@playwright/test';
import { post } from '../helpers/api.helper';
import { createVerifiedUser, loginUser } from '../helpers/auth.helper';
import { generateValidPassword } from '../helpers/test-data.helper';

test.describe('Password Reset E2E', () => {
  test.describe('POST /auth/password-reset - Request Reset', () => {
    test('should return 200 with generic message for existing email', async ({ request }) => {
      // Create a verified user first
      const { userData } = await createVerifiedUser(request);

      // Request password reset
      const response = await post(request, '/auth/password-reset', {
        email: userData.email,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      if (response.body.success) {
        const data = response.body.data as { message: string; resetToken?: string };
        expect(data.message).toContain('instructions');
        // In development mode, resetToken should be included
        expect(data.resetToken).toBeDefined();
      }
    });

    test('should return 200 with generic message for non-existent email', async ({ request }) => {
      // Request password reset for non-existent email
      const response = await post(request, '/auth/password-reset', {
        email: `nonexistent_${Date.now()}@example.com`,
      });

      // Should return same generic message (don't reveal if email exists)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      if (response.body.success) {
        const data = response.body.data as { message: string };
        expect(data.message).toContain('instructions');
      }
    });

    test('should reject invalid email format', async ({ request }) => {
      const response = await post(request, '/auth/password-reset', {
        email: 'not-an-email',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject empty email', async ({ request }) => {
      const response = await post(request, '/auth/password-reset', {
        email: '',
      });

      expect(response.status).toBe(400);
    });

    test('should reject missing email', async ({ request }) => {
      const response = await post(request, '/auth/password-reset', {});

      expect(response.status).toBe(400);
    });
  });

  test.describe('POST /auth/password-reset/confirm - Confirm Reset', () => {
    test('should reset password with valid token', async ({ request }) => {
      // Create a verified user
      const { userData } = await createVerifiedUser(request);

      // Request password reset to get token
      const resetResponse = await post(request, '/auth/password-reset', {
        email: userData.email,
      });

      expect(resetResponse.status).toBe(200);
      const resetData = (resetResponse.body as { data: { resetToken: string } }).data;
      const resetToken = resetData.resetToken;

      // Confirm password reset
      const newPassword = generateValidPassword();
      const confirmResponse = await post(request, '/auth/password-reset/confirm', {
        token: resetToken,
        newPassword,
        passwordConfirmation: newPassword,
      });

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.success).toBe(true);

      if (confirmResponse.body.success) {
        const data = confirmResponse.body.data as { message: string; user: { id: string; email: string } };
        expect(data.message).toContain('successfully');
        expect(data.user.email).toBe(userData.email);
      }
    });

    test('should allow login with new password after reset', async ({ request }) => {
      // Create a verified user
      const { userData } = await createVerifiedUser(request);

      // Request password reset
      const resetResponse = await post(request, '/auth/password-reset', {
        email: userData.email,
      });
      const resetToken = ((resetResponse.body as { data: { resetToken: string } }).data).resetToken;

      // Confirm password reset with new password
      const newPassword = generateValidPassword();
      await post(request, '/auth/password-reset/confirm', {
        token: resetToken,
        newPassword,
        passwordConfirmation: newPassword,
      });

      // Try to login with new password
      const loginResult = await loginUser(request, userData.email, newPassword);
      expect(loginResult.tokens.accessToken).toBeDefined();
      expect(loginResult.tokens.refreshToken).toBeDefined();
    });

    test('should reject login with old password after reset', async ({ request }) => {
      // Create a verified user
      const { userData } = await createVerifiedUser(request);

      // Request password reset
      const resetResponse = await post(request, '/auth/password-reset', {
        email: userData.email,
      });
      const resetToken = ((resetResponse.body as { data: { resetToken: string } }).data).resetToken;

      // Confirm password reset with new password
      const newPassword = generateValidPassword();
      await post(request, '/auth/password-reset/confirm', {
        token: resetToken,
        newPassword,
        passwordConfirmation: newPassword,
      });

      // Try to login with old password - should fail
      const loginResponse = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(loginResponse.status).toBe(401);
    });

    test('should reject invalid token', async ({ request }) => {
      const response = await post(request, '/auth/password-reset/confirm', {
        token: 'invalid.token.here',
        newPassword: 'NewP@ssword123',
        passwordConfirmation: 'NewP@ssword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject empty token', async ({ request }) => {
      const response = await post(request, '/auth/password-reset/confirm', {
        token: '',
        newPassword: 'NewP@ssword123',
        passwordConfirmation: 'NewP@ssword123',
      });

      expect(response.status).toBe(400);
    });

    test('should reject missing token', async ({ request }) => {
      const response = await post(request, '/auth/password-reset/confirm', {
        newPassword: 'NewP@ssword123',
        passwordConfirmation: 'NewP@ssword123',
      });

      expect(response.status).toBe(400);
    });

    test('should reject mismatched passwords', async ({ request }) => {
      // Create a verified user and get reset token
      const { userData } = await createVerifiedUser(request);
      const resetResponse = await post(request, '/auth/password-reset', {
        email: userData.email,
      });
      const resetToken = ((resetResponse.body as { data: { resetToken: string } }).data).resetToken;

      // Try to confirm with mismatched passwords
      const response = await post(request, '/auth/password-reset/confirm', {
        token: resetToken,
        newPassword: 'NewP@ssword123',
        passwordConfirmation: 'DifferentP@ss456',
      });

      expect(response.status).toBe(400);
    });

    test('should reject weak password (too short)', async ({ request }) => {
      // Create a verified user and get reset token
      const { userData } = await createVerifiedUser(request);
      const resetResponse = await post(request, '/auth/password-reset', {
        email: userData.email,
      });
      const resetToken = ((resetResponse.body as { data: { resetToken: string } }).data).resetToken;

      // Try to confirm with weak password
      const response = await post(request, '/auth/password-reset/confirm', {
        token: resetToken,
        newPassword: 'Sh0rt!',
        passwordConfirmation: 'Sh0rt!',
      });

      expect(response.status).toBe(400);
    });

    test('should reject already used token', async ({ request }) => {
      // Create a verified user and get reset token
      const { userData } = await createVerifiedUser(request);
      const resetResponse = await post(request, '/auth/password-reset', {
        email: userData.email,
      });
      const resetToken = ((resetResponse.body as { data: { resetToken: string } }).data).resetToken;

      // Use the token once
      const newPassword = generateValidPassword();
      const firstUse = await post(request, '/auth/password-reset/confirm', {
        token: resetToken,
        newPassword,
        passwordConfirmation: newPassword,
      });
      expect(firstUse.status).toBe(200);

      // Try to use the same token again
      const secondUse = await post(request, '/auth/password-reset/confirm', {
        token: resetToken,
        newPassword: 'AnotherP@ss789',
        passwordConfirmation: 'AnotherP@ss789',
      });

      expect(secondUse.status).toBe(400);
      if (!secondUse.body.success) {
        expect(secondUse.body.error.code).toBe('DOMAIN_PASSWORD_RESET_TOKEN_ALREADY_USED');
      }
    });
  });

  test.describe('Password Reset - Multiple Requests', () => {
    test('should invalidate previous token when new one is requested', async ({ request }) => {
      // Create a verified user
      const { userData } = await createVerifiedUser(request);

      // Request first token
      const firstResetResponse = await post(request, '/auth/password-reset', {
        email: userData.email,
      });
      const firstToken = ((firstResetResponse.body as { data: { resetToken: string } }).data).resetToken;

      // Request second token
      const secondResetResponse = await post(request, '/auth/password-reset', {
        email: userData.email,
      });
      const secondToken = ((secondResetResponse.body as { data: { resetToken: string } }).data).resetToken;

      // First token should be different from second (new token generated)
      expect(firstToken).not.toBe(secondToken);

      // Try to use first token - should fail (revoked)
      const firstTokenUse = await post(request, '/auth/password-reset/confirm', {
        token: firstToken,
        newPassword: 'NewP@ssword123',
        passwordConfirmation: 'NewP@ssword123',
      });
      expect(firstTokenUse.status).toBe(400);

      // Second token should work
      const secondTokenUse = await post(request, '/auth/password-reset/confirm', {
        token: secondToken,
        newPassword: 'NewP@ssword456',
        passwordConfirmation: 'NewP@ssword456',
      });
      expect(secondTokenUse.status).toBe(200);
    });
  });
});
