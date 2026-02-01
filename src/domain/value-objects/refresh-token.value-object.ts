/**
 * ============================================
 * VALUE OBJECT: RefreshToken
 * ============================================
 *
 * Representa un token de refresco para renovar sesiones.
 *
 * RESPONSABILIDADES:
 * - Encapsular el token de refresco
 * - Soportar rotación de tokens (seguridad)
 * - Mantener información de revocación
 * - Transportar metadatos de la sesión
 *
 * REGLAS DE NEGOCIO:
 * - Validez: 3 DÍAS (259200 segundos)
 * - Puede ser revocado antes de expirar
 * - Soporta estrategia de rotación (un uso = nuevo token)
 * - Se almacena en base de datos para poder revocarlo
 *
 * ESTRATEGIA DE ROTACIÓN:
 * 1. Usuario usa refresh token para obtener nuevo access token
 * 2. Se genera NUEVO refresh token
 * 3. El refresh token anterior se marca como usado/revocado
 * 4. Si se detecta reuso de token revocado → revocar TODA la familia
 *
 * SEGURIDAD:
 * - Almacenado en base de datos (permite revocación)
 * - Hash del token en DB, valor real solo en cliente
 * - Detección de reuso indica compromiso
 */

/**
 * Estado del Refresh Token
 */
export enum RefreshTokenStatus {
  /** Token activo y válido */
  ACTIVE = 'ACTIVE',
  /** Token usado (rotado a uno nuevo) */
  ROTATED = 'ROTATED',
  /** Token revocado manualmente */
  REVOKED = 'REVOKED',
  /** Token expirado por tiempo */
  EXPIRED = 'EXPIRED',
}

/**
 * Metadatos del Refresh Token
 */
export interface RefreshTokenMetadata {
  /** ID único del token (para tracking en DB) */
  readonly tokenId: string;
  /** ID del usuario propietario */
  readonly userId: string;
  /** Fecha de creación */
  readonly issuedAt: Date;
  /** Fecha de expiración */
  readonly expiresAt: Date;
  /** ID del token padre (para familia de rotación) */
  readonly parentTokenId: string | null;
  /** Estado actual del token */
  readonly status: RefreshTokenStatus;
  /** Información del dispositivo/sesión (opcional) */
  readonly deviceInfo?: string;
}

/**
 * Value Object que representa un token de refresco.
 * Soporta rotación y revocación para máxima seguridad.
 */
export class RefreshToken {
  /**
   * El valor del token (string opaco)
   * @private
   */
  private readonly _value: string;

  /**
   * Metadatos del token
   * @private
   */
  private readonly _metadata: RefreshTokenMetadata;

  /**
   * Tiempo de validez en segundos (3 días)
   */
  public static readonly VALIDITY_SECONDS = 259200; // 3 días

  /**
   * Tiempo de validez en milisegundos
   */
  public static readonly VALIDITY_MS = RefreshToken.VALIDITY_SECONDS * 1000;

  /**
   * Constructor privado para forzar el uso de factory methods.
   * @param value - El token como string
   * @param metadata - Metadatos del token
   */
  private constructor(value: string, metadata: RefreshTokenMetadata) {
    this._value = value;
    this._metadata = metadata;
  }

  /**
   * Factory method para crear un nuevo RefreshToken.
   * Usado cuando infraestructura genera un token inicial (sin padre).
   *
   * @param tokenValue - El token generado
   * @param tokenId - ID único para tracking
   * @param userId - ID del usuario
   * @param issuedAt - Fecha de emisión
   * @param expiresAt - Fecha de expiración
   * @param deviceInfo - Info del dispositivo (opcional)
   * @returns Nueva instancia de RefreshToken
   *
   * TODO: Implementar validaciones
   */
  public static createNew(
    tokenValue: string,
    tokenId: string,
    userId: string,
    issuedAt: Date,
    expiresAt: Date,
    deviceInfo?: string
  ): RefreshToken {
    const metadata: RefreshTokenMetadata = {
      tokenId,
      userId,
      issuedAt,
      expiresAt,
      parentTokenId: null, // Es el primero de la familia
      status: RefreshTokenStatus.ACTIVE,
      deviceInfo,
    };

    return new RefreshToken(tokenValue, metadata);
  }

