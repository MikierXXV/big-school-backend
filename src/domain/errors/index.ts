/**
 * ============================================
 * DOMAIN ERRORS - BARREL EXPORT
 * ============================================
 *
 * Los errores de dominio representan violaciones de reglas
 * de negocio. Son diferentes de errores técnicos.
 *
 * CARACTERÍSTICAS:
 * - Expresan conceptos del dominio
 * - Son específicos y descriptivos
 * - No contienen detalles de infraestructura
 * - Pueden ser manejados de forma diferente a errores técnicos
 */

export * from './domain.error.js';
export * from './user.errors.js';
export * from './authentication.errors.js';
