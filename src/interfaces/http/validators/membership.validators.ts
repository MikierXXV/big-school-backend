/**
 * ============================================
 * VALIDATORS: Membership
 * ============================================
 *
 * Validadores para requests de membresías organizacionales.
 * Solo validan formato/estructura, NO reglas de negocio.
 *
 * Las validaciones incluyen:
 * - Campos requeridos presentes
 * - Tipos de datos correctos
 * - Valores permitidos para roles
 *
 * Las reglas de negocio se validan en los casos de uso.
 */

import { ValidationFieldError } from '../../../application/errors/validation.errors.js';
import {
  AssignMemberRequestDto,
  ChangeMemberRoleRequestDto,
} from '../../../application/dtos/membership/membership.dto.js';

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
 * Roles organizacionales válidos.
 */
const VALID_ORGANIZATION_ROLES = [
  'org_admin',
  'doctor',
  'nurse',
  'specialist',
  'staff',
  'guest',
];

/**
 * Valida request de asignación de miembro.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateAssignMember(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<AssignMemberRequestDto>;

  // userId
  if (!data.userId) {
    errors.push({ field: 'userId', message: 'userId is required' });
  } else if (typeof data.userId !== 'string') {
    errors.push({ field: 'userId', message: 'userId must be a string' });
  } else if (data.userId.trim().length === 0) {
    errors.push({ field: 'userId', message: 'userId cannot be empty' });
  }

  // role
  if (!data.role) {
    errors.push({ field: 'role', message: 'role is required' });
  } else if (typeof data.role !== 'string') {
    errors.push({ field: 'role', message: 'role must be a string' });
  } else if (!VALID_ORGANIZATION_ROLES.includes(data.role)) {
    errors.push({
      field: 'role',
      message: `role must be one of: ${VALID_ORGANIZATION_ROLES.join(', ')}`,
      expectedFormat: VALID_ORGANIZATION_ROLES.join(', '),
      receivedValue: data.role,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida request de cambio de rol.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateChangeRole(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<ChangeMemberRoleRequestDto>;

  // newRole
  if (!data.newRole) {
    errors.push({ field: 'newRole', message: 'newRole is required' });
  } else if (typeof data.newRole !== 'string') {
    errors.push({ field: 'newRole', message: 'newRole must be a string' });
  } else if (!VALID_ORGANIZATION_ROLES.includes(data.newRole)) {
    errors.push({
      field: 'newRole',
      message: `newRole must be one of: ${VALID_ORGANIZATION_ROLES.join(', ')}`,
      expectedFormat: VALID_ORGANIZATION_ROLES.join(', '),
      receivedValue: data.newRole,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
