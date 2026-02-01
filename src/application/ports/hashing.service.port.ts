/**
 * ============================================
 * PORT: HashingService
 * ============================================
 *
 * Define el contrato para el servicio de hashing de contraseñas.
 * La implementación real (bcrypt, argon2, etc.) está en infraestructura.
 *
 * RESPONSABILIDADES:
 * - Hashear contraseñas de forma segura
 * - Verificar contraseñas contra hashes
 * - NO almacenar ni manejar contraseñas en texto plano
 *
 * SEGURIDAD:
 * - Usar algoritmos resistentes a ataques (bcrypt, argon2)
 * - Salt único por contraseña (automático en bcrypt/argon2)
 * - Cost factor configurable (salt rounds)
 * - Comparación en tiempo constante
 *
 * IMPLEMENTACIONES POSIBLES:
 * - BcryptHashingService (recomendado)
 * - Argon2HashingService (más moderno)
 */

import { PasswordHash } from '../../domain/value-objects/password-hash.value-object.js';

/**
 * Opciones de configuración para el hashing.
 */
export interface HashingOptions {
  /**
   * Salt rounds (cost factor) para bcrypt.
   * Mayor valor = más seguro pero más lento.
   * Recomendado: 12 (balance seguridad/rendimiento)
   */
  readonly saltRounds?: number;
}

/**
 * Port del servicio de hashing.
 * Implementado en infraestructura (ej: BcryptHashingService).
 */
export interface IHashingService {
  /**
   * Hashea una contraseña en texto plano.
   *
   * @param plainPassword - Contraseña en texto plano
   * @returns PasswordHash con el hash generado
   *
   * PROCESO:
   * 1. Generar salt único
   * 2. Aplicar algoritmo de hashing
   * 3. Retornar hash completo (incluye salt)
   *
   * SEGURIDAD:
   * - La contraseña en texto plano NO debe loggearse
   * - El hash incluye el salt para verificación posterior
   *
   * TODO: Implementar en BcryptHashingService
   */
  hash(plainPassword: string): Promise<PasswordHash>;

  /**
   * Verifica una contraseña contra un hash existente.
   *
   * @param plainPassword - Contraseña a verificar
   * @param passwordHash - Hash almacenado
   * @returns true si la contraseña es correcta
   *
   * PROCESO:
   * 1. Extraer salt del hash
   * 2. Hashear la contraseña con el mismo salt
   * 3. Comparar hashes en tiempo constante
   *
   * SEGURIDAD:
   * - Comparación en tiempo constante (evita timing attacks)
   * - No revelar si el hash es válido o no en errores
   *
   * TODO: Implementar en BcryptHashingService
   */
  verify(plainPassword: string, passwordHash: PasswordHash): Promise<boolean>;

  /**
   * Verifica si un hash necesita ser rehashed.
   * Útil cuando se cambia el cost factor.
   *
   * @param passwordHash - Hash a verificar
   * @returns true si necesita rehash
   *
   * CASO DE USO:
   * Si se aumenta saltRounds de 10 a 12, los hashes antiguos
   * siguen funcionando pero deberían actualizarse.
   *
   * TODO: Implementar en BcryptHashingService
   */
  needsRehash(passwordHash: PasswordHash): boolean;
}

/**
 * Símbolo para inyección de dependencias.
 */
export const HASHING_SERVICE = Symbol('IHashingService');
