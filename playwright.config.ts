/**
 * ============================================
 * PLAYWRIGHT CONFIGURATION
 * ============================================
 *
 * Configuración de Playwright para tests End-to-End (E2E).
 * Estos tests validan flujos completos de autenticación.
 *
 * FLUJOS E2E A TESTEAR:
 * - Registro de usuario completo
 * - Login y obtención de tokens
 * - Refresh de sesión
 * - Logout y revocación de tokens
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directorio de tests E2E
  testDir: './tests/e2e',

  // Configuración de ejecución
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
  ],

  // Configuración global
  use: {
    // URL base del servidor de tests
    baseURL: process.env['TEST_BASE_URL'] || 'http://localhost:3000',

    // Trazas en caso de fallo
    trace: 'on-first-retry',

    // Screenshots
    screenshot: 'only-on-failure',
  },

  // Timeout global
  timeout: 30000,

  // Proyectos/Navegadores (para API tests no necesitamos navegadores)
  projects: [
    {
      name: 'api-tests',
      testMatch: /.*\.e2e\.ts/,
    },
  ],

  // Servidor de desarrollo para tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/health',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },
});
