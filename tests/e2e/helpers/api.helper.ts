/**
 * HTTP request utilities for E2E tests
 */

import type { APIRequestContext } from '@playwright/test';
import type { ApiResponse } from '../types';

const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';

/**
 * Counter for generating unique IPs per request.
 * This allows each test to have its own rate limit bucket.
 * Combined with random base to avoid collisions between parallel workers.
 */
let ipCounter = 0;
const workerRandomBase = Math.floor(Math.random() * 1000000);

/**
 * Generates a unique fake IP address for rate limiting isolation.
 * Each call returns a different IP, ensuring tests don't share rate limit buckets.
 * Uses combination of random base + counter + timestamp for uniqueness across workers.
 */
export function generateUniqueIp(): string {
  ipCounter++;
  // Combine worker random base, counter, and timestamp for true uniqueness
  const uniqueValue = workerRandomBase + ipCounter + (Date.now() % 100000);
  const octet1 = 10 + (Math.floor(uniqueValue / 16777216) % 118); // 10-127
  const octet2 = Math.floor(uniqueValue / 65536) % 256;
  const octet3 = Math.floor(uniqueValue / 256) % 256;
  const octet4 = uniqueValue % 256;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

/**
 * Resets the IP counter. Useful for tests that need predictable IPs.
 */
export function resetIpCounter(): void {
  ipCounter = 0;
}

/**
 * Options for POST requests
 */
export interface PostOptions {
  /** Custom headers to include */
  headers?: Record<string, string>;
  /**
   * If true, uses a unique IP for this request (default: true).
   * Set to false when testing rate limiting to share the same IP across requests.
   */
  useUniqueIp?: boolean;
  /**
   * Specific IP to use for X-Forwarded-For header.
   * Overrides useUniqueIp when provided.
   */
  clientIp?: string;
}

/**
 * POST request helper with standardized response.
 * By default, each request gets a unique IP to avoid rate limit conflicts between tests.
 */
export async function post<T = unknown>(
  request: APIRequestContext,
  path: string,
  data: unknown,
  options?: PostOptions | Record<string, string>
): Promise<ApiResponse<T>> {
  // Handle backwards compatibility: if options is a plain headers object
  // Check for any PostOptions properties (clientIp, useUniqueIp, or headers as object)
  const isPostOptions = options && (
    'clientIp' in options ||
    'useUniqueIp' in options ||
    ('headers' in options && typeof options.headers === 'object')
  );
  const opts: PostOptions = isPostOptions
    ? options as PostOptions
    : { headers: options as Record<string, string> | undefined };

  const useUniqueIp = opts.useUniqueIp !== false;
  const clientIp = opts.clientIp ?? (useUniqueIp ? generateUniqueIp() : undefined);

  const response = await request.post(`${BASE_URL}${path}`, {
    data,
    headers: {
      'Content-Type': 'application/json',
      ...(clientIp ? { 'X-Forwarded-For': clientIp } : {}),
      ...opts.headers,
    },
  });

  const body = await response.json();
  const responseHeaders = response.headers();

  return {
    status: response.status(),
    body,
    headers: responseHeaders,
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
 * Options for GET requests
 */
export interface GetOptions {
  /** Custom headers to include */
  headers?: Record<string, string>;
  /**
   * If true, uses a unique IP for this request (default: true).
   */
  useUniqueIp?: boolean;
  /**
   * Specific IP to use for X-Forwarded-For header.
   */
  clientIp?: string;
}

/**
 * GET request helper with standardized response.
 * By default, each request gets a unique IP to avoid rate limit conflicts.
 */
export async function get<T = unknown>(
  request: APIRequestContext,
  path: string,
  options?: GetOptions | Record<string, string>
): Promise<ApiResponse<T>> {
  // Handle backwards compatibility
  const opts: GetOptions = options && 'headers' in options && typeof options.headers === 'object'
    ? options as GetOptions
    : { headers: options as Record<string, string> | undefined };

  const useUniqueIp = opts.useUniqueIp !== false;
  const clientIp = opts.clientIp ?? (useUniqueIp ? generateUniqueIp() : undefined);

  const response = await request.get(`${BASE_URL}${path}`, {
    headers: {
      ...(clientIp ? { 'X-Forwarded-For': clientIp } : {}),
      ...opts.headers,
    },
  });

  const body = await response.json();
  const responseHeaders = response.headers();

  return {
    status: response.status(),
    body,
    headers: responseHeaders,
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
