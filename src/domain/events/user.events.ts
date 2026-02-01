/**
 * ============================================
 * DOMAIN EVENTS: User
 * ============================================
 *
 * Eventos relacionados con el ciclo de vida del usuario.
 * Estos eventos pueden disparar side effects como:
 * - Envío de emails
 * - Auditoría
 * - Analytics
 * - Sincronización con otros sistemas
 */

import { BaseDomainEvent, EventMetadata } from './domain-event.interface.js';

/**
 * Evento: Usuario registrado.
 * Se emite cuando un nuevo usuario completa el registro.
 */
export class UserRegisteredEvent extends BaseDomainEvent {
  public readonly eventName = 'UserRegistered';
  public readonly aggregateType = 'User';
  public readonly payload: {
    readonly userId: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly registeredAt: string;
  };

  /**
   * Constructor del evento UserRegistered.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario registrado
   * @param email - Email del usuario
   * @param firstName - Nombre del usuario
   * @param lastName - Apellido del usuario
   * @param occurredOn - Fecha de registro
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión desde User.create()
   */
  constructor(
    eventId: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    occurredOn: Date,
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      email,
      firstName,
      lastName,
      registeredAt: occurredOn.toISOString(),
    };
  }
}

/**
 * Evento: Email verificado.
 * Se emite cuando un usuario verifica su email.
 */
export class EmailVerifiedEvent extends BaseDomainEvent {
  public readonly eventName = 'EmailVerified';
  public readonly aggregateType = 'User';
  public readonly payload: {
    readonly userId: string;
    readonly email: string;
    readonly verifiedAt: string;
  };

  /**
   * Constructor del evento EmailVerified.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario
   * @param email - Email verificado
   * @param occurredOn - Fecha de verificación
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión desde User.verifyEmail()
   */
  constructor(
    eventId: string,
    userId: string,
    email: string,
    occurredOn: Date,
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      email,
      verifiedAt: occurredOn.toISOString(),
    };
  }
}

/**
 * Evento: Contraseña cambiada.
 * Se emite cuando un usuario cambia su contraseña.
 *
 * SEGURIDAD: No incluir la contraseña en el payload.
 */
export class PasswordChangedEvent extends BaseDomainEvent {
  public readonly eventName = 'PasswordChanged';
  public readonly aggregateType = 'User';
  public readonly payload: {
    readonly userId: string;
    readonly changedAt: string;
    readonly reason: 'user_requested' | 'admin_reset' | 'forgot_password';
  };

  /**
   * Constructor del evento PasswordChanged.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario
   * @param reason - Razón del cambio
   * @param occurredOn - Fecha del cambio
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión desde User.updatePassword()
   */
  constructor(
    eventId: string,
    userId: string,
    reason: 'user_requested' | 'admin_reset' | 'forgot_password',
    occurredOn: Date,
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      changedAt: occurredOn.toISOString(),
      reason,
    };
  }
}

/**
 * Evento: Usuario suspendido.
 * Se emite cuando un usuario es suspendido.
 */
export class UserSuspendedEvent extends BaseDomainEvent {
  public readonly eventName = 'UserSuspended';
  public readonly aggregateType = 'User';
  public readonly payload: {
    readonly userId: string;
    readonly suspendedAt: string;
    readonly reason?: string;
    readonly suspendedBy?: string;
  };

  /**
   * Constructor del evento UserSuspended.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario suspendido
   * @param occurredOn - Fecha de suspensión
   * @param reason - Razón de la suspensión
   * @param suspendedBy - ID del admin que suspendió
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión desde User.suspend()
   */
  constructor(
    eventId: string,
    userId: string,
    occurredOn: Date,
    reason?: string,
    suspendedBy?: string,
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      suspendedAt: occurredOn.toISOString(),
      reason,
      suspendedBy,
    };
  }
}

/**
 * Evento: Usuario reactivado.
 * Se emite cuando un usuario suspendido es reactivado.
 */
export class UserReactivatedEvent extends BaseDomainEvent {
  public readonly eventName = 'UserReactivated';
  public readonly aggregateType = 'User';
  public readonly payload: {
    readonly userId: string;
    readonly reactivatedAt: string;
    readonly reactivatedBy?: string;
  };

  /**
   * Constructor del evento UserReactivated.
   *
   * @param eventId - ID único del evento
   * @param userId - ID del usuario
   * @param occurredOn - Fecha de reactivación
   * @param reactivatedBy - ID del admin que reactivó
   * @param metadata - Metadatos opcionales
   *
   * TODO: Implementar emisión desde User.reactivate()
   */
  constructor(
    eventId: string,
    userId: string,
    occurredOn: Date,
    reactivatedBy?: string,
    metadata?: EventMetadata
  ) {
    super(eventId, userId, occurredOn, 1, metadata);
    this.payload = {
      userId,
      reactivatedAt: occurredOn.toISOString(),
      reactivatedBy,
    };
  }
}
