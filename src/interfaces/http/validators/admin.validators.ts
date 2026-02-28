/**
 * ============================================
 * VALIDATORS: Admin
 * ============================================
 *
 * Validadores para requests de administración.
 * Solo validan formato/estructura, NO reglas de negocio.
 *
 * Las validaciones incluyen:
 * - Campos requeridos presentes
 * - Tipos de datos correctos
 * - Valores permitidos para enums
 *
 * Las reglas de negocio se validan en los casos de uso.
 */

import { ValidationFieldError } from '../../../application/errors/validation.errors.js';
import {
  PromoteToAdminRequestDto,
  DemoteToUserRequestDto,
  GrantPermissionRequestDto,
  RevokePermissionRequestDto,
} from '../../../application/dtos/admin/admin.dto.js';

/**
 * Resultado de validación.
 */
export interface ValidationResult {
  /** ¿Es válido? */
  isValid: boolean;
  /** Errores encontrados */
  errors: ValidationFieldError[];
}

/**
 * Valida request de promoción a admin.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validatePromoteToAdmin(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<PromoteToAdminRequestDto>;

  // userId
  if (!data.userId) {
    errors.push({ field: 'userId', message: 'userId is required' });
  } else if (typeof data.userId !== 'string') {
    errors.push({ field: 'userId', message: 'userId must be a string' });
  } else if (data.userId.trim().length === 0) {
    errors.push({ field: 'userId', message: 'userId cannot be empty' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida request de demostración de admin.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateDemoteFromAdmin(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<DemoteToUserRequestDto>;

  // userId
  if (!data.userId) {
    errors.push({ field: 'userId', message: 'userId is required' });
  } else if (typeof data.userId !== 'string') {
    errors.push({ field: 'userId', message: 'userId must be a string' });
  } else if (data.userId.trim().length === 0) {
    errors.push({ field: 'userId', message: 'userId cannot be empty' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Permisos de admin válidos.
 */
const VALID_ADMIN_PERMISSIONS = [
  'manage_users',
  'manage_organizations',
  'assign_members',
  'view_all_data',
];

/**
 * Valida request de otorgamiento de permiso.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateGrantPermission(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<GrantPermissionRequestDto>;

  // userId
  if (!data.userId) {
    errors.push({ field: 'userId', message: 'userId is required' });
  } else if (typeof data.userId !== 'string') {
    errors.push({ field: 'userId', message: 'userId must be a string' });
  } else if (data.userId.trim().length === 0) {
    errors.push({ field: 'userId', message: 'userId cannot be empty' });
  }

  // permissions (array)
  if (!data.permissions) {
    errors.push({ field: 'permissions', message: 'permissions is required' });
  } else if (!Array.isArray(data.permissions)) {
    errors.push({ field: 'permissions', message: 'permissions must be an array' });
  } else if (data.permissions.length === 0) {
    errors.push({ field: 'permissions', message: 'permissions cannot be empty' });
  } else {
    const invalidPermissions = data.permissions.filter(
      p => typeof p !== 'string' || !VALID_ADMIN_PERMISSIONS.includes(p)
    );
    if (invalidPermissions.length > 0) {
      errors.push({
        field: 'permissions',
        message: `All permissions must be one of: ${VALID_ADMIN_PERMISSIONS.join(', ')}`,
        expectedFormat: VALID_ADMIN_PERMISSIONS.join(', '),
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida request de revocación de permiso.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateRevokePermission(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<RevokePermissionRequestDto>;

  // userId
  if (!data.userId) {
    errors.push({ field: 'userId', message: 'userId is required' });
  } else if (typeof data.userId !== 'string') {
    errors.push({ field: 'userId', message: 'userId must be a string' });
  } else if (data.userId.trim().length === 0) {
    errors.push({ field: 'userId', message: 'userId cannot be empty' });
  }

  // permission
  if (!data.permission) {
    errors.push({ field: 'permission', message: 'permission is required' });
  } else if (typeof data.permission !== 'string') {
    errors.push({ field: 'permission', message: 'permission must be a string' });
  } else if (!VALID_ADMIN_PERMISSIONS.includes(data.permission)) {
    errors.push({
      field: 'permission',
      message: `permission must be one of: ${VALID_ADMIN_PERMISSIONS.join(', ')}`,
      expectedFormat: VALID_ADMIN_PERMISSIONS.join(', '),
      receivedValue: data.permission,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
