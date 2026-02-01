/**
 * ============================================
 * VALUE OBJECT: PasswordHash
 * ============================================
 *
 * Representa una contraseña hasheada de forma segura.
 *
 * RESPONSABILIDADES:
 * - Encapsular el hash de una contraseña
 * - Garantizar que NUNCA se almacene una contraseña en texto plano
 * - Proveer una interfaz para verificación (delegada a infraestructura)
 *
 * REGLAS DE NEGOCIO:
 * - NUNCA almacena la contraseña original
 * - Solo almacena el hash generado por infraestructura
 * - La verificación se delega al servicio de hashing
 * - El formato del hash depende del algoritmo (bcrypt, argon2, etc.)
 *
 * IMPORTANTE:
 * - Este Value Object NO conoce el algoritmo de hashing
 * - NO sabe cómo verificar contraseñas (eso es infraestructura)
 * - Solo transporta el hash de forma segura
 *
 * SEGURIDAD:
 * - El hash debe tener longitud mínima (depende del algoritmo)
 * - bcrypt produce hashes de 60 caracteres
 * - argon2 produce hashes de ~97 caracteres
 */

/**
 * Value Object que representa una contraseña hasheada.
 * Inmutable y seguro por diseño.
 */
export class PasswordHash {
  /**
   * El valor interno del hash
   * @private - Solo accesible mediante el getter
   */
  private readonly _value: string;

  /**
   * Longitud mínima esperada para un hash válido.
   * bcrypt produce 60 caracteres, argon2 más.
   */
  public static readonly MIN_HASH_LENGTH = 50;

  /**
   * Constructor privado para forzar el uso de factory methods.
   * @param value - El hash de la contraseña
   *
   * TODO: Validar que el hash tenga formato válido
   * TODO: Lanzar InvalidPasswordHashError si es inválido
   */
  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Factory method para crear un PasswordHash desde un hash existente.
   * Usado al recuperar un usuario de la base de datos.
   *
   * @param hashedValue - El hash recuperado de persistencia
   * @returns Instancia de PasswordHash
   *
   * TODO: Validar longitud mínima del hash
   * TODO: Validar que no esté vacío
   */
  public static fromHash(hashedValue: string): PasswordHash {
    // TODO: Validar que hashedValue no esté vacío
    // TODO: Validar longitud mínima
    // TODO: Lanzar error si es inválido

    return new PasswordHash(hashedValue);
  }

  /**
   * Factory method para crear un PasswordHash desde un hash recién generado.
   * Usado después de que infraestructura hashea una contraseña nueva.
   *
   * @param newlyHashedPassword - Hash generado por el servicio de hashing
   * @returns Instancia de PasswordHash
   */
  public static fromNewlyHashed(newlyHashedPassword: string): PasswordHash {
    // TODO: Validar el hash antes de crear
    return new PasswordHash(newlyHashedPassword);
  }

  /**
   * Obtiene el valor del hash.
   * @returns El hash de la contraseña
   *
   * NOTA: Este valor solo debe usarse para:
   * - Persistencia en base de datos
   * - Comparación por el servicio de hashing
   */
  public get value(): string {
    return this._value;
  }

  /**
   * Compara si dos PasswordHash son iguales por valor.
   * NOTA: Esta comparación es para el hash, NO para la contraseña original.
   *
   * @param other - Otro PasswordHash para comparar
   * @returns true si los hashes son idénticos
   */
  public equals(other: PasswordHash): boolean {
    return this._value === other._value;
  }

  /**
   * Representación string segura (oculta el hash real).
   * @returns String ofuscado para logs seguros
   */
  public toString(): string {
    // SEGURIDAD: Nunca exponer el hash completo en logs
    return '[PROTECTED_HASH]';
  }
}
