/**
 * ============================================
 * VALUE OBJECT: UserId
 * ============================================
 *
 * Representa el identificador único de un usuario.
 *
 * RESPONSABILIDADES:
 * - Encapsular el ID único del usuario
 * - Validar que el ID tenga un formato válido
 * - Proveer igualdad por valor
 *
 * REGLAS DE NEGOCIO:
 * - El ID debe ser un UUID v4 válido
 * - El ID no puede estar vacío
 * - El ID es inmutable una vez creado
 *
 * NOTA: Este Value Object NO conoce cómo se genera el UUID,
 * eso es responsabilidad de la infraestructura.
 */

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
   * @param value - El UUID como string
   *
   * TODO: Implementar validación de formato UUID v4
   * TODO: Lanzar InvalidUserIdError si el formato es inválido
   */
  private constructor(value: string) {
    // TODO: Validar que value no esté vacío
    // TODO: Validar formato UUID v4 usando regex
    // TODO: Si es inválido, lanzar error de dominio

    this._value = value;
  }

  /**
   * Factory method para crear un UserId desde un string.
   * @param value - El UUID como string
   * @returns Instancia de UserId
   *
   * TODO: Implementar validación y creación
   */
  public static create(value: string): UserId {
    // TODO: Validar y crear instancia
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
   */
  public static fromGenerated(generatedUuid: string): UserId {
    // TODO: Validar formato antes de crear
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
    // TODO: Implementar comparación por valor
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
