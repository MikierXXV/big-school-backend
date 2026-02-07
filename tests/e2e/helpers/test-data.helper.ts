/**
 * Test data generators for E2E tests
 */

import type { TestUserData } from '../types';

/**
 * Generates unique email with timestamp and random suffix
 */
export function generateUniqueEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test_${timestamp}_${random}@example.com`;
}

/**
 * Generates valid user registration data
 */
export function generateValidUserData(overrides?: Partial<TestUserData>): TestUserData {
  return {
    email: generateUniqueEmail(),
    password: 'SecureP@ss123',
    passwordConfirmation: 'SecureP@ss123',
    firstName: 'Test',
    lastName: 'User',
    acceptTerms: true,
    ...overrides,
  };
}

/**
 * Weak passwords for negative testing
 */
export const WEAK_PASSWORDS = {
  tooShort: 'Short1!',
  noUppercase: 'password123!',
  noLowercase: 'PASSWORD123!',
  noNumber: 'SecurePass!',
  noSpecialChar: 'SecurePass123',
} as const;

/**
 * Valid password for tests
 */
export const VALID_PASSWORD = 'SecureP@ss123';
