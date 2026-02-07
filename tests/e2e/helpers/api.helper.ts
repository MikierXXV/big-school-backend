/**
 * HTTP request utilities for E2E tests
 */

import type { APIRequestContext } from '@playwright/test';
import type { ApiResponse } from '../types';

const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';

/**
 * POST request helper with standardized response
 */
export async function post<T = unknown>(
  request: APIRequestContext,
  path: string,
  data: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const response = await request.post(`${BASE_URL}${path}`, {
    data,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  const body = await response.json();
  return {
    status: response.status(),
    body,
  };
}

/**
 * POST with Authorization header
 */
export async function postWithAuth<T = unknown>(
  request: APIRequestContext,
  path: string,
  data: unknown,
  accessToken: string
): Promise<ApiResponse<T>> {
  return post<T>(request, path, data, {
    Authorization: `Bearer ${accessToken}`,
  });
}

/**
 * GET request helper
 */
export async function get<T = unknown>(
  request: APIRequestContext,
  path: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const response = await request.get(`${BASE_URL}${path}`, {
    headers: {
      ...headers,
    },
  });

  const body = await response.json();
  return {
    status: response.status(),
    body,
  };
}

/**
 * GET with Authorization header
 */
export async function getWithAuth<T = unknown>(
  request: APIRequestContext,
  path: string,
  accessToken: string
): Promise<ApiResponse<T>> {
  return get<T>(request, path, {
    Authorization: `Bearer ${accessToken}`,
  });
}
