/**
 * ============================================
 * ENTITY: User (AGGREGATE ROOT)
 * ============================================
 *
 * Representa un usuario del sistema.
 * Es el AGGREGATE ROOT del contexto de autenticación.
 *
 * RESPONSABILIDADES:
 * - Mantener la identidad del usuario
 * - Encapsular datos de autenticación
 * - Aplicar reglas de negocio sobre el usuario
 * - Emitir eventos de dominio (preparado)
 *
 * AGGREGATE ROOT:
 * Como Aggregate Root, User es el único punto de entrada
 * para modificar el agregado de autenticación. Cualquier
 * cambio en entidades relacionadas (si las hubiera) debe
 * pasar por User.
 *
 * REGLAS DE NEGOCIO:
 * - Un usuario debe tener email único (validado en repositorio)
 * - La contraseña siempre se almacena hasheada
 * - El usuario puede estar activo o inactivo
 * - Solo usuarios verificados pueden hacer login
 *
 * INVARIANTES:
 * - ID nunca cambia después de creación
 * - Email debe ser válido (validado por Value Object)
 * - PasswordHash nunca es texto plano
 */

import { UserId } from '../value-objects/user-id.value-object.js';
import { Email } from '../value-objects/email.value-object.js';
import { PasswordHash } from '../value-objects/password-hash.value-object.js';

/**
 * Estado del usuario en el sistema
 */
export enum UserStatus {
  /** Usuario pendiente de verificación de email */
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  /** Usuario activo y verificado */
  ACTIVE = 'ACTIVE',
  /** Usuario suspendido temporalmente */
  SUSPENDED = 'SUSPENDED',
  /** Usuario desactivado permanentemente */
  DEACTIVATED = 'DEACTIVATED',
}

/**
 * Propiedades requeridas para crear un User
 */
export interface UserProps {
  readonly id: UserId;
  readonly email: Email;
  readonly passwordHash: PasswordHash;
  readonly firstName: string;
  readonly lastName: string;
  readonly status: UserStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLoginAt: Date | null;
  readonly emailVerifiedAt: Date | null;
  // Account Lockout fields
  readonly failedLoginAttempts: number;
  readonly lockoutUntil: Date | null;
  readonly lockoutCount: number;
  readonly lastFailedLoginAt: Date | null;
}

/**
 * Datos para crear un nuevo usuario (registro)
 */
export interface CreateUserData {
  readonly id: UserId;
  readonly email: Email;
  readonly passwordHash: PasswordHash;
  readonly firstName: string;
  readonly lastName: string;
}

/**
 * Entity User - Aggregate Root del contexto de autenticación.
 *
 * NOTA: Esta entidad es RICA en comportamiento (no anémica).
 * Contiene métodos que expresan reglas de negocio.
 */
export class User {
  // ============================================
  // LOCKOUT CONSTANTS
  // ============================================

  /** Maximum failed login attempts before lockout */
  public static readonly MAX_FAILED_ATTEMPTS = 5;

  /** Base lockout duration in milliseconds (15 minutes) */
  public static readonly BASE_LOCKOUT_DURATION_MS = 15 * 60 * 1000;

  /** Maximum lockout duration in milliseconds (1 hour) */
  public static readonly MAX_LOCKOUT_DURATION_MS = 60 * 60 * 1000;
  /**
   * Propiedades internas del usuario.
   * @private
   */
  private readonly _props: UserProps;

  /**
   * Eventos de dominio pendientes de dispatch.
   * @private
   */
  private readonly _domainEvents: DomainEvent[] = [];

  /**
   * Constructor privado para forzar factory methods.
   * @param props - Propiedades del usuario
   */
  private constructor(props: UserProps) {
    this._props = props;
  }

  // ============================================
  // FACTORY METHODS
  // ============================================

  /**
   * Crea un nuevo usuario (registro).
   * El usuario se crea en estado PENDING_VERIFICATION.
   *
   * @param data - Datos para crear el usuario
   * @returns Nueva instancia de User
   *
   * TODO: Validar datos de entrada
   * TODO: Emitir evento UserRegistered
   */
  public static create(data: CreateUserData): User {
    const now = new Date();

    const props: UserProps = {
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      status: UserStatus.PENDING_VERIFICATION,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      emailVerifiedAt: null,
      // Lockout fields initialized to safe defaults
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lockoutCount: 0,
      lastFailedLoginAt: null,
    };

    const user = new User(props);

    // TODO: Agregar evento de dominio
    // user.addDomainEvent(new UserRegisteredEvent(user.id));

    return user;
  }

  /**
   * Reconstruye un usuario desde persistencia.
   * NO emite eventos de dominio.
   *
   * @param props - Propiedades desde la base de datos
   * @returns Instancia de User reconstruida
   */
  public static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // ============================================
  // GETTERS (propiedades de solo lectura)
  // ============================================

  /** Obtiene el ID único del usuario */
  public get id(): UserId {
    return this._props.id;
  }

  /** Obtiene el email del usuario */
  public get email(): Email {
    return this._props.email;
  }

  /** Obtiene el hash de la contraseña */
  public get passwordHash(): PasswordHash {
    return this._props.passwordHash;
  }

