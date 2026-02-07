/**
 * Authentication flow helpers for E2E tests
 */

import type { APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';
import { post } from './api.helper';
import { generateValidUserData } from './test-data.helper';
import type { TestUserData, RegisteredUser, LoginResult } from '../types';

/**
 * Registers a new user and returns user data with verification token
 */
export async function registerUser(
  request: APIRequestContext,
  userData?: Partial<TestUserData>
): Promise<{ userData: TestUserData; registeredUser: RegisteredUser }> {
  const data = generateValidUserData(userData);

  const response = await post<{ user: RegisteredUser }>(
    request,
    '/auth/register',
    data
  );

  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);

  const body = response.body as { success: true; data: { user: RegisteredUser } };

  return {
    userData: data,
    registeredUser: body.data.user,
  };
}

/**
 * Verifies a user's email using the verification token
 */
export async function verifyUserEmail(
  request: APIRequestContext,
  verificationToken: string
): Promise<void> {
  const response = await post(request, '/auth/verify-email', {
    token: verificationToken,
  });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
}

/**
 * Registers and verifies a user (complete setup)
 */
export async function createVerifiedUser(
  request: APIRequestContext,
  userData?: Partial<TestUserData>
): Promise<{ userData: TestUserData; user: RegisteredUser }> {
  const { userData: data, registeredUser } = await registerUser(request, userData);

  if (registeredUser.verificationToken) {
    await verifyUserEmail(request, registeredUser.verificationToken);
  }

  return { userData: data, user: registeredUser };
}

/**
 * Logs in a user and returns tokens
 */
export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string,
  options?: { deviceInfo?: string; rememberMe?: boolean }
): Promise<LoginResult> {
  const response = await post<LoginResult>(request, '/auth/login', {
    email,
    password,
    ...options,
  });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);

  const body = response.body as { success: true; data: LoginResult };
  return body.data;
}

/**
 * Creates a verified user and logs them in
 */
export async function createLoggedInUser(
  request: APIRequestContext,
  userData?: Partial<TestUserData>
): Promise<{
  userData: TestUserData;
  user: RegisteredUser;
  loginResult: LoginResult;
}> {
  const { userData: data, user } = await createVerifiedUser(request, userData);
  const loginResult = await loginUser(request, data.email, data.password);

  return { userData: data, user, loginResult };
}
