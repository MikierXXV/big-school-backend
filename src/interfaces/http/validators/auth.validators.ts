/**
 * ============================================
 * VALIDATORS: Auth
 * ============================================
 *
 * Validadores para requests de autenticación.
 * Solo validan formato/estructura, NO reglas de negocio.
 *
 * Las validaciones incluyen:
 * - Campos requeridos presentes
 * - Tipos de datos correctos
 * - Formatos básicos (email pattern, longitud mínima)
 *
 * Las reglas de negocio (unicidad de email, fortaleza de password)
 * se validan en los casos de uso.
 */

import { ValidationFieldError } from '../../../application/errors/validation.errors.js';
import { RegisterUserRequestDto } from '../../../application/dtos/auth/register.dto.js';
import { LoginUserRequestDto } from '../../../application/dtos/auth/login.dto.js';
import { RefreshSessionRequestDto } from '../../../application/dtos/auth/refresh-session.dto.js';
import { VerifyEmailRequestDto } from '../../../application/dtos/auth/verify-email.dto.js';
import {
  RequestPasswordResetRequestDto,
  ConfirmPasswordResetRequestDto,
} from '../../../application/dtos/auth/password-reset.dto.js';

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
 * Regex básico para formato de email.
 * Validación más estricta se hace en el Value Object.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida request de registro.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateRegisterRequest(
  body: unknown
): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<RegisterUserRequestDto>;

  // Email
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (typeof data.email !== 'string') {
    errors.push({ field: 'email', message: 'Email must be a string' });
  } else if (!EMAIL_PATTERN.test(data.email)) {
    errors.push({
      field: 'email',
      message: 'Email must be a valid email address',
      receivedValue: data.email,
    });
  }

  // Password
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (typeof data.password !== 'string') {
    errors.push({ field: 'password', message: 'Password must be a string' });
  } else if (data.password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters',
      expectedFormat: 'Minimum 8 characters',
    });
  }

  // Password confirmation
  if (!data.passwordConfirmation) {
    errors.push({
      field: 'passwordConfirmation',
      message: 'Password confirmation is required',
    });
  }

  // First name
  if (!data.firstName) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  } else if (typeof data.firstName !== 'string') {
    errors.push({ field: 'firstName', message: 'First name must be a string' });
  } else if (data.firstName.trim().length < 1) {
    errors.push({ field: 'firstName', message: 'First name cannot be empty' });
  }

  // Last name
  if (!data.lastName) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  } else if (typeof data.lastName !== 'string') {
    errors.push({ field: 'lastName', message: 'Last name must be a string' });
  } else if (data.lastName.trim().length < 1) {
    errors.push({ field: 'lastName', message: 'Last name cannot be empty' });
  }

  // Accept terms
  if (data.acceptTerms === undefined) {
    errors.push({ field: 'acceptTerms', message: 'Terms acceptance is required' });
  } else if (typeof data.acceptTerms !== 'boolean') {
    errors.push({ field: 'acceptTerms', message: 'Accept terms must be a boolean' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida request de login.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateLoginRequest(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<LoginUserRequestDto>;

  // Email
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (typeof data.email !== 'string') {
    errors.push({ field: 'email', message: 'Email must be a string' });
  }

  // Password
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (typeof data.password !== 'string') {
    errors.push({ field: 'password', message: 'Password must be a string' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida request de refresh.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateRefreshRequest(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<RefreshSessionRequestDto>;

  // Refresh token
  if (!data.refreshToken) {
    errors.push({ field: 'refreshToken', message: 'Refresh token is required' });
  } else if (typeof data.refreshToken !== 'string') {
    errors.push({ field: 'refreshToken', message: 'Refresh token must be a string' });
  } else if (data.refreshToken.trim().length === 0) {
    errors.push({ field: 'refreshToken', message: 'Refresh token cannot be empty' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida request de verificación de email.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateVerifyEmailRequest(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<VerifyEmailRequestDto>;

  // Token
  if (!data.token) {
    errors.push({ field: 'token', message: 'Verification token is required' });
  } else if (typeof data.token !== 'string') {
    errors.push({ field: 'token', message: 'Verification token must be a string' });
  } else if (data.token.trim().length === 0) {
    errors.push({ field: 'token', message: 'Verification token cannot be empty' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida request de solicitud de recuperación de contraseña.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateRequestPasswordResetRequest(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<RequestPasswordResetRequestDto>;

  // Email
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (typeof data.email !== 'string') {
    errors.push({ field: 'email', message: 'Email must be a string' });
  } else if (!EMAIL_PATTERN.test(data.email)) {
    errors.push({
      field: 'email',
      message: 'Email must be a valid email address',
      receivedValue: data.email,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida request de confirmación de recuperación de contraseña.
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateConfirmPasswordResetRequest(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Partial<ConfirmPasswordResetRequestDto>;

  // Token
  if (!data.token) {
    errors.push({ field: 'token', message: 'Reset token is required' });
  } else if (typeof data.token !== 'string') {
    errors.push({ field: 'token', message: 'Reset token must be a string' });
  } else if (data.token.trim().length === 0) {
    errors.push({ field: 'token', message: 'Reset token cannot be empty' });
  }

  // New password
  if (!data.newPassword) {
    errors.push({ field: 'newPassword', message: 'New password is required' });
  } else if (typeof data.newPassword !== 'string') {
    errors.push({ field: 'newPassword', message: 'New password must be a string' });
  } else if (data.newPassword.length < 8) {
    errors.push({
      field: 'newPassword',
      message: 'New password must be at least 8 characters',
      expectedFormat: 'Minimum 8 characters',
    });
  }

  // Password confirmation
  if (!data.passwordConfirmation) {
    errors.push({
      field: 'passwordConfirmation',
      message: 'Password confirmation is required',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
