/**
 * ============================================
 * VALUE OBJECTS - BARREL EXPORT
 * ============================================
 *
 * Los Value Objects son objetos inmutables que representan
 * conceptos del dominio sin identidad propia.
 *
 * CARACTERÍSTICAS:
 * - Inmutables: Una vez creados, no cambian
 * - Sin identidad: Se comparan por valor, no por referencia
 * - Auto-validantes: Validan sus invariantes en construcción
 * - Encapsulan reglas: Contienen lógica de validación del dominio
 */

export * from './user-id.value-object.js';
export * from './email.value-object.js';
export * from './password-hash.value-object.js';
export * from './access-token.value-object.js';
export * from './refresh-token.value-object.js';
export * from './password-reset-token.value-object.js';