  /** Obtiene el nombre */
  public get firstName(): string {
    return this._props.firstName;
  }

  /** Obtiene el apellido */
  public get lastName(): string {
    return this._props.lastName;
  }

  /** Obtiene el nombre completo */
  public get fullName(): string {
    return `${this._props.firstName} ${this._props.lastName}`;
  }

  /** Obtiene el estado del usuario */
  public get status(): UserStatus {
    return this._props.status;
  }

  /** Obtiene la fecha de creación */
  public get createdAt(): Date {
    return new Date(this._props.createdAt);
  }

  /** Obtiene la fecha de última actualización */
  public get updatedAt(): Date {
    return new Date(this._props.updatedAt);
  }

  /** Obtiene la fecha del último login */
  public get lastLoginAt(): Date | null {
    return this._props.lastLoginAt ? new Date(this._props.lastLoginAt) : null;
  }

  /** Obtiene la fecha de verificación del email */
  public get emailVerifiedAt(): Date | null {
    return this._props.emailVerifiedAt
      ? new Date(this._props.emailVerifiedAt)
      : null;
  }

  /** Obtiene el número de intentos de login fallidos */
  public get failedLoginAttempts(): number {
    return this._props.failedLoginAttempts;
  }

  /** Obtiene la fecha hasta la cual la cuenta está bloqueada */
  public get lockoutUntil(): Date | null {
    return this._props.lockoutUntil ? new Date(this._props.lockoutUntil) : null;
  }

  /** Obtiene el número de veces que la cuenta ha sido bloqueada */
  public get lockoutCount(): number {
    return this._props.lockoutCount;
  }

  /** Obtiene la fecha del último intento de login fallido */
  public get lastFailedLoginAt(): Date | null {
    return this._props.lastFailedLoginAt
      ? new Date(this._props.lastFailedLoginAt)
      : null;
  }

  // ============================================
  // BUSINESS LOGIC METHODS
  // ============================================

  /**
   * Verifica si el usuario puede hacer login.
   *
   * REGLAS:
   * - Debe estar en estado ACTIVE
   * - El email debe estar verificado
   *
   * @returns true si puede hacer login
   *
   * TODO: Implementar lógica de verificación
   */
  public canLogin(): boolean {
    // TODO: Verificar status === ACTIVE
    // TODO: Verificar emailVerifiedAt !== null
    return this._props.status === UserStatus.ACTIVE;
  }

  /**
   * Verifica si el email está verificado.
   * @returns true si el email está verificado
   */
  public isEmailVerified(): boolean {
    return this._props.emailVerifiedAt !== null;
  }

  /**
   * Verifica si el usuario está activo.
   * @returns true si está activo
   */
  public isActive(): boolean {
    return this._props.status === UserStatus.ACTIVE;
  }

  /**
   * Marca el email como verificado.
   * Cambia el estado a ACTIVE si estaba PENDING_VERIFICATION.
   *
   * @param verifiedAt - Fecha de verificación
   * @returns Nueva instancia con email verificado
   *
   * TODO: Implementar cambio de estado
   * TODO: Emitir evento EmailVerified
   */
  public verifyEmail(verifiedAt: Date): User {
    // TODO: Validar que no esté ya verificado
    // TODO: Cambiar status si aplica
    // TODO: Emitir evento de dominio

    const newProps: UserProps = {
      ...this._props,
      emailVerifiedAt: verifiedAt,
      status:
        this._props.status === UserStatus.PENDING_VERIFICATION
          ? UserStatus.ACTIVE
          : this._props.status,
      updatedAt: verifiedAt,
    };

    return new User(newProps);
  }

  /**
   * Registra un login exitoso.
   * Actualiza lastLoginAt.
   *
   * @param loginAt - Fecha del login
   * @returns Nueva instancia con login registrado
   *
   * TODO: Emitir evento UserLoggedIn
   */
  public recordLogin(loginAt: Date): User {
    const newProps: UserProps = {
      ...this._props,
      lastLoginAt: loginAt,
      updatedAt: loginAt,
    };

    // TODO: Agregar evento UserLoggedIn

    return new User(newProps);
  }

  /**
   * Actualiza la contraseña del usuario.
   *
   * @param newPasswordHash - Nuevo hash de contraseña
   * @param updatedAt - Fecha de actualización
   * @returns Nueva instancia con contraseña actualizada
   *
   * TODO: Emitir evento PasswordChanged
   */
  public updatePassword(newPasswordHash: PasswordHash, updatedAt: Date): User {
    const newProps: UserProps = {
      ...this._props,
      passwordHash: newPasswordHash,
      updatedAt,
    };

    // TODO: Agregar evento PasswordChangedEvent

    return new User(newProps);
  }

  /**
   * Suspende al usuario.
   *
   * @param suspendedAt - Fecha de suspensión
   * @returns Nueva instancia suspendida
   *
   * TODO: Emitir evento UserSuspended
   */
  public suspend(suspendedAt: Date): User {
    // TODO: Validar que no esté ya suspendido/desactivado

    const newProps: UserProps = {
      ...this._props,
      status: UserStatus.SUSPENDED,
      updatedAt: suspendedAt,
    };

    return new User(newProps);
  }

