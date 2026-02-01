/**
 * ============================================
 * VITEST CONFIGURATION
 * ============================================
 *
 * Configuración de Vitest para tests unitarios y de integración.
 * Alineado con TDD y Clean Architecture.
 *
 * ESTRUCTURA DE TESTS:
 * - tests/unit/       → Tests unitarios (dominio y casos de uso)
 * - tests/integration/ → Tests de integración (adaptadores)
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Entorno de ejecución
    environment: 'node',

    // Incluir archivos de test
    include: ['tests/**/*.{test,spec}.ts'],

    // Excluir E2E (se ejecutan con Playwright)
    exclude: ['tests/e2e/**/*', 'node_modules'],

    // Cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'tests',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts',
      ],
      // Umbrales mínimos de cobertura
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Globals para describe, it, expect sin importar
    globals: true,

    // Timeout por test
    testTimeout: 10000,

    // Hooks timeout
    hookTimeout: 10000,
  },

  // Aliases para Clean Architecture
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@interfaces': path.resolve(__dirname, './src/interfaces'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
