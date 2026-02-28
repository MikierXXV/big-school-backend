/**
 * ============================================
 * E2E TEST: Organization Management (Feature 012)
 * ============================================
 *
 * Tests End-to-End para el flujo de gestión de organizaciones.
 * Prueba creación, actualización, listado y desactivación.
 */

import { test, expect } from '@playwright/test';
import { loginUser } from '../helpers/auth.helper.js';
import { post, get } from '../helpers/api.helper.js';
import { promoteToAdmin, grantPermission, createOrganization } from '../helpers/rbac.helper.js';

test.describe('RBAC - Organization Management E2E', () => {
  let superAdminToken: string;
  let organizationId: string;

  test.beforeAll(async ({ request }) => {
    // Login como SUPER_ADMIN
    const superAdminLogin = await loginUser(
      request,
      'superadmin@healthcaresuite.com',
      'Hc$2026!Sup3rAdm1n#Secur3Pass'
    );
    superAdminToken = superAdminLogin.tokens.accessToken;

    // Create a test organization for tests that need it
    const orgResponse = await createOrganization(
      request,
      `Test Organization ${Date.now()}`,
      'hospital',
      superAdminToken
    );
    organizationId = orgResponse.body.data.id;
  });

  test.describe('POST /api/organizations', () => {
    test('should create organization with valid data (201)', async ({ request }) => {
      const response = await post(request, '/api/organizations', {
        name: `Hospital Test ${Date.now()}`,
        type: 'hospital',
        description: 'Test hospital',
        address: '123 Test St',
        contactEmail: 'contact@hospital.com',
        contactPhone: '+1234567890',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toContain('Hospital Test');
        expect(response.body.data.type).toBe('hospital');
        expect(response.body.data.active).toBe(true);
        expect(response.body.data.description).toBe('Test hospital');
        expect(response.body.data.address).toBe('123 Test St');
        expect(response.body.data.contactEmail).toBe('contact@hospital.com');
        expect(response.body.data.contactPhone).toBe('+1234567890');

        organizationId = response.body.data.id;
      }
    });

    test('should create organization with only required fields (201)', async ({ request }) => {
      const response = await post(request, '/api/organizations', {
        name: `Clinic Minimal ${Date.now()}`,
        type: 'clinic',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.name).toContain('Clinic Minimal');
        expect(response.body.data.type).toBe('clinic');
        expect(response.body.data.active).toBe(true);
      }
    });

    test('should reject duplicate organization name (409)', async ({ request }) => {
      const orgName = `Unique Hospital ${Date.now()}`;

      // Crear primera vez
      await post(request, '/api/organizations', {
        name: orgName,
        type: 'hospital',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      // Intentar crear con mismo nombre
      const response = await post(request, '/api/organizations', {
        name: orgName,
        type: 'clinic',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('DOMAIN_ORGANIZATION_ALREADY_EXISTS');
      }
    });

    test('should reject invalid organization type (400)', async ({ request }) => {
      const response = await post(request, '/api/organizations', {
        name: `Test Org ${Date.now()}`,
        type: 'invalid_type',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject missing required fields - name (400)', async ({ request }) => {
      const response = await post(request, '/api/organizations', {
        type: 'hospital', // Missing name
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject missing required fields - type (400)', async ({ request }) => {
      const response = await post(request, '/api/organizations', {
        name: 'Test Hospital', // Missing type
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await post(request, '/api/organizations', {
        name: `Test Org ${Date.now()}`,
        type: 'hospital',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject without proper permissions (403)', async ({ request }) => {
      // Crear un usuario admin sin el permiso manage_organizations
      const adminUserData = await test.step('Create regular user', async () => {
        const { registerUser, verifyUserEmail, generateUniqueEmail, generateValidPassword } = await import('../helpers/index.js');
        const userData = {
          email: generateUniqueEmail(),
          password: generateValidPassword(),
          passwordConfirmation: '',
          firstName: 'No',
          lastName: 'Perms',
          acceptTerms: true,
        };
        userData.passwordConfirmation = userData.password;

        const { registeredUser } = await registerUser(request, userData);
        await verifyUserEmail(request, registeredUser.verificationToken!);
        await promoteToAdmin(request, registeredUser.id, superAdminToken);

        const loginResult = await loginUser(request, userData.email, userData.password);
        return { user: registeredUser, token: loginResult.tokens.accessToken };
      });

      const response = await post(request, '/api/organizations', {
        name: `Test Org No Perms ${Date.now()}`,
        type: 'hospital',
      }, { headers: { Authorization: `Bearer ${adminUserData.token}` } });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should accept all valid organization types', async ({ request }) => {
      const types = ['hospital', 'clinic', 'health_center', 'laboratory', 'pharmacy', 'other'];

      for (const type of types) {
        const response = await post(request, '/api/organizations', {
          name: `${type} Test ${Date.now()}`,
          type,
        }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        if (response.body.success) {
          expect(response.body.data.type).toBe(type);
        }
      }
    });

    test('should reject empty name (400)', async ({ request }) => {
      const response = await post(request, '/api/organizations', {
        name: '',
        type: 'hospital',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject name with only whitespace (400)', async ({ request }) => {
      const response = await post(request, '/api/organizations', {
        name: '   ',
        type: 'hospital',
      }, { headers: { Authorization: `Bearer ${superAdminToken}` } });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('GET /api/organizations/:id', () => {
    test('should get organization by id (200)', async ({ request }) => {
      const response = await get(
        request,
        `/api/organizations/${organizationId}`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.id).toBe(organizationId);
        expect(response.body.data).toHaveProperty('name');
        expect(response.body.data).toHaveProperty('type');
        expect(response.body.data).toHaveProperty('active');
        expect(response.body.data).toHaveProperty('createdAt');
      }
    });

    test('should return 404 for non-existent organization', async ({ request }) => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await get(
        request,
        `/api/organizations/${fakeId}`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid UUID format (400)', async ({ request }) => {
      const response = await get(
        request,
        '/api/organizations/invalid-uuid',
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await get(request, `/api/organizations/${organizationId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('GET /api/organizations', () => {
    test('should list all organizations (200)', async ({ request }) => {
      const response = await get(
        request,
        '/api/organizations',
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(Array.isArray(response.body.data.organizations)).toBe(true);
        expect(response.body.data.organizations.length).toBeGreaterThan(0);
        expect(response.body.data).toHaveProperty('total');
        expect(response.body.data).toHaveProperty('page');
        expect(response.body.data).toHaveProperty('limit');
      }
    });

    test('should support pagination with page and limit', async ({ request }) => {
      const response = await get(
        request,
        '/api/organizations?page=1&limit=5',
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      if (response.body.success) {
        expect(response.body.data.organizations.length).toBeLessThanOrEqual(5);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(5);
      }
    });

    test('should filter by active status (true)', async ({ request }) => {
      const response = await get(
        request,
        '/api/organizations?active=true',
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      if (response.body.success) {
        response.body.data.organizations.forEach((org: any) => {
          expect(org.active).toBe(true);
        });
      }
    });

    test('should filter by organization type', async ({ request }) => {
      const response = await get(
        request,
        '/api/organizations?type=hospital',
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      if (response.body.success) {
        response.body.data.organizations.forEach((org: any) => {
          expect(org.type).toBe('hospital');
        });
      }
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await get(request, '/api/organizations');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('PUT /api/organizations/:id', () => {
    let updateOrgId: string;

    test.beforeAll(async ({ request }) => {
      // Crear organización para actualizar
      const createResponse = await createOrganization(
        request,
        `Update Test Org ${Date.now()}`,
        'clinic',
        superAdminToken
      );
      updateOrgId = createResponse.body.data.id;
    });

    test('should update organization name and description (200)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.put(`${BASE_URL}/api/organizations/${updateOrgId}`, {
        data: {
          name: `Updated Hospital Name ${Date.now()}`,
          description: 'Updated description',
        },
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      if (body.success) {
        expect(body.data.name).toContain('Updated Hospital Name');
        expect(body.data.description).toBe('Updated description');
      }
    });

    test('should update organization type (200)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.put(`${BASE_URL}/api/organizations/${updateOrgId}`, {
        data: {
          type: 'laboratory',
        },
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      if (body.success) {
        expect(body.data.type).toBe('laboratory');
      }
    });

    test('should update organization contact info (200)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.put(`${BASE_URL}/api/organizations/${updateOrgId}`, {
        data: {
          contactEmail: 'new@email.com',
          contactPhone: '+9876543210',
          address: '456 New Street',
        },
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      if (body.success) {
        expect(body.data.contactEmail).toBe('new@email.com');
        expect(body.data.contactPhone).toBe('+9876543210');
        expect(body.data.address).toBe('456 New Street');
      }
    });

    test('should reject duplicate name when updating (409)', async ({ request }) => {
      // Crear segunda organización
      const org2Response = await createOrganization(
        request,
        `Second Org ${Date.now()}`,
        'clinic',
        superAdminToken
      );
      const org2Id = org2Response.body.data.id;

      // Obtener el nombre actual de la primera organización
      const getResponse = await get(
        request,
        `/api/organizations/${updateOrgId}`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );
      const existingName = getResponse.body.data.name;

      // Intentar actualizar la segunda con el nombre de la primera
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.put(`${BASE_URL}/api/organizations/${org2Id}`, {
        data: { name: existingName },
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('should reject invalid organization type (400)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.put(`${BASE_URL}/api/organizations/${updateOrgId}`, {
        data: { type: 'invalid_type' },
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.put(`${BASE_URL}/api/organizations/${updateOrgId}`, {
        data: { name: 'New Name' },
      });

      expect(response.status()).toBe(401);
    });

    test('should reject non-existent organization (404)', async ({ request }) => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.put(`${BASE_URL}/api/organizations/${fakeId}`, {
        data: { name: 'New Name' },
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('DELETE /api/organizations/:id', () => {
    let deleteOrgId: string;

    test.beforeAll(async ({ request }) => {
      // Crear organización para desactivar
      const createResponse = await createOrganization(
        request,
        `Delete Test Org ${Date.now()}`,
        'clinic',
        superAdminToken
      );
      deleteOrgId = createResponse.body.data.id;
    });

    test('should deactivate organization (200)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.delete(
        `${BASE_URL}/api/organizations/${deleteOrgId}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      if (body.success) {
        expect(body.data.id).toBe(deleteOrgId);
        expect(body.data.active).toBe(false);
      }

      // Verificar que está desactivada
      const getResponse = await get(
        request,
        `/api/organizations/${deleteOrgId}`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );
      expect(getResponse.body.data.active).toBe(false);
    });

    test('should be idempotent - deactivating already inactive organization succeeds (200)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.delete(
        `${BASE_URL}/api/organizations/${deleteOrgId}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.delete(
        `${BASE_URL}/api/organizations/${deleteOrgId}`
      );

      expect(response.status()).toBe(401);
    });

    test('should reject non-existent organization (404)', async ({ request }) => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.delete(
        `${BASE_URL}/api/organizations/${fakeId}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      expect(response.status()).toBe(404);
    });
  });
});
