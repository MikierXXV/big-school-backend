/**
 * RBAC utilities for E2E tests
 */

import type { APIRequestContext } from '@playwright/test';
import { post } from './api.helper.js';

/**
 * Promotes a user to ADMIN role
 */
export async function promoteToAdmin(
  request: APIRequestContext,
  userId: string,
  superAdminToken: string
) {
  return await post(request, '/api/admin/promote', { userId }, { headers: { Authorization: `Bearer ${superAdminToken}` } });
}

/**
 * Demotes an ADMIN user back to USER role
 */
export async function demoteFromAdmin(
  request: APIRequestContext,
  userId: string,
  superAdminToken: string
) {
  return await post(request, '/api/admin/demote', { userId }, { headers: { Authorization: `Bearer ${superAdminToken}` } });
}

/**
 * Grants permissions to an admin user
 */
export async function grantPermission(
  request: APIRequestContext,
  userId: string,
  permission: string,
  superAdminToken: string
) {
  return await post(
    request,
    '/api/admin/permissions/grant',
    { userId, permissions: [permission] }, // DTO expects userId and permissions array
    { headers: { Authorization: `Bearer ${superAdminToken}` } }
  );
}

/**
 * Revokes a permission from an admin user
 */
export async function revokePermission(
  request: APIRequestContext,
  userId: string,
  permission: string,
  superAdminToken: string
) {
  return await post(
    request,
    '/api/admin/permissions/revoke',
    { userId, permission }, // DTO expects userId and permission string
    { headers: { Authorization: `Bearer ${superAdminToken}` } }
  );
}

/**
 * Creates an organization
 */
export async function createOrganization(
  request: APIRequestContext,
  name: string,
  type: string,
  token: string,
  additionalData?: Record<string, unknown>
) {
  return await post(
    request,
    '/api/organizations',
    { name, type, ...additionalData },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

/**
 * Assigns a member to an organization
 */
export async function assignMember(
  request: APIRequestContext,
  organizationId: string,
  userId: string,
  role: string,
  token: string
) {
  return await post(
    request,
    `/api/organizations/${organizationId}/members`,
    { userId, role },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

/**
 * Removes a member from an organization
 */
export async function removeMember(
  request: APIRequestContext,
  organizationId: string,
  userId: string,
  token: string
) {
  const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
  const response = await request.delete(
    `${BASE_URL}/api/organizations/${organizationId}/members/${userId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const body = await response.json();
  const responseHeaders = response.headers();

  return {
    status: response.status(),
    body,
    headers: responseHeaders,
  };
}

/**
 * Changes a member's role in an organization
 */
export async function changeMemberRole(
  request: APIRequestContext,
  organizationId: string,
  userId: string,
  newRole: string,
  token: string
) {
  const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
  const response = await request.patch(
    `${BASE_URL}/api/organizations/${organizationId}/members/${userId}/role`,
    {
      data: { newRole },
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const body = await response.json();
  const responseHeaders = response.headers();

  return {
    status: response.status(),
    body,
    headers: responseHeaders,
  };
}
