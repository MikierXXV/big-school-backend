/**
 * ============================================
 * VALIDATORS - BARREL EXPORT
 * ============================================
 *
 * Validadores de requests HTTP.
 * Validan formato y estructura, NO reglas de negocio.
 *
 * Las reglas de negocio se validan en:
 * - Value Objects (dominio)
 * - Use Cases (aplicación)
 */

export * from './auth.validators.js';
