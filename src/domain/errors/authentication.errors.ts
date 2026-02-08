/**
 * ============================================
 * DOMAIN ERRORS: Authentication
 * ============================================
 *
 * Errores relacionados con autenticación y tokens.
 * Cada error tiene un código único y mensaje descriptivo.
 *
 * SEGURIDAD: Los mensajes no deben revelar información sensible.
 */

import { DomainError } from './domain.error.js';

/**
 * Error: Credenciales inválidas.
 * Se lanza cuando email o contraseña son incorrectos.
 *
 * SEGURIDAD: No especificar si es el email o la contraseña.
 */
export class InvalidCredentialsError extends DomainError {
  public readonly code = 'DOMAIN_INVALID_CREDENTIALS';

  constructor() {
    // SEGURIDAD: Mensaje genérico para no revelar si el email existe
    super('Invalid email or password');
  }
}

/**
 * Error: Token de acceso expirado.
 * Se lanza cuando un access token ha expirado.
 */
export class AccessTokenExpiredError extends DomainError {
  public readonly code = 'DOMAIN_ACCESS_TOKEN_EXPIRED';

  constructor() {
    super('Access token has expired');
  }
}

/**
 * Error: Token de acceso inválido.
 * Se lanza cuando el formato o firma del token es inválido.
 */
export class InvalidAccessTokenError extends DomainError {
  public readonly code = 'DOMAIN_INVALID_ACCESS_TOKEN';

  constructor(reason?: string) {
    super(
      `Invalid access token${reason ? `: ${reason}` : ''}`,
      { reason }
    );
  }
}

/**
 * Error: Token de refresco expirado.
 * Se lanza cuando un refresh token ha expirado.
 */
export class RefreshTokenExpiredError extends DomainError {
  public readonly code = 'DOMAIN_REFRESH_TOKEN_EXPIRED';

  constructor() {
    super('Refresh token has expired');
  }
}

/**
 * Error: Token de refresco inválido.
 * Se lanza cuando el refresh token no es válido.
 */
export class InvalidRefreshTokenError extends DomainError {
  public readonly code = 'DOMAIN_INVALID_REFRESH_TOKEN';

  constructor(reason?: string) {
    super(
      `Invalid refresh token${reason ? `: ${reason}` : ''}`,
      { reason }
    );
  }
}

/**
 * Error: Token de refresco revocado.
 * Se lanza cuando se intenta usar un token revocado.
 *
 * SEGURIDAD: Potencial indicador de compromiso.
 */
export class RefreshTokenRevokedError extends DomainError {
  public readonly code = 'DOMAIN_REFRESH_TOKEN_REVOKED';

  constructor(tokenId?: string) {
    super('Refresh token has been revoked');
    // tokenId en context solo para logging interno
    if (tokenId) {
      (this as { context?: Record<string, unknown> }).context = { tokenId };
    }
  }
}

/**
 * Error: Reuso de token de refresco detectado.
 * CRÍTICO: Indica potencial compromiso de la sesión.
 *
 * SEGURIDAD: Al detectar esto, se debe revocar toda la familia de tokens.
 */
export class RefreshTokenReuseDetectedError extends DomainError {
  public readonly code = 'DOMAIN_REFRESH_TOKEN_REUSE_DETECTED';

  constructor(tokenId: string, familyRootId: string) {
    super(
      'Refresh token reuse detected - potential security breach',
      { tokenId, familyRootId }
    );
  }
}

/**
 * Error: Sesión no encontrada.
 * Se lanza cuando no se encuentra una sesión activa.
 */
export class SessionNotFoundError extends DomainError {
  public readonly code = 'DOMAIN_SESSION_NOT_FOUND';

  constructor(sessionId?: string) {
    super('Session not found or has been terminated');
    if (sessionId) {
      (this as { context?: Record<string, unknown> }).context = { sessionId };
    }
  }
}

/**
 * Error: Usuario no autenticado.
 * Se lanza cuando se requiere autenticación.
 */
export class UnauthenticatedError extends DomainError {
  public readonly code = 'DOMAIN_UNAUTHENTICATED';

  constructor() {
    super('Authentication required');
  }
}

/**
 * Error: Usuario no autorizado.
 * Se lanza cuando el usuario no tiene permisos.
 */
export class UnauthorizedError extends DomainError {
  public readonly code = 'DOMAIN_UNAUTHORIZED';

