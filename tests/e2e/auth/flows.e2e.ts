/**
 * ============================================
 * E2E TEST: Complete Authentication Flows
 * ============================================
 *
 * Tests End-to-End para flujos completos de autenticación.
 * Valida user journeys de principio a fin.
 */

import { test, expect } from '@playwright/test';
import { post, postWithAuth } from '../helpers/api.helper';
import { generateValidUserData } from '../helpers/test-data.helper';

test.describe('Complete Authentication Flows E2E', () => {
  test.describe('Full Registration to Logout Journey', () => {
    test('should complete full authentication lifecycle', async ({ request }) => {
      const userData = generateValidUserData();

      // Step 1: Register
      const registerResponse = await post(request, '/auth/register', userData);
      expect(registerResponse.status).toBe(201);

      let verificationToken: string | undefined;
      if (registerResponse.body.success) {
        const data = registerResponse.body.data as { user: { verificationToken?: string } };
        verificationToken = data.user.verificationToken;
      }

      // Step 2: Verify Email
      const verifyResponse = await post(request, '/auth/verify-email', {
        token: verificationToken,
      });
      expect(verifyResponse.status).toBe(200);
      if (verifyResponse.body.success) {
        const data = verifyResponse.body.data as { user: { status: string } };
        expect(data.user.status).toBe('ACTIVE');
      }

      // Step 3: Login
      const loginResponse = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });
      expect(loginResponse.status).toBe(200);

      let accessToken: string | undefined;
      let refreshToken: string | undefined;
      if (loginResponse.body.success) {
        const data = loginResponse.body.data as {
          tokens: { accessToken: string; refreshToken: string };
        };
        accessToken = data.tokens.accessToken;
        refreshToken = data.tokens.refreshToken;
      }

      // Step 4: Refresh Session
      const refreshResponse = await post(request, '/auth/refresh', {
        refreshToken,
      });
      expect(refreshResponse.status).toBe(200);

      let newAccessToken: string | undefined;
      if (refreshResponse.body.success) {
        const data = refreshResponse.body.data as {
          tokens: { accessToken: string };
        };
        newAccessToken = data.tokens.accessToken;
      }

      // Step 5: Logout
      const logoutResponse = await postWithAuth(
        request,
        '/auth/logout',
        {},
        newAccessToken!
      );
      expect(logoutResponse.status).toBe(200);
    });
  });

  test.describe('Token Expiration Flow', () => {
    test('should handle multiple refresh cycles', async ({ request }) => {
      const userData = generateValidUserData();

      // Register and verify
      const registerResponse = await post(request, '/auth/register', userData);
      expect(registerResponse.status).toBe(201);

      let verificationToken: string | undefined;
      if (registerResponse.body.success) {
        const data = registerResponse.body.data as { user: { verificationToken?: string } };
        verificationToken = data.user.verificationToken;
      }

      await post(request, '/auth/verify-email', { token: verificationToken });

      // Login
      const loginResponse = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      let currentRefreshToken: string | undefined;
      if (loginResponse.body.success) {
        const data = loginResponse.body.data as {
          tokens: { refreshToken: string };
        };
        currentRefreshToken = data.tokens.refreshToken;
      }

      // Simulate multiple session refreshes
      for (let i = 0; i < 5; i++) {
        const refreshResponse = await post(request, '/auth/refresh', {
          refreshToken: currentRefreshToken,
        });
        expect(refreshResponse.status).toBe(200);

        if (refreshResponse.body.success) {
          const data = refreshResponse.body.data as {
            tokens: { refreshToken: string };
          };
          currentRefreshToken = data.tokens.refreshToken;
        }
      }
    });
  });

  test.describe('Multi-Device Session Flow', () => {
    test('should handle login from multiple devices', async ({ request }) => {
      const userData = generateValidUserData();

      // Register and verify
      const registerResponse = await post(request, '/auth/register', userData);
      expect(registerResponse.status).toBe(201);

      let verificationToken: string | undefined;
      if (registerResponse.body.success) {
        const data = registerResponse.body.data as { user: { verificationToken?: string } };
        verificationToken = data.user.verificationToken;
      }

      await post(request, '/auth/verify-email', { token: verificationToken });

      // Login from device 1
      const device1Login = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
        deviceInfo: 'Chrome/Windows',
      });
      expect(device1Login.status).toBe(200);

      // Login from device 2
      const device2Login = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
        deviceInfo: 'Safari/macOS',
      });
      expect(device2Login.status).toBe(200);

      // Both devices should have different tokens
      if (device1Login.body.success && device2Login.body.success) {
        const device1Tokens = (device1Login.body.data as { tokens: { refreshToken: string } }).tokens;
        const device2Tokens = (device2Login.body.data as { tokens: { refreshToken: string } }).tokens;

        expect(device1Tokens.refreshToken).not.toBe(device2Tokens.refreshToken);

        // Both refresh tokens should work independently
        const device1Refresh = await post(request, '/auth/refresh', {
          refreshToken: device1Tokens.refreshToken,
        });
        const device2Refresh = await post(request, '/auth/refresh', {
          refreshToken: device2Tokens.refreshToken,
        });

        expect(device1Refresh.status).toBe(200);
        expect(device2Refresh.status).toBe(200);
      }
    });
  });

  test.describe('Error Recovery Flow', () => {
    test('should allow re-login after failed login attempts', async ({ request }) => {
      const userData = generateValidUserData();

      // Register and verify
      const registerResponse = await post(request, '/auth/register', userData);
      expect(registerResponse.status).toBe(201);

      let verificationToken: string | undefined;
      if (registerResponse.body.success) {
        const data = registerResponse.body.data as { user: { verificationToken?: string } };
        verificationToken = data.user.verificationToken;
      }

      await post(request, '/auth/verify-email', { token: verificationToken });

      // Failed login attempts
      for (let i = 0; i < 3; i++) {
        const failedLogin = await post(request, '/auth/login', {
          email: userData.email,
          password: 'WrongP@ss123',
        });
        expect(failedLogin.status).toBe(401);
      }

      // Successful login should still work
      const successLogin = await post(request, '/auth/login', {
        email: userData.email,
        password: userData.password,
      });
      expect(successLogin.status).toBe(200);
    });
  });
});
