/**
 * ============================================
 * VALUE OBJECT: AccessToken
 * ============================================
 *
 * Representa un token de acceso para autenticación.
 *
 * RESPONSABILIDADES:
 * - Encapsular el token de acceso JWT
 * - Transportar metadatos de expiración
 * - Proveer información sobre validez temporal
 *
 * REGLAS DE NEGOCIO:
 * - Validez: 5 HORAS (18000 segundos)
 * - El token es opaco para el dominio (no sabe que es JWT)
 * - Contiene información de expiración
 * - Es inmutable una vez creado
 *
 * IMPORTANTE:
 * - El dominio NO conoce JWT ni su estructura interna
 * - NO sabe cómo verificar firmas (eso es infraestructura)
 * - Solo transporta el token y su fecha de expiración
 *
 * CICLO DE VIDA:
 * 1. Usuario hace login/register
 * 2. Infraestructura genera el token
 * 3. Se crea este Value Object con el token y expiración
 * 4. Se devuelve al cliente
 * 5. Cliente envía token en cada request
 * 6. Middleware de infraestructura valida el token
 */

/**
 * Metadatos del Access Token
 */
export interface AccessTokenMetadata {
  /** Fecha de creación del token */
  readonly issuedAt: Date;
  /** Fecha de expiración del token */
  readonly expiresAt: Date;
  /** ID del usuario propietario */
  readonly userId: string;
}

/**
 * Value Object que representa un token de acceso.
 * Inmutable y con información de expiración.
 */
export class AccessToken {
  /**
   * El valor del token (string opaco para el dominio)
   * @private
   */
  private readonly _value: string;

  /**
   * Metadatos del token
   * @private
   */
  private readonly _metadata: AccessTokenMetadata;

  /**
   * Tiempo de validez en segundos (5 horas)
   */
  public static readonly VALIDITY_SECONDS = 18000; // 5 horas

  /**
   * Tiempo de validez en milisegundos
   */
  public static readonly VALIDITY_MS = AccessToken.VALIDITY_SECONDS * 1000;

  /**
   * Constructor privado para forzar el uso de factory methods.
   * @param value - El token como string
   * @param metadata - Metadatos del token
   */
  private constructor(value: string, metadata: AccessTokenMetadata) {
    this._value = value;
    this._metadata = metadata;
  }

  /**
   * Factory method para crear un AccessToken desde infraestructura.
   * Usado cuando el JWT provider genera un nuevo token.
   *
   * @param tokenValue - El JWT generado por infraestructura
   * @param userId - ID del usuario propietario
   * @param issuedAt - Fecha de emisión
   * @param expiresAt - Fecha de expiración
   * @returns Instancia de AccessToken
   *
   * TODO: Validar que tokenValue no esté vacío
   * TODO: Validar que expiresAt sea futuro
   */
  public static create(
    tokenValue: string,
    userId: string,
    issuedAt: Date,
    expiresAt: Date
  ): AccessToken {
    // TODO: Validaciones

    const metadata: AccessTokenMetadata = {
      issuedAt,
      expiresAt,
      userId,
    };

    return new AccessToken(tokenValue, metadata);
  }

  /**
   * Factory method para reconstruir un AccessToken existente.
   * Usado al parsear un token de un request.
   *
   * @param tokenValue - El token recibido
   * @param metadata - Metadatos extraídos por infraestructura
   * @returns Instancia de AccessToken
   */
  public static fromExisting(
    tokenValue: string,
    metadata: AccessTokenMetadata
  ): AccessToken {
    return new AccessToken(tokenValue, metadata);
  }

  /**
   * Obtiene el valor del token.
   * @returns El token como string
   */
  public get value(): string {
    return this._value;
  }

  /**
   * Obtiene los metadatos del token.
   * @returns Metadatos inmutables
   */
  public get metadata(): AccessTokenMetadata {
    return { ...this._metadata };
  }

  /**
   * Obtiene la fecha de expiración.
   * @returns Fecha de expiración
   */
  public get expiresAt(): Date {
    return new Date(this._metadata.expiresAt);
  }

  /**
   * Verifica si el token ha expirado.
   * @param currentDate - Fecha actual (inyectada para testabilidad)
   * @returns true si el token ha expirado
   *
   * TODO: Implementar comparación de fechas
   */
  public isExpired(currentDate: Date): boolean {
    // TODO: Comparar expiresAt con currentDate
    return currentDate > this._metadata.expiresAt;
  }

  /**
   * Calcula el tiempo restante de validez en segundos.
   * @param currentDate - Fecha actual
   * @returns Segundos restantes (0 si expirado)
   *
   * TODO: Implementar cálculo
   */
  public remainingTimeSeconds(currentDate: Date): number {
    // TODO: Calcular diferencia y retornar 0 si es negativo
    const diff = this._metadata.expiresAt.getTime() - currentDate.getTime();
    return Math.max(0, Math.floor(diff / 1000));
  }

  /**
   * Representación segura para logs.
   * @returns String ofuscado
   */
  public toString(): string {
    // SEGURIDAD: Solo mostrar parte del token
    const prefix = this._value.substring(0, 10);
    return `AccessToken(${prefix}...)[expires:${this._metadata.expiresAt.toISOString()}]`;
  }
}
