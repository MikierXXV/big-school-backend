/**
 * ============================================
 * ROUTES: Auth
 * ============================================
 *
 * Definición de rutas de autenticación.
 * Estructura independiente del framework.
 *
 * RUTAS:
 * POST /auth/register - Registro
 * POST /auth/login - Login
 * POST /auth/refresh - Refresh token
 * POST /auth/logout - Logout
 */

/**
 * Métodos HTTP soportados.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Definición de una ruta.
 */
export interface RouteDefinition {
  /** Método HTTP */
  method: HttpMethod;
  /** Path de la ruta */
  path: string;
  /** Nombre del handler en el controlador */
  handler: string;
  /** ¿Requiere autenticación? */
  requiresAuth: boolean;
  /** Middlewares a aplicar */
  middlewares?: string[];
  /** Descripción para documentación */
  description?: string;
}

/**
 * Rutas de autenticación.
 * Base path: /auth
 */
export const AUTH_ROUTES: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/register',
    handler: 'register',
    requiresAuth: false,
    middlewares: ['validateRegisterRequest', 'rateLimitRegister'],
    description: 'Register a new user account',
  },
  {
    method: 'POST',
    path: '/login',
    handler: 'login',
    requiresAuth: false,
    middlewares: ['validateLoginRequest', 'rateLimitLogin'],
    description: 'Authenticate user and get tokens',
  },
  {
    method: 'POST',
    path: '/refresh',
    handler: 'refresh',
    requiresAuth: false, // El refresh token está en el body
    middlewares: ['validateRefreshRequest', 'rateLimitRefresh'],
    description: 'Refresh access token using refresh token',
  },
  {
    method: 'POST',
    path: '/logout',
    handler: 'logout',
    requiresAuth: true,
    middlewares: [],
    description: 'Revoke current session tokens',
  },
];

/**
 * Prefijo base para rutas de auth.
 */
export const AUTH_BASE_PATH = '/auth';
