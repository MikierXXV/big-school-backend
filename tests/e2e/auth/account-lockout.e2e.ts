/**
 * ============================================
 * E2E TEST: Account Lockout
 * ============================================
 *
 * Tests End-to-End para el bloqueo de cuentas
 * después de múltiples intentos fallidos de login.
 */

import { test, expect } from '@playwright/test';
import { post } from '../helpers/api.helper';
import { createVerifiedUser } from '../helpers/auth.helper';
import type { LoginResult } from '../types';

test.describe('Account Lockout E2E', () => {
  test.describe('Failed Login Attempts', () => {
    test('should allow login after 4 failed attempts', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      // Make 4 failed login attempts
      for (let i = 0; i < 4; i++) {
        await post(request, '/auth/login', {
          email: userData.email,
          password: 'WrongP@ssword123',
        });
      }

      // 5th attempt with correct password should succeed
      const response = await post<LoginResult>(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should lock account after 5 failed attempts', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await post(request, '/auth/login', {
          email: userData.email,
          password: 'WrongP@ssword123',
        });
      }

      // 6th attempt (even with correct password) should be blocked
      const response = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(423);
      expect(response.body.success).toBe(false);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('DOMAIN_ACCOUNT_LOCKED');
        expect(response.body.error.retryAfter).toBeGreaterThan(0);
      }
    });

    test('should include Retry-After header when account is locked', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      // Lock the account
      for (let i = 0; i < 5; i++) {
        await post(request, '/auth/login', {
          email: userData.email,
          password: 'WrongP@ssword123',
        });
      }

      // Try again
      const response = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(423);
      const retryAfter = response.headers['retry-after'];
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter)).toBeGreaterThan(0);
    });

    test('should not reveal if password was correct during lockout', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      // Lock the account
      for (let i = 0; i < 5; i++) {
        await post(request, '/auth/login', {
          email: userData.email,
          password: 'WrongP@ssword123',
        });
      }

      // Try with correct password
      const correctPass = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      // Try with wrong password
      const wrongPass = await post(request, '/auth/login', {
        email: userData.email,
        password: 'AnotherWrongP@ss123',
      });

      // Both should return same error
      expect(correctPass.status).toBe(423);
      expect(wrongPass.status).toBe(423);
      if (!correctPass.body.success && !wrongPass.body.success) {
        expect(correctPass.body.error.code).toBe(wrongPass.body.error.code);
      }
    });
  });

  test.describe('Lockout Recovery', () => {
    test('should reset failed attempts after successful login', async ({ request }) => {
      const { userData } = await createVerifiedUser(request);

      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await post(request, '/auth/login', {
          email: userData.email,
          password: 'WrongP@ssword123',
        });
      }

      // Login successfully
      const successLogin = await post<LoginResult>(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });
      expect(successLogin.status).toBe(200);

      // Make 4 more failed attempts (should not lock since counter was reset)
      for (let i = 0; i < 4; i++) {
        await post(request, '/auth/login', {
          email: userData.email,
          password: 'WrongP@ssword123',
        });
      }

      // Should still be able to login (4 attempts, not 7)
      const finalLogin = await post<LoginResult>(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });
      expect(finalLogin.status).toBe(200);
    });
  });

  test.describe('Security', () => {
    test('should not reveal account existence via lockout for non-existent email', async ({ request }) => {
      // Try to lock a non-existent account
      for (let i = 0; i < 6; i++) {
        const response = await post(request, '/auth/login', {
          email: 'nonexistent@example.com',
          password: 'WrongP@ssword123',
        });

        // Should always return 401, never 423
        expect(response.status).toBe(401);
        if (!response.body.success) {
          expect(response.body.error.code).toBe('DOMAIN_INVALID_CREDENTIALS');
        }
      }
    });
  });
});