  /**
   * Reactiva un usuario suspendido.
   *
   * @param reactivatedAt - Fecha de reactivación
   * @returns Nueva instancia activa
   *
   * TODO: Emitir evento UserReactivated
   */
  public reactivate(reactivatedAt: Date): User {
    // TODO: Validar que esté suspendido

    const newProps: UserProps = {
      ...this._props,
      status: UserStatus.ACTIVE,
      updatedAt: reactivatedAt,
    };

    return new User(newProps);
  }

  // ============================================
  // ACCOUNT LOCKOUT METHODS
  // ============================================

  /**
   * Verifica si la cuenta está actualmente bloqueada.
   *
   * @param now - Fecha actual para comparación
   * @returns true si la cuenta está bloqueada
   */
  public isLockedOut(now: Date): boolean {
    if (!this._props.lockoutUntil) {
      return false;
    }
    return this._props.lockoutUntil.getTime() > now.getTime();
  }

  /**
   * Obtiene los segundos restantes de bloqueo.
   *
   * @param now - Fecha actual para comparación
   * @returns Segundos restantes (0 si no está bloqueado)
   */
  public getRemainingLockoutSeconds(now: Date): number {
    if (!this._props.lockoutUntil) {
      return 0;
    }
    const remainingMs = this._props.lockoutUntil.getTime() - now.getTime();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }

  /**
   * Verifica si el usuario puede intentar hacer login.
   * Considera tanto el estado como el bloqueo.
   *
   * @param now - Fecha actual para comparación
   * @returns true si puede intentar login
   */
  public canAttemptLogin(now: Date): boolean {
    // Check if account is locked
    if (this.isLockedOut(now)) {
      return false;
    }
    // Check if user status allows login attempts
    // Note: We allow attempts for PENDING_VERIFICATION to give proper error
    return (
      this._props.status === UserStatus.ACTIVE ||
      this._props.status === UserStatus.PENDING_VERIFICATION
    );
  }

  /**
   * Registra un intento de login fallido.
   * Incrementa el contador y bloquea si se excede el límite.
   *
   * @param now - Fecha del intento
   * @returns Nueva instancia con intento registrado
   */
  public recordFailedLogin(now: Date): User {
    const newFailedAttempts = this._props.failedLoginAttempts + 1;

    // Check if we need to lock the account
    if (newFailedAttempts >= User.MAX_FAILED_ATTEMPTS) {
      // Calculate lockout duration (progressive: 15min, 30min, 1h, etc.)
      const newLockoutCount = this._props.lockoutCount + 1;
      const lockoutDurationMs = Math.min(
        User.BASE_LOCKOUT_DURATION_MS * newLockoutCount,
        User.MAX_LOCKOUT_DURATION_MS
      );
      const lockoutUntil = new Date(now.getTime() + lockoutDurationMs);

      const newProps: UserProps = {
        ...this._props,
        failedLoginAttempts: newFailedAttempts,
        lastFailedLoginAt: now,
        lockoutUntil,
        lockoutCount: newLockoutCount,
        updatedAt: now,
      };

      return new User(newProps);
    }

    // Just increment failed attempts
    const newProps: UserProps = {
      ...this._props,
      failedLoginAttempts: newFailedAttempts,
      lastFailedLoginAt: now,
      updatedAt: now,
    };

    return new User(newProps);
  }

  /**
   * Registra un login exitoso.
   * Resetea los contadores de intentos fallidos y bloqueos.
   *
   * @param now - Fecha del login exitoso
   * @returns Nueva instancia con contadores reseteados
   */
  public recordSuccessfulLogin(now: Date): User {
    const newProps: UserProps = {
      ...this._props,
      lastLoginAt: now,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lockoutCount: 0,
      lastFailedLoginAt: null,
      updatedAt: now,
    };

    return new User(newProps);
  }

  // ============================================
  // DOMAIN EVENTS
  // ============================================

  /**
   * Obtiene los eventos de dominio pendientes.
   * @returns Array de eventos (copia)
   */
  public get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Agrega un evento de dominio.
   * @param event - Evento a agregar
   *
   * TODO: Implementar
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Limpia los eventos de dominio después de dispatch.
   *
   * TODO: Implementar
   */
  public clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }

  // ============================================
  // EQUALITY
  // ============================================

  /**
   * Compara dos usuarios por identidad (ID).
   * @param other - Otro usuario para comparar
   * @returns true si tienen el mismo ID
   */
  public equals(other: User): boolean {
    return this._props.id.equals(other._props.id);
  }
}

// ============================================
// DOMAIN EVENT INTERFACE (preparado para CQRS)
// ============================================

/**
 * Interfaz base para eventos de dominio.
 * Los eventos representan hechos que han ocurrido.
 */
export interface DomainEvent {
  /** Nombre del evento */
  readonly eventName: string;
  /** Fecha en que ocurrió */
  readonly occurredOn: Date;
  /** ID del agregado afectado */
  readonly aggregateId: string;
}