  /**
   * Factory method para crear un RefreshToken rotado.
   * Usado cuando se rota un token existente.
   *
   * @param tokenValue - Nuevo valor del token
   * @param tokenId - Nuevo ID único
   * @param parentToken - Token padre que se está rotando
   * @param issuedAt - Fecha de emisión
   * @param expiresAt - Fecha de expiración
   * @returns Nueva instancia de RefreshToken con referencia al padre
   */
  public static createRotated(
    tokenValue: string,
    tokenId: string,
    parentToken: RefreshToken,
    issuedAt: Date,
    expiresAt: Date
  ): RefreshToken {
    const metadata: RefreshTokenMetadata = {
      tokenId,
      userId: parentToken.userId,
      issuedAt,
      expiresAt,
      parentTokenId: parentToken.tokenId, // Referencia al padre
      status: RefreshTokenStatus.ACTIVE,
      deviceInfo: parentToken.deviceInfo,
    };

    return new RefreshToken(tokenValue, metadata);
  }

  /**
   * Factory method para reconstruir desde persistencia.
   *
   * @param tokenValue - Valor del token
   * @param metadata - Metadatos desde DB
   * @returns Instancia reconstruida
   */
  public static fromPersistence(
    tokenValue: string,
    metadata: RefreshTokenMetadata
  ): RefreshToken {
    return new RefreshToken(tokenValue, metadata);
  }

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
   * Obtiene la fecha de expiración.
   */
  public get expiresAt(): Date {
    return new Date(this._metadata.expiresAt);
  }

  /**
   * Obtiene el estado actual.
   */
  public get status(): RefreshTokenStatus {
    return this._metadata.status;
  }

  /**
   * Obtiene el ID del token padre (si es rotado).
   */
  public get parentTokenId(): string | null {
    return this._metadata.parentTokenId;
  }

  /**
   * Obtiene info del dispositivo.
   */
  public get deviceInfo(): string | undefined {
    return this._metadata.deviceInfo;
  }

  /**
   * Verifica si el token está activo.
   * @returns true si status es ACTIVE
   */
  public isActive(): boolean {
    return this._metadata.status === RefreshTokenStatus.ACTIVE;
  }

  /**
   * Verifica si el token ha expirado.
   * @param currentDate - Fecha actual
   * @returns true si ha expirado
   */
  public isExpired(currentDate: Date): boolean {
    return currentDate > this._metadata.expiresAt;
  }

  /**
   * Verifica si el token es válido para uso.
   * @param currentDate - Fecha actual
   * @returns true si está activo Y no expirado
   *
   * TODO: Implementar lógica completa
   */
  public isValidForUse(currentDate: Date): boolean {
    // TODO: Verificar status === ACTIVE && !isExpired
    return this.isActive() && !this.isExpired(currentDate);
  }

  /**
   * Crea una copia con estado ROTATED.
   * Usado al marcar el token como usado.
   *
   * @returns Nueva instancia con status ROTATED
   */
  public markAsRotated(): RefreshToken {
    const newMetadata: RefreshTokenMetadata = {
      ...this._metadata,
      status: RefreshTokenStatus.ROTATED,
    };
    return new RefreshToken(this._value, newMetadata);
  }

  /**
   * Crea una copia con estado REVOKED.
   * Usado al revocar manualmente.
   *
   * @returns Nueva instancia con status REVOKED
   */
  public markAsRevoked(): RefreshToken {
    const newMetadata: RefreshTokenMetadata = {
      ...this._metadata,
      status: RefreshTokenStatus.REVOKED,
    };
    return new RefreshToken(this._value, newMetadata);
  }

  /**
   * Representación segura para logs.
   */
  public toString(): string {
    return `RefreshToken(id:${this._metadata.tokenId})[status:${this._metadata.status}]`;
  }
}
