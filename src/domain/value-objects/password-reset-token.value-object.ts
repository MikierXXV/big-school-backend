/**
 * ============================================
 * VALUE OBJECT: PasswordResetToken
 * ============================================
 *
 * Representa un token de recuperación de contraseña.
 *
 * RESPONSABILIDADES:
 * - Encapsular el token de reset
 * - Controlar expiración (30 minutos)
 * - Garantizar uso único
 * - Soportar revocación
 *
 * REGLAS DE NEGOCIO:
 * - Validez: 30 MINUTOS (1800 segundos)
 * - Un solo uso (single-use token)
 * - Puede ser revocado antes de usar
 * - Se almacena hash en BD, no el valor real
 *
 * SEGURIDAD:
 * - Expiración corta (30 min)
 * - Invalidación tras uso
 * - Nueva solicitud revoca tokens anteriores
 */

import { InvalidPasswordResetTokenError } from '../errors/authentication.errors.js';

/**
 * Estado del Password Reset Token
 */
export enum PasswordResetTokenStatus {
  /** Token activo y disponible para uso */
  ACTIVE = 'ACTIVE',
  /** Token ya fue utilizado */
  USED = 'USED',
  /** Token fue revocado (nueva solicitud o admin) */
  REVOKED = 'REVOKED',
}

/**
 * Metadatos del Password Reset Token
 */
export interface PasswordResetTokenMetadata {
  /** ID único del token (UUID para tracking en BD) */
  readonly tokenId: string;
  /** ID del usuario propietario */
  readonly userId: string;
  /** Email del usuario (para validación adicional) */
  readonly email: string;
  /** Fecha de creación */
  readonly issuedAt: Date;
  /** Fecha de expiración */
  readonly expiresAt: Date;
  /** Estado actual del token */
  readonly status: PasswordResetTokenStatus;
  /** Fecha de uso (si fue usado) */
  readonly usedAt: Date | null;
  /** Fecha de revocación (si fue revocado) */
  readonly revokedAt: Date | null;
}

/**
 * Value Object que representa un token de recuperación de contraseña.
 * Inmutable y con validez de 30 minutos.
 */
export class PasswordResetToken {
  /**
   * El valor del token (JWT string)
   * @private
   */
  private readonly _value: string;

  /**
   * Metadatos del token
   * @private
   */
  private readonly _metadata: PasswordResetTokenMetadata;

  /**
   * Tiempo de validez en segundos (30 minutos)
   */
  public static readonly VALIDITY_SECONDS = 1800;

  /**
   * Tiempo de validez en milisegundos
   */
  public static readonly VALIDITY_MS = PasswordResetToken.VALIDITY_SECONDS * 1000;

  /**
   * Constructor privado para forzar el uso de factory methods.
   * @param value - El token como string
   * @param metadata - Metadatos del token
   */
  private constructor(value: string, metadata: PasswordResetTokenMetadata) {
    this._value = value;
    this._metadata = metadata;
  }

  /**
   * Factory method para crear un nuevo PasswordResetToken.
   *
   * @param tokenValue - El JWT generado
   * @param tokenId - ID único para tracking
   * @param userId - ID del usuario
   * @param email - Email del usuario
   * @param issuedAt - Fecha de emisión
   * @param expiresAt - Fecha de expiración
   * @returns Nueva instancia de PasswordResetToken
   * @throws InvalidPasswordResetTokenError si los datos son inválidos
   */
  public static createNew(
    tokenValue: string,
    tokenId: string,
    userId: string,
    email: string,
    issuedAt: Date,
    expiresAt: Date
  ): PasswordResetToken {
    if (!tokenValue || tokenValue.trim() === '') {
      throw new InvalidPasswordResetTokenError('Token value cannot be empty');
    }

    if (!tokenId || tokenId.trim() === '') {
      throw new InvalidPasswordResetTokenError('Token ID cannot be empty');
    }

    const metadata: PasswordResetTokenMetadata = {
      tokenId,
      userId,
      email,
      issuedAt,
      expiresAt,
      status: PasswordResetTokenStatus.ACTIVE,
      usedAt: null,
      revokedAt: null,
    };

    return new PasswordResetToken(tokenValue, metadata);
  }

