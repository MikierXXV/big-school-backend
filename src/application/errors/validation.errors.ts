/**
 * ============================================
 * APPLICATION ERRORS: Validation
 * ============================================
 *
 * Errores de validación en la capa de aplicación.
 * Se lanzan cuando los DTOs de entrada no cumplen requisitos.
 */

import { ApplicationError } from './application.error.js';

/**
 * Error de validación de datos de entrada.
 */
export class ValidationError extends ApplicationError {
  public readonly code = 'APP_VALIDATION_ERROR';
  public readonly httpStatusCode = 400;

  /**
   * Errores de validación detallados.
   */
  public readonly validationErrors: ValidationFieldError[];

  constructor(errors: ValidationFieldError[]) {
    super('Validation failed', { errors });
    this.validationErrors = errors;
  }
}

/**
 * Error de validación por campo.
 */
export interface ValidationFieldError {
  /** Nombre del campo */
  readonly field: string;
  /** Mensaje de error */
  readonly message: string;
  /** Valor recibido (sanitizado si es sensible) */
  readonly receivedValue?: unknown;
  /** Valor esperado o formato */
  readonly expectedFormat?: string;
}

/**
 * Error: Contraseñas no coinciden.
 */
export class PasswordMismatchError extends ApplicationError {
  public readonly code = 'APP_PASSWORD_MISMATCH';
  public readonly httpStatusCode = 400;

  constructor() {
    super('Password and password confirmation do not match');
  }
}

/**
 * Error: Términos no aceptados.
 */
export class TermsNotAcceptedError extends ApplicationError {
  public readonly code = 'APP_TERMS_NOT_ACCEPTED';
  public readonly httpStatusCode = 400;

  constructor() {
    super('You must accept the terms and conditions');
  }
}

/**
 * Error: Campo requerido faltante.
 */
export class RequiredFieldMissingError extends ApplicationError {
  public readonly code = 'APP_REQUIRED_FIELD_MISSING';
  public readonly httpStatusCode = 400;

  constructor(fieldName: string) {
    super(`Required field '${fieldName}' is missing`, { field: fieldName });
  }
}

/**
 * Error: Formato de campo inválido.
 */
export class InvalidFieldFormatError extends ApplicationError {
  public readonly code = 'APP_INVALID_FIELD_FORMAT';
  public readonly httpStatusCode = 400;

  constructor(fieldName: string, expectedFormat: string) {
    super(`Field '${fieldName}' has invalid format. Expected: ${expectedFormat}`, {
      field: fieldName,
      expectedFormat,
    });
  }
}
