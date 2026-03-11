/**
 * ============================================
 * VALIDATORS: OAuth
 * ============================================
 *
 * Validadores para requests de OAuth.
 * Solo validan formato/estructura, NO reglas de negocio.
 */

import { ValidationFieldError } from '../../../application/errors/validation.errors.js';
import { ValidationResult } from './auth.validators.js';

const SUPPORTED_PROVIDERS = ['google', 'microsoft'];

/**
 * Valida request de callback OAuth (POST /auth/oauth/callback).
 *
 * @param body - Body del request
 * @returns Resultado de validación
 */
export function validateOAuthCallbackRequest(body: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body is required' }],
    };
  }

  const data = body as Record<string, unknown>;

  // provider
  if (!data['provider']) {
    errors.push({ field: 'provider', message: 'Provider is required' });
  } else if (typeof data['provider'] !== 'string') {
    errors.push({ field: 'provider', message: 'Provider must be a string' });
  } else if (!SUPPORTED_PROVIDERS.includes(data['provider'])) {
    errors.push({
      field: 'provider',
      message: `Provider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`,
      receivedValue: data['provider'],
    });
  }

  // code
  if (!data['code']) {
    errors.push({ field: 'code', message: 'Authorization code is required' });
  } else if (typeof data['code'] !== 'string') {
    errors.push({ field: 'code', message: 'Authorization code must be a string' });
  }

  // redirectUri
  if (!data['redirectUri']) {
    errors.push({ field: 'redirectUri', message: 'Redirect URI is required' });
  } else if (typeof data['redirectUri'] !== 'string') {
    errors.push({ field: 'redirectUri', message: 'Redirect URI must be a string' });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Valida query params para iniciar OAuth (GET /auth/oauth/:provider/authorize).
 *
 * @param query - Query params del request
 * @returns Resultado de validación
 */
export function validateInitiateOAuthRequest(query: unknown): ValidationResult {
  const errors: ValidationFieldError[] = [];

  if (!query || typeof query !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'query', message: 'Query parameters are required' }],
    };
  }

  const data = query as Record<string, unknown>;

  // redirect_uri
  if (!data['redirect_uri']) {
    errors.push({ field: 'redirect_uri', message: 'redirect_uri query parameter is required' });
  } else if (typeof data['redirect_uri'] !== 'string') {
    errors.push({ field: 'redirect_uri', message: 'redirect_uri must be a string' });
  }

  return { isValid: errors.length === 0, errors };
}
