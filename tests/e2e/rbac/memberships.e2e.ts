/**
 * ============================================
 * E2E TEST: Membership Management (Feature 012)
 * ============================================
 *
 * Tests End-to-End para el flujo de gestión de membresías.
 * Prueba asignación, cambio de rol, y eliminación de miembros.
 */

import { test, expect } from '@playwright/test';
import { generateUniqueEmail, generateValidPassword } from '../helpers/test-data.helper.js';
import { registerUser, verifyUserEmail, loginUser } from '../helpers/auth.helper.js';
import { post, get } from '../helpers/api.helper.js';
import { createOrganization, assignMember, removeMember, changeMemberRole } from '../helpers/rbac.helper.js';

test.describe('RBAC - Membership Management E2E', () => {
  let superAdminToken: string;
  let organizationId: string;
  let userId: string;
  let userEmail: string;
  let userPassword: string;

  test.beforeAll(async ({ request }) => {
    // Login como SUPER_ADMIN
    const superAdminLogin = await loginUser(
      request,
      'superadmin@healthcaresuite.com',
      'Hc$2026!Sup3rAdm1n#Secur3Pass'
    );
    superAdminToken = superAdminLogin.tokens.accessToken;

    // Crear organización
    const orgResponse = await createOrganization(
      request,
      `Test Org for Memberships ${Date.now()}`,
      'hospital',
      superAdminToken
    );
    organizationId = orgResponse.body.data.id;

    // Crear usuario regular
    const password = generateValidPassword();
    const userData = {
      email: generateUniqueEmail(),
      password,
      passwordConfirmation: password,
      firstName: 'Member',
      lastName: 'Test',
      acceptTerms: true,
    };
    userPassword = password;

    const { registeredUser } = await registerUser(request, userData);
    await verifyUserEmail(request, registeredUser.verificationToken!);
    userId = registeredUser.id;
    userEmail = registeredUser.email;
  });

  test.describe('POST /api/organizations/:organizationId/members', () => {
    test('should assign member to organization (201)', async ({ request }) => {
      const response = await post(
        request,
        `/api/organizations/${organizationId}/members`,
        {
          userId,
          role: 'doctor',
        },
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.userId).toBe(userId);
        expect(response.body.data.organizationId).toBe(organizationId);
        expect(response.body.data.role).toBe('doctor');
        expect(response.body.data).toHaveProperty('joinedAt');
      }
    });

    test('should reject duplicate membership (409)', async ({ request }) => {
      const response = await post(
        request,
        `/api/organizations/${organizationId}/members`,
        {
          userId,
          role: 'nurse',
        },
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      if (!response.body.success) {
        expect(response.body.error.code).toBe('DOMAIN_MEMBERSHIP_ALREADY_EXISTS');
      }
    });

    test('should reject invalid organization role (400)', async ({ request }) => {
      // Crear nuevo usuario para esta prueba
      const password = generateValidPassword();
      const userData = {
        email: generateUniqueEmail(),
        password,
        passwordConfirmation: password,
        firstName: 'Test',
        lastName: 'Invalid',
        acceptTerms: true,
      };

      const { registeredUser } = await registerUser(request, userData);
      await verifyUserEmail(request, registeredUser.verificationToken!);

      const response = await post(
        request,
        `/api/organizations/${organizationId}/members`,
        {
          userId: registeredUser.id,
          role: 'invalid_role',
        },
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should accept all valid organization roles', async ({ request }) => {
      const roles = ['org_admin', 'doctor', 'nurse', 'specialist', 'staff', 'guest'];

      for (const role of roles) {
        // Crear usuario único para cada rol
        const userData = {
          email: generateUniqueEmail(),
          password: generateValidPassword(),
          passwordConfirmation: '',
          firstName: 'Test',
          lastName: role,
          acceptTerms: true,
        };
        userData.passwordConfirmation = userData.password;

        const { registeredUser } = await registerUser(request, userData);
        await verifyUserEmail(request, registeredUser.verificationToken!);

        const response = await post(
          request,
          `/api/organizations/${organizationId}/members`,
          {
            userId: registeredUser.id,
            role,
          },
          { headers: { Authorization: `Bearer ${superAdminToken}` } }
        );

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        if (response.body.success) {
          expect(response.body.data.role).toBe(role);
        }
      }
    });

    test('should reject non-existent user (404)', async ({ request }) => {
      const fakeUserId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await post(
        request,
        `/api/organizations/${organizationId}/members`,
        {
          userId: fakeUserId,
          role: 'doctor',
        },
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-existent organization (404)', async ({ request }) => {
      const fakeOrgId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await post(
        request,
        `/api/organizations/${fakeOrgId}/members`,
        {
          userId,
          role: 'doctor',
        },
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await post(
        request,
        `/api/organizations/${organizationId}/members`,
        {
          userId,
          role: 'doctor',
        }
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject missing required fields - userId (400)', async ({ request }) => {
      const response = await post(
        request,
        `/api/organizations/${organizationId}/members`,
        {
          role: 'doctor', // Missing userId
        },
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject missing required fields - role (400)', async ({ request }) => {
      const userData = {
        email: generateUniqueEmail(),
        password: generateValidPassword(),
        passwordConfirmation: '',
        firstName: 'Test',
        lastName: 'NoRole',
        acceptTerms: true,
      };
      userData.passwordConfirmation = userData.password;

      const { registeredUser } = await registerUser(request, userData);
      await verifyUserEmail(request, registeredUser.verificationToken!);

      const response = await post(
        request,
        `/api/organizations/${organizationId}/members`,
        {
          userId: registeredUser.id, // Missing role
        },
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid UUID format for userId (400)', async ({ request }) => {
      const response = await post(
        request,
        `/api/organizations/${organizationId}/members`,
        {
          userId: 'invalid-uuid',
          role: 'doctor',
        },
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('GET /api/organizations/:organizationId/members', () => {
    test('should get all members of organization (200)', async ({ request }) => {
      const response = await get(
        request,
        `/api/organizations/${organizationId}/members`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(Array.isArray(response.body.data.members)).toBe(true);
        expect(response.body.data.members.length).toBeGreaterThan(0);

        // Verificar estructura de un member
        const member = response.body.data.members[0];
        expect(member).toHaveProperty('userId');
        expect(member).toHaveProperty('email');
        expect(member).toHaveProperty('firstName');
        expect(member).toHaveProperty('lastName');
        expect(member).toHaveProperty('role');
        expect(member).toHaveProperty('joinedAt');
      }
    });

    test('should support pagination', async ({ request }) => {
      const response = await get(
        request,
        `/api/organizations/${organizationId}/members?page=1&limit=3`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      if (response.body.success) {
        expect(response.body.data.members.length).toBeLessThanOrEqual(3);
        expect(response.body.data).toHaveProperty('total');
        expect(response.body.data).toHaveProperty('page');
        expect(response.body.data).toHaveProperty('limit');
      }
    });

    test('should filter by role', async ({ request }) => {
      const response = await get(
        request,
        `/api/organizations/${organizationId}/members?role=doctor`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      if (response.body.success) {
        response.body.data.members.forEach((member: any) => {
          expect(member.role).toBe('doctor');
        });
      }
    });

    test('should return only creator for newly created organization', async ({ request }) => {
      // Crear nueva organización (automáticamente agrega al creador como org_admin)
      const newOrgResponse = await createOrganization(
        request,
        `New Org ${Date.now()}`,
        'clinic',
        superAdminToken
      );
      const newOrgId = newOrgResponse.body.data.id;

      const response = await get(
        request,
        `/api/organizations/${newOrgId}/members`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      if (response.body.success) {
        expect(response.body.data.members.length).toBe(1);
        expect(response.body.data.total).toBe(1);
        expect(response.body.data.members[0].role).toBe('org_admin');
      }
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await get(
        request,
        `/api/organizations/${organizationId}/members`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-existent organization (404)', async ({ request }) => {
      const fakeOrgId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await get(
        request,
        `/api/organizations/${fakeOrgId}/members`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('PATCH /api/organizations/:organizationId/members/:userId/role', () => {
    let changeRoleUserId: string;

    test.beforeAll(async ({ request }) => {
      // Crear usuario para cambiar rol
      const userData = {
        email: generateUniqueEmail(),
        password: generateValidPassword(),
        passwordConfirmation: '',
        firstName: 'Role',
        lastName: 'Change',
        acceptTerms: true,
      };
      userData.passwordConfirmation = userData.password;

      const { registeredUser } = await registerUser(request, userData);
      await verifyUserEmail(request, registeredUser.verificationToken!);
      changeRoleUserId = registeredUser.id;

      // Asignar al organización
      await assignMember(request, organizationId, changeRoleUserId, 'staff', superAdminToken);
    });

    test('should change member role (200)', async ({ request }) => {
      const response = await changeMemberRole(
        request,
        organizationId,
        changeRoleUserId,
        'nurse',
        superAdminToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.userId).toBe(changeRoleUserId);
        expect(response.body.data.organizationId).toBe(organizationId);
        expect(response.body.data.role).toBe('nurse');
      }
    });

    test('should allow changing to all valid roles', async ({ request }) => {
      const roles = ['org_admin', 'doctor', 'specialist', 'staff', 'guest'];

      for (const role of roles) {
        const response = await changeMemberRole(
          request,
          organizationId,
          changeRoleUserId,
          role,
          superAdminToken
        );

        expect(response.status).toBe(200);
        if (response.body.success) {
          expect(response.body.data.role).toBe(role);
        }
      }
    });

    test('should reject invalid new role (400)', async ({ request }) => {
      const response = await changeMemberRole(
        request,
        organizationId,
        changeRoleUserId,
        'invalid_role',
        superAdminToken
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-existent membership (404)', async ({ request }) => {
      const fakeUserId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await changeMemberRole(
        request,
        organizationId,
        fakeUserId,
        'doctor',
        superAdminToken
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.patch(
        `${BASE_URL}/api/organizations/${organizationId}/members/${changeRoleUserId}/role`,
        {
          data: { newRole: 'doctor' },
        }
      );

      expect(response.status()).toBe(401);
    });

    test('should reject missing newRole field (400)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.patch(
        `${BASE_URL}/api/organizations/${organizationId}/members/${changeRoleUserId}/role`,
        {
          data: {}, // Missing newRole
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/users/:userId/organizations', () => {
    test.beforeAll(async ({ request }) => {
      // Ensure user is assigned to the organization (idempotent - ignore if already assigned)
      try {
        await assignMember(request, organizationId, userId, 'doctor', superAdminToken);
      } catch (error) {
        // User may already be assigned from previous tests - ignore 409 errors
        if (!(error instanceof Error && error.message.includes('409'))) {
          throw error;
        }
      }
    });

    test('should get all organizations of user (200)', async ({ request }) => {
      const response = await get(
        request,
        `/api/users/${userId}/organizations`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(Array.isArray(response.body.data.organizations)).toBe(true);
        expect(response.body.data.organizations.length).toBeGreaterThan(0);

        // Verificar estructura
        const org = response.body.data.organizations[0];
        expect(org).toHaveProperty('organizationId');
        expect(org).toHaveProperty('organizationName');
        expect(org).toHaveProperty('organizationType');
        expect(org).toHaveProperty('role');
        expect(org).toHaveProperty('joinedAt');
      }
    });

    test('should return empty array for user with no organizations', async ({ request }) => {
      // Crear usuario sin organizaciones
      const userData = {
        email: generateUniqueEmail(),
        password: generateValidPassword(),
        passwordConfirmation: '',
        firstName: 'No',
        lastName: 'Orgs',
        acceptTerms: true,
      };
      userData.passwordConfirmation = userData.password;

      const { registeredUser } = await registerUser(request, userData);
      await verifyUserEmail(request, registeredUser.verificationToken!);

      const response = await get(
        request,
        `/api/users/${registeredUser.id}/organizations`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      if (response.body.success) {
        expect(response.body.data.organizations).toEqual([]);
        expect(response.body.data.total).toBe(0);
      }
    });

    test('should support pagination', async ({ request }) => {
      const response = await get(
        request,
        `/api/users/${userId}/organizations?page=1&limit=5`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(200);
      if (response.body.success) {
        expect(response.body.data.organizations.length).toBeLessThanOrEqual(5);
      }
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const response = await get(
        request,
        `/api/users/${userId}/organizations`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-existent user (404)', async ({ request }) => {
      const fakeUserId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await get(
        request,
        `/api/users/${fakeUserId}/organizations`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid UUID format (400)', async ({ request }) => {
      const response = await get(
        request,
        '/api/users/invalid-uuid/organizations',
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('DELETE /api/organizations/:organizationId/members/:userId', () => {
    let removeUserId: string;

    test.beforeAll(async ({ request }) => {
      // Crear usuario para remover
      const userData = {
        email: generateUniqueEmail(),
        password: generateValidPassword(),
        passwordConfirmation: '',
        firstName: 'Remove',
        lastName: 'Me',
        acceptTerms: true,
      };
      userData.passwordConfirmation = userData.password;

      const { registeredUser } = await registerUser(request, userData);
      await verifyUserEmail(request, registeredUser.verificationToken!);
      removeUserId = registeredUser.id;

      // Asignar al organización
      await assignMember(request, organizationId, removeUserId, 'guest', superAdminToken);
    });

    test('should remove member from organization (200)', async ({ request }) => {
      const response = await removeMember(
        request,
        organizationId,
        removeUserId,
        superAdminToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.success) {
        expect(response.body.data.userId).toBe(removeUserId);
        expect(response.body.data.organizationId).toBe(organizationId);
      }

      // Verificar que ya no está en la lista
      const listResponse = await get(
        request,
        `/api/organizations/${organizationId}/members`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );

      if (listResponse.body.success) {
        const member = listResponse.body.data.members.find((m: any) => m.userId === removeUserId);
        expect(member).toBeUndefined();
      }
    });

    test('should return 404 when removing already removed member', async ({ request }) => {
      // First, ensure the member is removed
      await removeMember(
        request,
        organizationId,
        removeUserId,
        superAdminToken
      );

      // Then try to remove again - should fail with 404
      const response = await removeMember(
        request,
        organizationId,
        removeUserId,
        superAdminToken
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should reject without authentication (401)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.delete(
        `${BASE_URL}/api/organizations/${organizationId}/members/${userId}`
      );

      expect(response.status()).toBe(401);
    });

    test('should reject non-existent organization (404)', async ({ request }) => {
      const fakeOrgId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await removeMember(
        request,
        fakeOrgId,
        userId,
        superAdminToken
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid UUID format (400)', async ({ request }) => {
      const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const response = await request.delete(
        `${BASE_URL}/api/organizations/${organizationId}/members/invalid-uuid`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Integration - Full Membership Lifecycle', () => {
    test('should handle complete member lifecycle: assign -> change role -> remove', async ({ request }) => {
      // 1. Crear usuario
      const userData = {
        email: generateUniqueEmail(),
        password: generateValidPassword(),
        passwordConfirmation: '',
        firstName: 'Lifecycle',
        lastName: 'Test',
        acceptTerms: true,
      };
      userData.passwordConfirmation = userData.password;

      const { registeredUser } = await registerUser(request, userData);
      await verifyUserEmail(request, registeredUser.verificationToken!);

      // 2. Asignar como staff
      const assignResponse = await assignMember(
        request,
        organizationId,
        registeredUser.id,
        'staff',
        superAdminToken
      );
      expect(assignResponse.status).toBe(201);
      expect(assignResponse.body.data.role).toBe('staff');

      // 3. Cambiar a doctor
      const changeResponse = await changeMemberRole(
        request,
        organizationId,
        registeredUser.id,
        'doctor',
        superAdminToken
      );
      expect(changeResponse.status).toBe(200);
      expect(changeResponse.body.data.role).toBe('doctor');

      // 4. Verificar en lista
      const listResponse = await get(
        request,
        `/api/organizations/${organizationId}/members`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );
      const member = listResponse.body.data.members.find((m: any) => m.userId === registeredUser.id);
      expect(member.role).toBe('doctor');

      // 5. Remover
      const removeResponse = await removeMember(
        request,
        organizationId,
        registeredUser.id,
        superAdminToken
      );
      expect(removeResponse.status).toBe(200);

      // 6. Verificar que ya no está
      const finalListResponse = await get(
        request,
        `/api/organizations/${organizationId}/members`,
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );
      const removedMember = finalListResponse.body.data.members.find((m: any) => m.userId === registeredUser.id);
      expect(removedMember).toBeUndefined();
    });
  });
});
