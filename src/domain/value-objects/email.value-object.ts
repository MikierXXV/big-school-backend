/**
 * ============================================
 * VALUE OBJECT: Email
 * ============================================
 *
 * Representa una dirección de correo electrónico válida.
 *
 * RESPONSABILIDADES:
 * - Encapsular y validar direcciones de email
 * - Normalizar el formato (lowercase, trim)
 * - Garantizar que solo existan emails válidos en el dominio
 *
 * REGLAS DE NEGOCIO:
 * - Debe tener formato de email válido
 * - No puede estar vacío
 * - Se almacena en minúsculas (normalizado)
 * - Longitud máxima: 254 caracteres (RFC 5321)
 *
 * NOTA: Este Value Object NO conoce si el email existe realmente,
 * solo valida el formato sintáctico.
 */

import { InvalidEmailError } from '../errors/user.errors.js';

/**
 * Regex para validar formato de email
 * Valida: local-part@domain
 * - Local part: permite letras, números, puntos, guiones, underscores, plus
 * - Domain: permite letras, números, guiones, puntos (para subdominios)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
   * @param value - El email normalizado (ya validado)
   */
  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Valida que el valor sea un email válido.
   * @param value - El valor a validar (ya normalizado)
   * @throws InvalidEmailError si el valor no es válido
   */
  private static validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new InvalidEmailError(value, 'Email cannot be empty');
    }

    if (value.length > Email.MAX_LENGTH) {
      throw new InvalidEmailError(value, `Email exceeds maximum length of ${Email.MAX_LENGTH} characters`);
    }

    if (!EMAIL_REGEX.test(value)) {
      throw new InvalidEmailError(value, 'Invalid email format');
    }
  }

  /**
   * Factory method para crear un Email desde un string.
   * @param value - El email como string (será normalizado)
   * @returns Instancia de Email
   * @throws InvalidEmailError si el formato es inválido
   */
  public static create(value: string): Email {
    const normalized = value.toLowerCase().trim();
    Email.validate(normalized);
    return new Email(normalized);
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
   */
  public get localPart(): string {
    return this._value.split('@')[0] ?? '';
  }

  /**
   * Obtiene el dominio del email (después del @).
   * @returns El dominio del email
   */
  public get domain(): string {
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
