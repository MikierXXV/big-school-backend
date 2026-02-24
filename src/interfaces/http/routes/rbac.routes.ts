/**
 * ============================================
 * ROUTES: RBAC (Feature 012)
 * ============================================
 *
 * Rutas HTTP para administración, organizaciones y membresías.
 * Incluye control de acceso basado en roles y permisos.
 */

import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { OrganizationController } from '../controllers/organization.controller.js';
import { OrganizationMembershipController } from '../controllers/organization-membership.controller.js';
import { AuthorizationMiddleware, AuthorizationMiddlewareOptions } from '../middlewares/authorization.middleware.js';
import { adaptRoute } from '../adapters/route-adapter.js';
import { createValidationMiddleware } from '../adapters/validation.adapter.js';
import { toHttpRequest } from '../adapters/express.adapter.js';
import {
  validatePromoteToAdmin,
  validateDemoteFromAdmin,
  validateGrantPermission,
  validateRevokePermission,
} from '../validators/admin.validators.js';
import {
  validateCreateOrganization,
  validateUpdateOrganization,
} from '../validators/organization.validators.js';
import {
  validateAssignMember,
  validateChangeRole,
} from '../validators/membership.validators.js';

/**
 * Crea un middleware de Express para verificar permisos.
 *
 * @param authMiddleware - Middleware de autorización
 * @param options - Opciones de autorización
 * @returns RequestHandler de Express
 */
function createAuthorizationMiddleware(
  authMiddleware: AuthorizationMiddleware,
  options: AuthorizationMiddlewareOptions
): RequestHandler {
  const checkPermissionFn = authMiddleware.checkPermission(options);

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const httpRequest = toHttpRequest(req);
      await checkPermissionFn(httpRequest);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Crea el router de rutas RBAC.
 *
 * @param adminController - Controller de administración
 * @param organizationController - Controller de organizaciones
 * @param membershipController - Controller de membresías
 * @param authorizationMiddleware - Middleware de autorización
 * @returns Router configurado con todas las rutas RBAC
 */
export function createRBACRoutes(
  adminController: AdminController,
  organizationController: OrganizationController,
  membershipController: OrganizationMembershipController,
  authorizationMiddleware: AuthorizationMiddleware
): Router {
  const router = Router();

  // ============================================
  // Admin Routes (require SUPER_ADMIN)
  // ============================================
  router.post(
    '/admin/promote',
    createValidationMiddleware(validatePromoteToAdmin),
    createAuthorizationMiddleware(authorizationMiddleware, { requireSuperAdmin: true }),
    adaptRoute(adminController, 'promote')
  );

  router.post(
    '/admin/demote',
    createValidationMiddleware(validateDemoteFromAdmin),
    createAuthorizationMiddleware(authorizationMiddleware, { requireSuperAdmin: true }),
    adaptRoute(adminController, 'demote')
  );

  router.post(
    '/admin/permissions/grant',
    createValidationMiddleware(validateGrantPermission),
    createAuthorizationMiddleware(authorizationMiddleware, { requireSuperAdmin: true }),
    adaptRoute(adminController, 'grantPermission')
  );

  router.post(
    '/admin/permissions/revoke',
    createValidationMiddleware(validateRevokePermission),
    createAuthorizationMiddleware(authorizationMiddleware, { requireSuperAdmin: true }),
    adaptRoute(adminController, 'revokePermission')
  );

  router.get(
    '/admin/list',
    createAuthorizationMiddleware(authorizationMiddleware, { requireSuperAdmin: true }),
    adaptRoute(adminController, 'list')
  );

  // ============================================
  // Organization Routes
  // ============================================
  router.post(
    '/organizations',
    createValidationMiddleware(validateCreateOrganization),
    createAuthorizationMiddleware(authorizationMiddleware, { permission: 'manage_organizations' }),
    adaptRoute(organizationController, 'create')
  );

  router.get(
    '/organizations',
    createAuthorizationMiddleware(authorizationMiddleware, { permission: 'view_all_data' }),
    adaptRoute(organizationController, 'list')
  );

  router.get(
    '/organizations/:id',
    createAuthorizationMiddleware(authorizationMiddleware, { permission: 'view_all_data' }),
    adaptRoute(organizationController, 'getById')
  );

  router.put(
    '/organizations/:id',
    createValidationMiddleware(validateUpdateOrganization),
    createAuthorizationMiddleware(authorizationMiddleware, { permission: 'manage_organizations' }),
    adaptRoute(organizationController, 'update')
  );

  router.delete(
    '/organizations/:id',
    createAuthorizationMiddleware(authorizationMiddleware, { permission: 'manage_organizations' }),
    adaptRoute(organizationController, 'deactivate')
  );

  // ============================================
  // Membership Routes
  // ============================================
  router.post(
    '/organizations/:organizationId/members',
    createValidationMiddleware(validateAssignMember),
    createAuthorizationMiddleware(authorizationMiddleware, {
      permission: 'assign_members',
      organizationIdParam: 'organizationId',
    }),
    adaptRoute(membershipController, 'assign')
  );

  router.delete(
    '/organizations/:organizationId/members/:userId',
    createAuthorizationMiddleware(authorizationMiddleware, {
      permission: 'assign_members',
      organizationIdParam: 'organizationId',
    }),
    adaptRoute(membershipController, 'remove')
  );

  router.patch(
    '/organizations/:organizationId/members/:userId/role',
    createValidationMiddleware(validateChangeRole),
    createAuthorizationMiddleware(authorizationMiddleware, {
      permission: 'assign_members',
      organizationIdParam: 'organizationId',
    }),
    adaptRoute(membershipController, 'changeRole')
  );

  router.get(
    '/organizations/:organizationId/members',
    createAuthorizationMiddleware(authorizationMiddleware, {
      permission: 'view_all_data',
      organizationIdParam: 'organizationId',
    }),
    adaptRoute(membershipController, 'getMembers')
  );

  router.get(
    '/users/:userId/organizations',
    createAuthorizationMiddleware(authorizationMiddleware, { permission: 'view_all_data' }),
    adaptRoute(membershipController, 'getUserOrganizations')
  );

  return router;
}
