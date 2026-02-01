/**
 * ============================================
 * DOMAIN ERRORS: User
 * ============================================
 *
 * Errores relacionados con la entidad User y sus operaciones.
 * Cada error tiene un código único y mensaje descriptivo.
 */

import { DomainError } from './domain.error.js';

/**
 * Error: Usuario no encontrado.
 * Se lanza cuando se busca un usuario que no existe.
 */
export class UserNotFoundError extends DomainError {
  public readonly code = 'DOMAIN_USER_NOT_FOUND';

  constructor(identifier: string, identifierType: 'id' | 'email' = 'id') {
    super(
      `User not found with ${identifierType}: ${identifier}`,
      { identifier, identifierType }
    );
  }
}

/**
 * Error: Usuario ya existe.
 * Se lanza cuando se intenta registrar un email ya usado.
 */
export class UserAlreadyExistsError extends DomainError {
  public readonly code = 'DOMAIN_USER_ALREADY_EXISTS';

  constructor(email: string) {
    super(
      `A user with email ${email} already exists`,
      { email }
    );
  }
}

/**
 * Error: Email inválido.
 * Se lanza cuando el formato del email no es válido.
 */
export class InvalidEmailError extends DomainError {
  public readonly code = 'DOMAIN_INVALID_EMAIL';

  constructor(email: string, reason?: string) {
    super(
      `Invalid email format: ${email}${reason ? ` - ${reason}` : ''}`,
      { email, reason }
    );
  }
}

/**
 * Error: ID de usuario inválido.
 * Se lanza cuando el formato del UserId no es válido.
 */
export class InvalidUserIdError extends DomainError {
  public readonly code = 'DOMAIN_INVALID_USER_ID';

  constructor(userId: string, reason?: string) {
    super(
      `Invalid user ID format: ${userId}${reason ? ` - ${reason}` : ''}`,
      { userId, reason }
    );
  }
}

/**
 * Error: Usuario no activo.
 * Se lanza cuando se intenta una acción con usuario inactivo.
 */
export class UserNotActiveError extends DomainError {
  public readonly code = 'DOMAIN_USER_NOT_ACTIVE';

  constructor(userId: string, currentStatus: string) {
    super(
      `User ${userId} is not active. Current status: ${currentStatus}`,
      { userId, currentStatus }
    );
  }
}

/**
 * Error: Email no verificado.
 * Se lanza cuando se requiere email verificado.
 */
export class EmailNotVerifiedError extends DomainError {
  public readonly code = 'DOMAIN_EMAIL_NOT_VERIFIED';

  constructor(userId: string) {
    super(
      `User ${userId} has not verified their email`,
      { userId }
    );
  }
}

/**
 * Error: Usuario suspendido.
 * Se lanza cuando se intenta usar una cuenta suspendida.
 */
export class UserSuspendedError extends DomainError {
  public readonly code = 'DOMAIN_USER_SUSPENDED';

  constructor(userId: string) {
    super(
      `User ${userId} is suspended`,
      { userId }
    );
  }
}

/**
 * Error: Hash de contraseña inválido.
 * Se lanza cuando el hash no tiene el formato esperado.
 */
export class InvalidPasswordHashError extends DomainError {
  public readonly code = 'DOMAIN_INVALID_PASSWORD_HASH';

  constructor(reason: string) {
    super(
      `Invalid password hash: ${reason}`,
      { reason }
    );
  }
}
