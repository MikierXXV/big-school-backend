/**
 * ============================================
 * ROUTES: Health
 * ============================================
 *
 * Rutas de health checks.
 * No requieren autenticación.
 */

import { RouteDefinition } from './auth.routes.js';

/**
 * Rutas de health check.
 * Base path: /health
 */
export const HEALTH_ROUTES: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/',
    handler: 'health',
    requiresAuth: false,
    description: 'Basic health check',
  },
  {
    method: 'GET',
    path: '/ready',
    handler: 'ready',
    requiresAuth: false,
    description: 'Readiness probe - checks all dependencies',
  },
  {
    method: 'GET',
    path: '/live',
    handler: 'live',
    requiresAuth: false,
    description: 'Liveness probe - checks process is alive',
  },
];

/**
 * Prefijo base para rutas de health.
 */
export const HEALTH_BASE_PATH = '/health';
