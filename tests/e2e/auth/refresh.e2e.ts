/**
 * ============================================
 * E2E TEST: Session Refresh
 * ============================================
 *
 * Tests End-to-End para el flujo de refresh.
 *
 * FLUJO COMPLETO:
 * 1. Login para obtener tokens
 * 2. POST /auth/refresh con refresh token
 * 3. Verificar nuevos tokens
 * 4. Verificar que el viejo refresh token ya no funciona (rotación)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env['TEST_BASE_URL'] || 'http://localhost:3000';

test.describe('Session Refresh E2E', () => {
  test.describe('POST /auth/refresh', () => {
    test.skip('should refresh session with valid token', async ({ request }) => {
      // TODO: Implementar
      // 1. Login para obtener refresh token
      // 2. POST /auth/refresh
      // 3. Verificar nuevos tokens
      // 4. Verificar que access token tiene nueva expiración
    });

    test.skip('should rotate refresh token', async ({ request }) => {
      // TODO: Implementar
      // 1. Refresh session
      // 2. Intentar usar el viejo refresh token
      // 3. Debe fallar (token rotado)
    });

    test.skip('should reject expired refresh token', async ({ request }) => {
      // TODO: Implementar
    });

    test.skip('should reject revoked refresh token', async ({ request }) => {
      // TODO: Implementar
    });

    test.skip('SECURITY: should detect token reuse and revoke family', async ({ request }) => {
      // TODO: Implementar test crítico de seguridad
      // 1. Login (obtener refresh token A)
      // 2. Refresh (token A -> token B, A marcado como ROTATED)
      // 3. Intentar usar token A de nuevo (simula atacante)
      // 4. Debe detectar reuso
      // 5. Debe revocar toda la familia (A, B y cualquier descendiente)
      // 6. Token B ya no debe funcionar
    });
  });
});
