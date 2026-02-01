/**
 * ============================================
 * VALUE OBJECT: UserId
 * ============================================
 *
 * Representa el identificador único de un usuario.
 *
 * RESPONSABILIDADES:
 * - Encapsular el ID único del usuario
 * - Validar que el ID tenga un formato válido (UUID)
 * - Proveer igualdad por valor
 *
 * REGLAS DE NEGOCIO:
 * - El ID debe ser un UUID válido (v1-v5)
 * - El ID no puede estar vacío
 * - El ID es inmutable una vez creado
 *
 * NOTA: Este Value Object NO conoce cómo se genera el UUID,
 * eso es responsabilidad de la infraestructura.
 */

import { InvalidUserIdError } from '../errors/user.errors.js';

/**
 * Regex para validar formato UUID (v1-v5)
 * Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Value Object que representa el identificador único de un usuario.
 * Inmutable y auto-validante.
 */
export class UserId {
  /**
   * El valor interno del ID (UUID string)
   * @private - Solo accesible mediante el getter
   */
  private readonly _value: string;

  /**
   * Constructor privado para forzar el uso de factory methods.
   * @param value - El UUID como string (ya validado)
   */
  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Valida que el valor sea un UUID válido.
   * @param value - El valor a validar
   * @throws InvalidUserIdError si el valor no es válido
   */
  private static validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new InvalidUserIdError(value, 'User ID cannot be empty');
    }

    if (!UUID_REGEX.test(value)) {
      throw new InvalidUserIdError(value, 'Invalid UUID format');
    }
  }

  /**
   * Factory method para crear un UserId desde un string.
   * @param value - El UUID como string
   * @returns Instancia de UserId
   * @throws InvalidUserIdError si el formato no es válido
   */
  public static create(value: string): UserId {
    UserId.validate(value);
    return new UserId(value);
  }

  /**
   * Factory method para crear un nuevo UserId.
   * Usado cuando se registra un nuevo usuario.
   *
   * NOTA: La generación real del UUID se delega a infraestructura.
   * Este método solo acepta el UUID ya generado.
   *
   * @param generatedUuid - UUID generado por infraestructura
   * @returns Nueva instancia de UserId
   * @throws InvalidUserIdError si el formato no es válido
   */
  public static fromGenerated(generatedUuid: string): UserId {
    UserId.validate(generatedUuid);
    return new UserId(generatedUuid);
  }

  /**
   * Obtiene el valor del ID como string.
   * @returns El UUID como string
   */
  public get value(): string {
    return this._value;
  }

  /**
   * Compara si dos UserId son iguales por valor.
   * @param other - Otro UserId para comparar
   * @returns true si los valores son iguales
   */
  public equals(other: UserId): boolean {
    return this._value === other._value;
  }

  /**
   * Representación string del UserId.
   * @returns El UUID como string
   */
  public toString(): string {
    return this._value;
  }
}
