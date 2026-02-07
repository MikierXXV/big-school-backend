/**
 * ============================================
 * DOMAIN EVENTS: Authentication
 * ============================================
 *
 * Eventos relacionados con autenticación y sesiones.
 * Útiles para:
 * - Auditoría de seguridad
 * - Detección de anomalías
 * - Notificaciones de seguridad
 * - Analytics de uso
 */

import { BaseDomainEvent, EventMetadata } from './domain-event.interface.js';

/**
 * Evento: Login exitoso.
 * Se emite cuando un usuario hace login correctamente.
 */
export class LoginSucceededEvent extends BaseDomainEvent {
  public readonly eventName = 'LoginSucceeded';
  public readonly aggregateType = 'User';
  public readonly payload: {
    readonly userId: string;
    readonly loginAt: string;
    readonly deviceInfo?: string;
    readonly ipAddress?: string;
  };

  /**
   * Constructor del evento LoginSucceeded.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario
   * @param occurredOn - Fecha del login
   * @param deviceInfo - Información del dispositivo
   * @param ipAddress - IP del cliente
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión desde LoginUser use case
   */
  constructor(
    eventId: string,
    userId: string,
    occurredOn: Date,
    deviceInfo?: string,
    ipAddress?: string,
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      loginAt: occurredOn.toISOString(),
      ...(deviceInfo !== undefined && { deviceInfo }),
      ...(ipAddress !== undefined && { ipAddress }),
    };
  }
}

/**
 * Evento: Login fallido.
 * Se emite cuando un intento de login falla.
 *
 * SEGURIDAD: Útil para detectar ataques de fuerza bruta.
 */
export class LoginFailedEvent extends BaseDomainEvent {
  public readonly eventName = 'LoginFailed';
  public readonly aggregateType = 'User';
  public readonly payload: {
    readonly attemptedEmail: string;
    readonly failedAt: string;
    readonly reason: 'invalid_email' | 'invalid_password' | 'user_inactive' | 'user_suspended';
    readonly ipAddress?: string;
  };

  /**
   * Constructor del evento LoginFailed.
   *
   * @param eventId - ID único del evento
   * @param attemptedEmail - Email intentado
   * @param occurredOn - Fecha del intento
   * @param reason - Razón del fallo
   * @param ipAddress - IP del cliente
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión desde LoginUser use case
   */
  constructor(
    eventId: string,
    attemptedEmail: string,
    occurredOn: Date,
    reason: 'invalid_email' | 'invalid_password' | 'user_inactive' | 'user_suspended',
    ipAddress?: string,
    metadata?: EventMetadata
  ) {
    // aggregateId es el email hasheado o 'unknown' para seguridad
    super(eventId, 'login_attempt', occurredOn, 1, metadata);
    this.payload = {
      attemptedEmail,
      failedAt: occurredOn.toISOString(),
      reason,
      ...(ipAddress !== undefined && { ipAddress }),
    };
  }
}

/**
 * Evento: Sesión refrescada.
 * Se emite cuando se renueva una sesión con refresh token.
 */
export class SessionRefreshedEvent extends BaseDomainEvent {
  public readonly eventName = 'SessionRefreshed';
  public readonly aggregateType = 'Session';
  public readonly payload: {
    readonly userId: string;
    readonly oldTokenId: string;
    readonly newTokenId: string;
    readonly refreshedAt: string;
  };

  /**
   * Constructor del evento SessionRefreshed.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario
   * @param oldTokenId - ID del token rotado
   * @param newTokenId - ID del nuevo token
   * @param occurredOn - Fecha del refresh
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión desde RefreshSession use case
   */
  constructor(
    eventId: string,
    userId: string,
    oldTokenId: string,
    newTokenId: string,
    occurredOn: Date,
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      oldTokenId,
      newTokenId,
      refreshedAt: occurredOn.toISOString(),
    };
  }
}

/**
 * Evento: Logout realizado.
 * Se emite cuando un usuario hace logout.
 */
export class LogoutPerformedEvent extends BaseDomainEvent {
  public readonly eventName = 'LogoutPerformed';
  public readonly aggregateType = 'Session';
  public readonly payload: {
    readonly userId: string;
    readonly tokenId: string;
    readonly logoutAt: string;
    readonly logoutType: 'single_session' | 'all_sessions';
  };

  /**
   * Constructor del evento LogoutPerformed.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario
   * @param tokenId - ID del token revocado
   * @param occurredOn - Fecha del logout
   * @param logoutType - Tipo de logout
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión desde Logout use case
   */
  constructor(
    eventId: string,
    userId: string,
    tokenId: string,
    occurredOn: Date,
    logoutType: 'single_session' | 'all_sessions',
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      tokenId,
      logoutAt: occurredOn.toISOString(),
      logoutType,
    };
  }
}

/**
 * Evento: Reuso de token detectado.
 * CRÍTICO: Indica potencial compromiso de seguridad.
 */
export class TokenReuseDetectedEvent extends BaseDomainEvent {
  public readonly eventName = 'TokenReuseDetected';
  public readonly aggregateType = 'Session';
  public readonly payload: {
    readonly userId: string;
    readonly reusedTokenId: string;
    readonly familyRootTokenId: string;
    readonly detectedAt: string;
    readonly ipAddress?: string;
  };

  /**
   * Constructor del evento TokenReuseDetected.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario afectado
   * @param reusedTokenId - ID del token reusado
   * @param familyRootTokenId - ID del token raíz de la familia
   * @param occurredOn - Fecha de detección
   * @param ipAddress - IP del atacante potencial
   * @param metadata - Metadatos opcionales
   *
   * ACCIÓN REQUERIDA: Revocar toda la familia de tokens
   *
   * TODO: Implementar emisión desde RefreshSession use case
   */
  constructor(
    eventId: string,
    userId: string,
    reusedTokenId: string,
    familyRootTokenId: string,
    occurredOn: Date,
    ipAddress?: string,
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      reusedTokenId,
      familyRootTokenId,
      detectedAt: occurredOn.toISOString(),
      ...(ipAddress !== undefined && { ipAddress }),
    };
  }
}

/**
 * Evento: Todos los tokens revocados.
 * Se emite cuando se revocan todas las sesiones de un usuario.
 */
export class AllTokensRevokedEvent extends BaseDomainEvent {
  public readonly eventName = 'AllTokensRevoked';
  public readonly aggregateType = 'User';
  public readonly payload: {
    readonly userId: string;
    readonly revokedCount: number;
    readonly revokedAt: string;
    readonly reason: 'user_requested' | 'security_breach' | 'admin_action' | 'password_change';
  };

  /**
   * Constructor del evento AllTokensRevoked.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario
   * @param revokedCount - Cantidad de tokens revocados
   * @param occurredOn - Fecha de revocación
   * @param reason - Razón de la revocación
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión cuando se revocan todas las sesiones
   */
  constructor(
    eventId: string,
    userId: string,
    revokedCount: number,
    occurredOn: Date,
    reason: 'user_requested' | 'security_breach' | 'admin_action' | 'password_change',
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      revokedCount,
      revokedAt: occurredOn.toISOString(),
      reason,
    };
  }
}
