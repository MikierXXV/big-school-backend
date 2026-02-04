/**
 * ============================================
 * SERVICE: BcryptHashingService
 * ============================================
 *
 * Implementación del IHashingService usando bcrypt.
 * bcrypt es el algoritmo recomendado para hashing de contraseñas.
 *
 * RESPONSABILIDADES:
 * - Hashear contraseñas con bcrypt
 * - Verificar contraseñas contra hashes
 * - Determinar si un hash necesita rehashing
 *
 * SEGURIDAD:
 * - bcrypt incluye salt automáticamente
 * - Salt rounds configurables (default 12)
 * - Comparación en tiempo constante
 *
 * DEPENDENCIAS (a instalar):
 * - bcrypt o bcryptjs
 */

import * as bcrypt from 'bcryptjs';
import { IHashingService, HashingOptions } from '../../application/ports/hashing.service.port.js';
import { PasswordHash } from '../../domain/value-objects/password-hash.value-object.js';

/**
 * Configuración por defecto para bcrypt.
 */
const DEFAULT_OPTIONS: Required<HashingOptions> = {
  saltRounds: 12, // Balance entre seguridad y rendimiento
};

/**
 * Implementación de IHashingService usando bcrypt.
 */
export class BcryptHashingService implements IHashingService {
  /**
   * Opciones de configuración.
   * @private
   */
  private readonly options: Required<HashingOptions>;

  /**
   * Constructor con opciones configurables.
   *
   * @param options - Opciones de hashing
   */
  constructor(options: HashingOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  /**
   * Hashea una contraseña usando bcrypt.
   *
   * @param plainPassword - Contraseña en texto plano
   * @returns PasswordHash con el hash generado
   *
   * TODO: Implementar usando bcrypt
   */
  public async hash(plainPassword: string): Promise<PasswordHash> {
    const hashedPassword = await bcrypt.hash(
      plainPassword,
      this.options.saltRounds
    );
    return PasswordHash.fromHash(hashedPassword);
  }

  /**
   * Verifica una contraseña contra un hash.
   *
   * @param plainPassword - Contraseña a verificar
   * @param passwordHash - Hash almacenado
   * @returns true si coincide
   *
   * TODO: Implementar verificación
   */
  public async verify(
    plainPassword: string,
    passwordHash: PasswordHash
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash.value);
  }

  /**
   * Verifica si un hash necesita ser rehashed.
   * Útil cuando se cambia el número de salt rounds.
   *
   * @param passwordHash - Hash a verificar
   * @returns true si necesita rehash
   *
   * TODO: Implementar verificación
   */
  public needsRehash(passwordHash: PasswordHash): boolean {
    const hashValue = passwordHash.value;
    const match = hashValue.match(/^\$2[aby]\$(\d+)\$/);

    if (!match || !match[1]) {
      return true; // Invalid format, rehash recommended
    }

    const currentRounds = parseInt(match[1], 10);
    return currentRounds < this.options.saltRounds;
  }
}
