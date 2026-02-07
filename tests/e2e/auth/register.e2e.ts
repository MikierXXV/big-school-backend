/**
 * ============================================
 * E2E TEST: User Registration
 * ============================================
 *
 * Tests End-to-End para el flujo de registro.
 * Usa Playwright para HTTP requests.
 */

import { test, expect } from '@playwright/test';
import { post } from '../helpers/api.helper';
import { generateValidUserData, WEAK_PASSWORDS } from '../helpers/test-data.helper';

test.describe('User Registration E2E', () => {
  test.describe('POST /auth/register - Success Cases', () => {
    test('should register a new user successfully', async ({ request }) => {
      const userData = generateValidUserData();

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      if (response.body.success) {
        const { user } = response.body.data as { user: { email: string; fullName: string; status: string } };
        expect(user.email).toBe(userData.email);
        expect(user.fullName).toBe(`${userData.firstName} ${userData.lastName}`);
        expect(user.status).toBe('PENDING_VERIFICATION');
      }
    });

    test('should return verification token in development', async ({ request }) => {
      const userData = generateValidUserData();

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(201);
      if (response.body.success) {
        const { user } = response.body.data as { user: { verificationToken?: string } };
        expect(user.verificationToken).toBeDefined();
      }
    });

    test('should generate unique user ID (UUID v4)', async ({ request }) => {
      const userData = generateValidUserData();

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(201);
      if (response.body.success) {
        const { user } = response.body.data as { user: { id: string } };
        expect(user.id).toBeDefined();
        expect(user.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      }
    });
  });

  test.describe('POST /auth/register - Duplicate Email (409)', () => {
    test('should reject duplicate email', async ({ request }) => {
      const userData = generateValidUserData();

      // First registration
      const first = await post(request, '/auth/register', userData);
      expect(first.status).toBe(201);

      // Attempt duplicate
      const second = await post(request, '/auth/register', userData);

      expect(second.status).toBe(409);
      expect(second.body.success).toBe(false);
      if (!second.body.success) {
        expect(second.body.error.code).toBe('DOMAIN_USER_ALREADY_EXISTS');
      }
    });
  });

  test.describe('POST /auth/register - Validation Errors (400)', () => {
    test('should validate required fields - email missing', async ({ request }) => {
      const userData = generateValidUserData();
      const { email: _email, ...withoutEmail } = userData;

      const response = await post(request, '/auth/register', withoutEmail);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate required fields - password missing', async ({ request }) => {
      const userData = generateValidUserData();
      const { password: _password, ...withoutPassword } = userData;

      const response = await post(request, '/auth/register', withoutPassword);

      expect(response.status).toBe(400);
    });

    test('should validate required fields - firstName missing', async ({ request }) => {
      const userData = generateValidUserData();
      const { firstName: _firstName, ...withoutFirstName } = userData;

      const response = await post(request, '/auth/register', withoutFirstName);

      expect(response.status).toBe(400);
    });

    test('should validate required fields - lastName missing', async ({ request }) => {
      const userData = generateValidUserData();
      const { lastName: _lastName, ...withoutLastName } = userData;

      const response = await post(request, '/auth/register', withoutLastName);

      expect(response.status).toBe(400);
    });

    test('should validate email format', async ({ request }) => {
      const userData = generateValidUserData({ email: 'invalid-email' });

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(400);
    });

    test('should validate password confirmation match', async ({ request }) => {
      const userData = generateValidUserData({
        passwordConfirmation: 'DifferentP@ss123',
      });

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(400);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('APP_PASSWORD_MISMATCH');
      }
    });

    test('should require terms acceptance', async ({ request }) => {
      const userData = generateValidUserData({ acceptTerms: false });

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(400);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('APP_TERMS_NOT_ACCEPTED');
      }
    });
  });

  test.describe('POST /auth/register - Weak Password (400)', () => {
    test('should reject password too short', async ({ request }) => {
      const userData = generateValidUserData({
        password: WEAK_PASSWORDS.tooShort,
        passwordConfirmation: WEAK_PASSWORDS.tooShort,
      });

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(400);
      // The error code might be DOMAIN_WEAK_PASSWORD or validation error
      expect(response.body.success).toBe(false);
    });

    test('should reject password without uppercase', async ({ request }) => {
      const userData = generateValidUserData({
        password: WEAK_PASSWORDS.noUppercase,
        passwordConfirmation: WEAK_PASSWORDS.noUppercase,
      });

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(400);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('DOMAIN_WEAK_PASSWORD');
      }
    });

    test('should reject password without lowercase', async ({ request }) => {
      const userData = generateValidUserData({
        password: WEAK_PASSWORDS.noLowercase,
        passwordConfirmation: WEAK_PASSWORDS.noLowercase,
      });

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(400);
    });

    test('should reject password without number', async ({ request }) => {
      const userData = generateValidUserData({
        password: WEAK_PASSWORDS.noNumber,
        passwordConfirmation: WEAK_PASSWORDS.noNumber,
      });

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(400);
    });

    test('should reject password without special character', async ({ request }) => {
      const userData = generateValidUserData({
        password: WEAK_PASSWORDS.noSpecialChar,
        passwordConfirmation: WEAK_PASSWORDS.noSpecialChar,
      });

      const response = await post(request, '/auth/register', userData);

      expect(response.status).toBe(400);
    });
  });
});