  /**
   * Factory method para reconstruir desde persistencia.
   *
   * @param tokenValue - Valor del token
   * @param metadata - Metadatos desde BD
   * @returns Instancia reconstruida
   */
  public static fromPersistence(
    tokenValue: string,
    metadata: PasswordResetTokenMetadata
  ): PasswordResetToken {
    return new PasswordResetToken(tokenValue, metadata);
  }

  // ============================================
  // GETTERS
  // ============================================

  /**
   * Obtiene el valor del token.
   */
  public get value(): string {
    return this._value;
  }

  /**
   * Obtiene el ID único del token.
   */
  public get tokenId(): string {
    return this._metadata.tokenId;
  }

  /**
   * Obtiene el ID del usuario.
   */
  public get userId(): string {
    return this._metadata.userId;
  }

  /**
   * Obtiene el email del usuario.
   */
  public get email(): string {
    return this._metadata.email;
  }

  /**
   * Obtiene la fecha de expiración (copia defensiva).
   */
  public get expiresAt(): Date {
    return new Date(this._metadata.expiresAt);
  }

  /**
   * Obtiene la fecha de emisión (copia defensiva).
   */
  public get issuedAt(): Date {
    return new Date(this._metadata.issuedAt);
  }

  /**
   * Obtiene el estado actual.
   */
  public get status(): PasswordResetTokenStatus {
    return this._metadata.status;
  }

  /**
   * Obtiene la fecha de uso (si fue usado).
   */
  public get usedAt(): Date | null {
    return this._metadata.usedAt ? new Date(this._metadata.usedAt) : null;
  }

  /**
   * Obtiene la fecha de revocación (si fue revocado).
   */
  public get revokedAt(): Date | null {
    return this._metadata.revokedAt ? new Date(this._metadata.revokedAt) : null;
  }

  // ============================================
  // BUSINESS LOGIC METHODS
  // ============================================

  /**
   * Verifica si el token ha expirado.
   * @param currentDate - Fecha actual para comparar
   * @returns true si ha expirado
   */
  public isExpired(currentDate: Date): boolean {
    return currentDate >= this._metadata.expiresAt;
  }

  /**
   * Verifica si el token ya fue usado.
   * @returns true si status es USED
   */
  public isUsed(): boolean {
    return this._metadata.status === PasswordResetTokenStatus.USED;
  }

  /**
   * Verifica si el token fue revocado.
   * @returns true si status es REVOKED
   */
  public isRevoked(): boolean {
    return this._metadata.status === PasswordResetTokenStatus.REVOKED;
  }

  /**
   * Verifica si el token es válido para uso.
   * Debe estar activo, no expirado, no usado y no revocado.
   *
   * @param currentDate - Fecha actual
   * @returns true si es válido para usar
   */
  public isValidForUse(currentDate: Date): boolean {
    return (
      this._metadata.status === PasswordResetTokenStatus.ACTIVE &&
      !this.isExpired(currentDate)
    );
  }

  /**
   * Crea una copia marcada como usada.
   *
   * @param usedAt - Fecha de uso
   * @returns Nueva instancia con status USED
   */
  public markAsUsed(usedAt: Date): PasswordResetToken {
    const newMetadata: PasswordResetTokenMetadata = {
      ...this._metadata,
      status: PasswordResetTokenStatus.USED,
      usedAt,
    };
    return new PasswordResetToken(this._value, newMetadata);
  }

  /**
   * Crea una copia marcada como revocada.
   *
   * @param revokedAt - Fecha de revocación
   * @returns Nueva instancia con status REVOKED
   */
  public markAsRevoked(revokedAt: Date): PasswordResetToken {
    const newMetadata: PasswordResetTokenMetadata = {
      ...this._metadata,
      status: PasswordResetTokenStatus.REVOKED,
      revokedAt,
    };
    return new PasswordResetToken(this._value, newMetadata);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Representación segura para logs (no expone el token completo).
   */
  public toString(): string {
    return `PasswordResetToken(id:${this._metadata.tokenId})[status:${this._metadata.status}]`;
  }
}
