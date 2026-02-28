/**
 * ============================================
 * E2E TEST: Admin Management (Feature 012)
 * ============================================
 *
 * Tests End-to-End para el flujo de administración de usuarios admin.
 * Prueba promoción, degradación, y gestión de permisos.
 */

import { test, expect } from '@playwright/test';
import { generateUniqueEmail, generateValidPassword } from '../helpers/test-data.helper.js';
import { registerUser, verifyUserEmail, loginUser } from '../helpers/auth.helper.js';
import { post, get } from '../helpers/api.helper.js';
import { promoteToAdmin, demoteFromAdmin, grantPermission, revokePermission } from '../helpers/rbac.helper.js';

test.describe('RBAC - Admin Management E2E', () => {
  let superAdminToken: string;
  let superAdminUserId: string;
  let regularUserId: string;
  let regularUserEmail: string;
  let regularUserPassword: string;

  test.beforeAll(async ({ request }) => {
    // Login como SUPER_ADMIN (configurado en .env)
    const loginResult = await loginUser(
      request,
      'superadmin@healthcaresuite.com',
      'Hc$2026!Sup3rAdm1n#Secur3Pass'
    );
    superAdminToken = loginResult.tokens.accessToken;
    superAdminUserId = loginResult.user.id;

    // Crear usuario regular para promover
    const password = generateValidPassword();
    const userData = {
      email: generateUniqueEmail(),
      password,
      passwordConfirmation: password,
      firstName: 'Test',
      lastName: 'User',
      acceptTerms: true,
    };
    regularUserPassword = password;

    const { registeredUser } = await registerUser(request, userData);
    await verifyUserEmail(request, registeredUser.verificationToken!);
    regularUserId = registeredUser.id;
    regularUserEmail = registeredUser.email;
  });

  test.describe('POST /api/admin/promote', () => {
    test('should promote user to ADMIN (200)', async ({ request }) => {
      const response = await post(request, '/api/admin/promote', {
        userId: regularUserId,
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.userId).toBe(regularUserId);
        expect(response.body.data.systemRole).toBe('admin');
        expect(response.body.data.permissions).toEqual([]);
      }
    });

    test('should be idempotent - promoting already admin returns success (200)', async ({ request }) => {
      const response = await post(request, '/api/admin/promote', {
        userId: regularUserId,
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await post(request, '/api/admin/promote', {
        userId: regularUserId,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-SUPER_ADMIN users (403)', async ({ request }) => {
      // Login como admin regular (sin permisos de SUPER_ADMIN)
      const adminLogin = await loginUser(request, regularUserEmail, regularUserPassword);

      const response = await post(request, '/api/admin/promote', {
        userId: regularUserId,
      }, { headers: { Authorization: `Bearer ${adminLogin.tokens.accessToken}` } });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid userId format (400)', async ({ request }) => {
      const response = await post(request, '/api/admin/promote', {
        userId: 'invalid-uuid',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject missing userId (400)', async ({ request }) => {
      const response = await post(request, '/api/admin/promote', {},
        { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-existent user (404)', async ({ request }) => {
      const fakeUserId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await post(request, '/api/admin/promote', {
        userId: fakeUserId,
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('POST /api/admin/demote', () => {
    test('should demote admin to user (200)', async ({ request }) => {
      // Primero asegurarse de que el usuario es admin
      await promoteToAdmin(request, regularUserId, superAdminToken);

      const response = await post(request, '/api/admin/demote', {
        userId: regularUserId,
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.userId).toBe(regularUserId);
        expect(response.body.data.systemRole).toBe('user');
      }
    });

    test('should be idempotent - demoting already user returns success (200)', async ({ request }) => {
      const response = await post(request, '/api/admin/demote', {
        userId: regularUserId,
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject demoting SUPER_ADMIN (403)', async ({ request }) => {
      const response = await post(request, '/api/admin/demote', {
        userId: superAdminUserId,
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('DOMAIN_CANNOT_MODIFY_SUPER_ADMIN');
      }
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await post(request, '/api/admin/demote', {
        userId: regularUserId,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid userId format (400)', async ({ request }) => {
      const response = await post(request, '/api/admin/demote', {
        userId: 'invalid-uuid',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('POST /api/admin/permissions/grant', () => {
    test('should grant permission to admin (200)', async ({ request }) => {
      // Primero promover el usuario a admin
      await promoteToAdmin(request, regularUserId, superAdminToken);

      const response = await post(request, '/api/admin/permissions/grant', {
        userId: regularUserId,
        permissions: ['manage_users'],
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.userId).toBe(regularUserId);
        expect(response.body.data.systemRole).toBe('admin');
        expect(Array.isArray(response.body.data.grantedPermissions)).toBe(true);
        expect(response.body.data.grantedPermissions.length).toBeGreaterThan(0);

        const grantedPermission = response.body.data.grantedPermissions.find(
          (p: any) => p.permission === 'manage_users'
        );
        expect(grantedPermission).toBeDefined();
        expect(grantedPermission.permission).toBe('manage_users');
        expect(grantedPermission.grantedBy).toBe(superAdminUserId);
        expect(grantedPermission.grantedAt).toBeDefined();
      }
    });

    test('should be idempotent - granting existing permission succeeds (200)', async ({ request }) => {
      const response = await post(request, '/api/admin/permissions/grant', {
        userId: regularUserId,
        permissions: ['manage_users'],
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject invalid permission value (400)', async ({ request }) => {
      const response = await post(request, '/api/admin/permissions/grant', {
        userId: regularUserId,
        permissions: ['invalid_permission'],
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject granting permission to non-admin user (400)', async ({ request }) => {
      // Primero degradar el usuario
      await demoteFromAdmin(request, regularUserId, superAdminToken);

      const response = await post(request, '/api/admin/permissions/grant', {
        userId: regularUserId,
        permissions: ['manage_users'],
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await post(request, '/api/admin/permissions/grant', {
        userId: regularUserId,
        permissions: ['manage_users'],
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should grant multiple different permissions to same admin', async ({ request }) => {
      // Asegurar que el usuario es admin
      await promoteToAdmin(request, regularUserId, superAdminToken);

      // Otorgar varios permisos
      const permissions = ['manage_users', 'manage_organizations', 'assign_members'];

      for (const permission of permissions) {
        const response = await grantPermission(request, regularUserId, permission, superAdminToken);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }

      // Verificar en lista de admins
      const listResponse = await get(request, '/api/admin/list',
        { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(listResponse.status).toBe(200);
      if (listResponse.body.success) {
        const admin = listResponse.body.data.admins.find((a: any) => a.userId === regularUserId);
        expect(admin).toBeDefined();
        expect(admin.permissions).toContain('manage_users');
        expect(admin.permissions).toContain('manage_organizations');
        expect(admin.permissions).toContain('assign_members');
      }
    });
  });

  test.describe('POST /api/admin/permissions/revoke', () => {
    test('should revoke permission from admin (200)', async ({ request }) => {
      // Primero asegurar que el admin tiene el permiso
      await promoteToAdmin(request, regularUserId, superAdminToken);
      await grantPermission(request, regularUserId, 'manage_users', superAdminToken);

      const response = await post(request, '/api/admin/permissions/revoke', {
        userId: regularUserId,
        permission: 'manage_users',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.userId).toBe(regularUserId);
        expect(response.body.data.systemRole).toBe('admin');
        expect(Array.isArray(response.body.data.grantedPermissions)).toBe(true);

        // Verify that the permission was removed
        const revokedPermission = response.body.data.grantedPermissions.find(
          (p: any) => p.permission === 'manage_users'
        );
        expect(revokedPermission).toBeUndefined();
      }
    });

    test('should be idempotent - revoking already revoked permission succeeds (200)', async ({ request }) => {
      const response = await post(request, '/api/admin/permissions/revoke', {
        userId: regularUserId,
        permission: 'manage_users',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject invalid permission value (400)', async ({ request }) => {
      const response = await post(request, '/api/admin/permissions/revoke', {
        userId: regularUserId,
        permission: 'invalid_permission',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await post(request, '/api/admin/permissions/revoke', {
        userId: regularUserId,
        permission: 'manage_users',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('GET /api/admin/list', () => {
    test('should list all admins with their permissions (200)', async ({ request }) => {
      const response = await get(request, '/api/admin/list',
        { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(Array.isArray(response.body.data.admins)).toBe(true);
        expect(response.body.data.admins.length).toBeGreaterThan(0);

        // Verificar estructura de un admin
        const admin = response.body.data.admins[0];
        expect(admin).toHaveProperty('userId');
        expect(admin).toHaveProperty('email');
        expect(admin).toHaveProperty('firstName');
        expect(admin).toHaveProperty('lastName');
        expect(admin).toHaveProperty('systemRole');
        expect(admin).toHaveProperty('permissions');
        expect(Array.isArray(admin.permissions)).toBe(true);
      }
    });

    test('should include SUPER_ADMIN in list', async ({ request }) => {
      const response = await get(request, '/api/admin/list',
        { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(200);
      if (response.body.success) {
        const superAdmin = response.body.data.admins.find(
          (a: any) => a.systemRole === 'super_admin'
        );
        expect(superAdmin).toBeDefined();
        expect(superAdmin.email).toBe('superadmin@healthcaresuite.com');
      }
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await get(request, '/api/admin/list');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-SUPER_ADMIN users (403)', async ({ request }) => {
      // Login como admin regular
      await promoteToAdmin(request, regularUserId, superAdminToken);
      const adminLogin = await loginUser(request, regularUserEmail, regularUserPassword);

      const response = await get(request, '/api/admin/list',
        { headers: { Authorization: `Bearer ${adminLogin.tokens.accessToken}` } });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