  constructor(action?: string) {
    super(
      `You are not authorized${action ? ` to ${action}` : ''}`,
      { action }
    );
  }
}

/**
 * Error: Contraseña muy débil.
 * Se lanza cuando la contraseña no cumple requisitos.
 */
export class WeakPasswordError extends DomainError {
  public readonly code = 'DOMAIN_WEAK_PASSWORD';

  constructor(requirements: string[]) {
    super(
      `Password does not meet security requirements`,
      { missingRequirements: requirements }
    );
  }
}

/**
 * Error: Token de verificación inválido.
 * Se lanza cuando el token de verificación de email no es válido.
 */
export class InvalidVerificationTokenError extends DomainError {
  public readonly code = 'DOMAIN_INVALID_VERIFICATION_TOKEN';

  constructor(reason?: string) {
    super(
      `Invalid verification token${reason ? `: ${reason}` : ''}`,
      { reason }
    );
  }
}

/**
 * Error: Token de verificación expirado.
 * Se lanza cuando el token de verificación ha expirado.
 */
export class VerificationTokenExpiredError extends DomainError {
  public readonly code = 'DOMAIN_VERIFICATION_TOKEN_EXPIRED';

  constructor() {
    super('Verification token has expired');
  }
}

/**
 * Error: Email ya verificado.
 * Se lanza cuando se intenta verificar un email que ya fue verificado.
 */
export class EmailAlreadyVerifiedError extends DomainError {
  public readonly code = 'DOMAIN_EMAIL_ALREADY_VERIFIED';

  constructor(email: string) {
    super(
      `Email ${email} has already been verified`,
      { email }
    );
  }
}

// ============================================
// PASSWORD RESET ERRORS
// ============================================

/**
 * Error: Token de recuperación de contraseña inválido.
 * Se lanza cuando el token de password reset no es válido.
 *
 * SEGURIDAD: No revelar detalles específicos del error.
 */
export class InvalidPasswordResetTokenError extends DomainError {
  public readonly code = 'DOMAIN_INVALID_PASSWORD_RESET_TOKEN';

  constructor(reason?: string) {
    super(
      `Invalid password reset token${reason ? `: ${reason}` : ''}`,
      { reason }
    );
  }
}

/**
 * Error: Token de recuperación de contraseña expirado.
 * Se lanza cuando el token ha superado su tiempo de validez (30 min).
 */
export class PasswordResetTokenExpiredError extends DomainError {
  public readonly code = 'DOMAIN_PASSWORD_RESET_TOKEN_EXPIRED';

  constructor() {
    super('Password reset token has expired. Please request a new one.');
  }
}

/**
 * Error: Token de recuperación ya utilizado.
 * Se lanza cuando se intenta usar un token que ya fue usado.
 *
 * SEGURIDAD: Los tokens de password reset son de un solo uso.
 */
export class PasswordResetTokenAlreadyUsedError extends DomainError {
  public readonly code = 'DOMAIN_PASSWORD_RESET_TOKEN_ALREADY_USED';

  constructor() {
    super('This password reset link has already been used.');
  }
}

// ============================================
// RATE LIMITING & LOCKOUT ERRORS
// ============================================

/**
 * Error: Cuenta bloqueada.
 * Se lanza cuando se intenta login con una cuenta bloqueada por
 * demasiados intentos fallidos.
 *
 * SEGURIDAD: No revelar si el password era correcto durante el bloqueo.
 */
export class AccountLockedError extends DomainError {
  public readonly code = 'DOMAIN_ACCOUNT_LOCKED';

  /**
   * Segundos restantes hasta que se desbloquee la cuenta.
   */
  public readonly remainingSeconds: number;

  constructor(remainingSeconds: number) {
    super(
      `Account is temporarily locked. Try again in ${Math.ceil(remainingSeconds / 60)} minute(s).`,
      { remainingSeconds }
    );
    this.remainingSeconds = remainingSeconds;
  }
}

/**
 * Error: Demasiadas solicitudes.
 * Se lanza cuando se excede el límite de rate limiting.
 */
export class TooManyRequestsError extends DomainError {
  public readonly code = 'DOMAIN_TOO_MANY_REQUESTS';

  /**
   * Segundos hasta que se pueda reintentar.
   */
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(
      `Too many requests. Please try again in ${retryAfterSeconds} second(s).`,
      { retryAfterSeconds }
    );
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
