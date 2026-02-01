/**
 * ============================================
 * SERVICE: CryptoUuidGenerator
 * ============================================
 *
 * Implementación del IUuidGenerator usando crypto de Node.js.
 * Genera UUIDs v4 criptográficamente seguros.
 *
 * RESPONSABILIDADES:
 * - Generar UUIDs únicos
 * - Validar formato de UUIDs
 */

import { IUuidGenerator } from '../../application/ports/uuid-generator.port.js';

/**
 * Regex para validar UUID v4.
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Implementación de IUuidGenerator usando crypto.randomUUID.
 */
export class CryptoUuidGenerator implements IUuidGenerator {
  /**
   * Genera un nuevo UUID v4 usando crypto.randomUUID.
   *
   * @returns UUID como string
   *
   * TODO: Implementar usando crypto
   */
  public generate(): string {
    // TODO: Implementar
    // import crypto from 'crypto';
    // return crypto.randomUUID();

    // Alternativa sin import:
    // return globalThis.crypto.randomUUID();

    // Placeholder
    throw new Error('CryptoUuidGenerator.generate not implemented');
  }

  /**
   * Valida si un string es un UUID v4 válido.
   *
   * @param value - String a validar
   * @returns true si es válido
   */
  public isValid(value: string): boolean {
    return UUID_V4_REGEX.test(value);
  }
}
