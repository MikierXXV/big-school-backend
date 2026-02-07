/**
 * Token management utilities for E2E tests
 */

import type { APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';
import { post } from './api.helper';
import type { RefreshResult, ApiResponse } from '../types';

/**
 * Refreshes session using refresh token
 */
export async function refreshSession(
  request: APIRequestContext,
  refreshToken: string
): Promise<RefreshResult> {
  const response = await post<RefreshResult>(request, '/auth/refresh', {
    refreshToken,
  });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);

  const body = response.body as { success: true; data: RefreshResult };
  return body.data;
}

/**
 * Attempts to refresh session (allows failure for negative tests)
 */
export async function attemptRefresh(
  request: APIRequestContext,
  refreshToken: string
): Promise<ApiResponse<RefreshResult>> {
  return post<RefreshResult>(request, '/auth/refresh', {
    refreshToken,
  });
}
