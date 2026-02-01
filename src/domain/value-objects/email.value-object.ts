/**
 * ============================================
 * VALUE OBJECT: Email
 * ============================================
 *
 * Representa una dirección de correo electrónico válida.
 *
 * RESPONSABILIDADES:
 * - Encapsular y validar direcciones de email
 * - Normalizar el formato (lowercase)
 * - Garantizar que solo existan emails válidos en el dominio
 *
 * REGLAS DE NEGOCIO:
 * - Debe tener formato de email válido (RFC 5322 simplificado)
 * - No puede estar vacío
 * - Se almacena en minúsculas (normalizado)
 * - Longitud máxima: 254 caracteres (RFC 5321)
 *
 * NOTA: Este Value Object NO conoce si el email existe realmente,
 * solo valida el formato sintáctico.
 */

/**
 * Value Object que representa un email válido.
 * Inmutable, normalizado y auto-validante.
 */
export class Email {
  /**
   * El valor interno del email (normalizado a lowercase)
   * @private - Solo accesible mediante el getter
   */
  private readonly _value: string;

  /**
   * Longitud máxima permitida para un email según RFC 5321
   */
  public static readonly MAX_LENGTH = 254;

  /**
   * Constructor privado para forzar el uso de factory methods.
   * @param value - El email normalizado
   *
   * TODO: Implementar validación de formato
   * TODO: Lanzar InvalidEmailError si el formato es inválido
   */
  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Factory method para crear un Email desde un string.
   * @param value - El email como string (será normalizado)
   * @returns Instancia de Email
   * @throws InvalidEmailError si el formato es inválido
   *
   * TODO: Implementar validación y normalización
   */
  public static create(value: string): Email {
    // TODO: Validar que no esté vacío
    // TODO: Normalizar a lowercase
    // TODO: Validar longitud máxima
    // TODO: Validar formato con regex
    // TODO: Lanzar error de dominio si es inválido

    return new Email(value.toLowerCase().trim());
  }

  /**
   * Obtiene el valor del email normalizado.
   * @returns El email en lowercase
   */
  public get value(): string {
    return this._value;
  }

  /**
   * Obtiene la parte local del email (antes del @).
   * @returns La parte local del email
   *
   * TODO: Implementar extracción
   */
  public get localPart(): string {
    // TODO: Extraer parte antes del @
    return this._value.split('@')[0] ?? '';
  }

  /**
   * Obtiene el dominio del email (después del @).
   * @returns El dominio del email
   *
   * TODO: Implementar extracción
   */
  public get domain(): string {
    // TODO: Extraer parte después del @
    return this._value.split('@')[1] ?? '';
  }

  /**
   * Compara si dos Email son iguales por valor.
   * @param other - Otro Email para comparar
   * @returns true si los valores son iguales
   */
  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  /**
   * Representación string del Email.
   * @returns El email como string
   */
  public toString(): string {
    return this._value;
  }
}
