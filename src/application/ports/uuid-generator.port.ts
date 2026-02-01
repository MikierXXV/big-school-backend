/**
 * ============================================
 * PORT: UuidGenerator
 * ============================================
 *
 * Define el contrato para la generación de identificadores únicos.
 * Abstrae la implementación de generación de UUIDs.
 *
 * RESPONSABILIDADES:
 * - Generar UUIDs únicos
 * - Validar formato de UUIDs
 *
 * ¿POR QUÉ ABSTRAER?
 * - Testabilidad: Permite UUIDs predecibles en tests
 * - Flexibilidad: Cambiar de UUID v4 a otro formato
 * - Consistencia: Un único punto de generación
 *
 * IMPLEMENTACIONES POSIBLES:
 * - CryptoUuidGenerator (usa crypto.randomUUID)
 * - MockUuidGenerator (para tests)
 */

/**
 * Port del generador de UUIDs.
 * Implementado en infraestructura.
 */
export interface IUuidGenerator {
  /**
   * Genera un nuevo UUID v4.
   *
   * @returns UUID como string
   *
   * FORMATO: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   * Donde y es 8, 9, a o b
   *
   * TODO: Implementar en CryptoUuidGenerator
   */
  generate(): string;

  /**
   * Valida si un string es un UUID válido.
   *
   * @param value - String a validar
   * @returns true si es un UUID válido
   *
   * TODO: Implementar en CryptoUuidGenerator
   */
  isValid(value: string): boolean;
}

/**
 * Símbolo para inyección de dependencias.
 */
export const UUID_GENERATOR = Symbol('IUuidGenerator');
