/**
 * ============================================
 * VALIDATORS: Organization
 * ============================================
 *
 * Validadores para requests de organizaciones.
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
  CreateOrganizationRequestDto,
  UpdateOrganizationRequestDto,
} from '../../../application/dtos/organization/organization.dto.js';

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
 * Tipos de organización válidos.
 */
const VALID_ORGANIZATION_TYPES = [
  'hospital',
  'clinic',
  'health_center',
  'laboratory',
  'pharmacy',
  'other',
];

/**
 * Valida request de creación de organización.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateCreateOrganization(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<CreateOrganizationRequestDto>;

  // name
  if (!data.name) {
    errors.push({ field: 'name', message: 'name is required' });
  } else if (typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'name must be a string' });
  } else if (data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'name cannot be empty' });
  }

  // type
  if (!data.type) {
    errors.push({ field: 'type', message: 'type is required' });
  } else if (typeof data.type !== 'string') {
    errors.push({ field: 'type', message: 'type must be a string' });
  } else if (!VALID_ORGANIZATION_TYPES.includes(data.type)) {
    errors.push({
      field: 'type',
      message: `type must be one of: ${VALID_ORGANIZATION_TYPES.join(', ')}`,
      expectedFormat: VALID_ORGANIZATION_TYPES.join(', '),
      receivedValue: data.type,
    });
  }

  // description (optional)
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push({ field: 'description', message: 'description must be a string' });
  }

  // address (optional)
  if (data.address !== undefined && typeof data.address !== 'string') {
    errors.push({ field: 'address', message: 'address must be a string' });
  }

  // contactEmail (optional)
  if (data.contactEmail !== undefined && typeof data.contactEmail !== 'string') {
    errors.push({ field: 'contactEmail', message: 'contactEmail must be a string' });
  }

  // contactPhone (optional)
  if (data.contactPhone !== undefined && typeof data.contactPhone !== 'string') {
    errors.push({ field: 'contactPhone', message: 'contactPhone must be a string' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida request de actualización de organización.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateUpdateOrganization(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<UpdateOrganizationRequestDto>;

  // All fields are optional for update, but must have correct type if provided

  // name (optional)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push({ field: 'name', message: 'name must be a string' });
    } else if (data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'name cannot be empty' });
    }
  }

  // Note: type cannot be updated after creation

  // description (optional)
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push({ field: 'description', message: 'description must be a string' });
  }

  // address (optional)
  if (data.address !== undefined && typeof data.address !== 'string') {
    errors.push({ field: 'address', message: 'address must be a string' });
  }

  // contactEmail (optional)
  if (data.contactEmail !== undefined && typeof data.contactEmail !== 'string') {
    errors.push({ field: 'contactEmail', message: 'contactEmail must be a string' });
  }

  // contactPhone (optional)
  if (data.contactPhone !== undefined && typeof data.contactPhone !== 'string') {
    errors.push({ field: 'contactPhone', message: 'contactPhone must be a string' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
