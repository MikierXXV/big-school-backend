/**
 * ============================================
 * E2E TEST: User Login
 * ============================================
 *
 * Tests End-to-End para el flujo de login.
 */

import { test, expect } from '@playwright/test';
import { post } from '../helpers/api.helper';
import { createVerifiedUser, registerUser } from '../helpers/auth.helper';
import { generateValidUserData } from '../helpers/test-data.helper';
import type { LoginResult } from '../types';

test.describe('User Login E2E', () => {
  test.describe('POST /auth/login - Success Cases', () => {
    test('should login with valid credentials', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      const response = await post<LoginResult>(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      if (response.body.success) {
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.tokens).toBeDefined();
      }
    });

    test('should return user data on login', async ({ request }) => {
      const { userData, user } = await createVerifiedUser(request);

      const response = await post<LoginResult>(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(200);
      if (response.body.success) {
        expect(response.body.data.user.id).toBe(user.id);
        expect(response.body.data.user.email).toBe(userData.email);
        expect(response.body.data.user.firstName).toBe(userData.firstName);
        expect(response.body.data.user.lastName).toBe(userData.lastName);
        expect(response.body.data.user.emailVerified).toBe(true);
      }
    });

    test('should return access token with correct structure', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      const response = await post<LoginResult>(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(200);
      if (response.body.success) {
        const tokens = response.body.data.tokens;
        expect(tokens.accessToken).toBeDefined();
        expect(tokens.tokenType).toBe('Bearer');
        expect(tokens.expiresIn).toBe(18000); // 5 hours
        expect(tokens.expiresAt).toBeDefined();
      }
    });

    test('should return refresh token with correct structure', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      const response = await post<LoginResult>(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(200);
      if (response.body.success) {
        const tokens = response.body.data.tokens;
        expect(tokens.refreshToken).toBeDefined();
        expect(tokens.refreshExpiresIn).toBe(259200); // 3 days
      }
    });

    test('should include device info in session if provided', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      const response = await post<LoginResult>(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
        deviceInfo: 'Chrome/Windows/Test',
      });

      expect(response.status).toBe(200);
    });
  });

  test.describe('POST /auth/login - Invalid Credentials (401)', () => {
    test('should reject invalid password', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      const response = await post(request, '/auth/login', {
        email: userData.email,
        password: 'WrongP@ssword123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('DOMAIN_INVALID_CREDENTIALS');
      }
    });

    test('should reject non-existent email', async ({ request }) => {
      const response = await post(request, '/auth/login', {
        email: 'nonexistent@example.com',
        password: 'SomeP@ssword123',
      });

      expect(response.status).toBe(401);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('DOMAIN_INVALID_CREDENTIALS');
      }
    });

    test('should not reveal whether email exists or password is wrong', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      // Wrong password
      const wrongPassword = await post(request, '/auth/login', {
        email: userData.email,
        password: 'WrongP@ss123',
      });

      // Non-existent email
      const wrongEmail = await post(request, '/auth/login', {
        email: 'nonexistent@example.com',
        password: userData.password,
      });

      // Both should have same error code and similar message
      if (!wrongPassword.body.success && !wrongEmail.body.success) {
        expect(wrongPassword.body.error.code).toBe(wrongEmail.body.error.code);
      }
    });
  });

  test.describe('POST /auth/login - Unverified User (401)', () => {
    test('should reject login for unverified user', async ({ request }) => {
      const { userData } = await registerUser(request);
      // Note: NOT verifying email

      const response = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(401);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('DOMAIN_INVALID_CREDENTIALS');
      }
    });
  });

  test.describe('POST /auth/login - Validation Errors (400)', () => {
    test('should validate required email', async ({ request }) => {
      const response = await post(request, '/auth/login', {
        password: 'SomeP@ss123',
      });

      expect(response.status).toBe(400);
    });

    test('should validate required password', async ({ request }) => {
      const userData = generateValidUserData();

      const response = await post(request, '/auth/login', {
        email: userData.email,
      });

      expect(response.status).toBe(400);
    });
  });
});
