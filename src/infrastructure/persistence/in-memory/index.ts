/**
 * ============================================
 * IN-MEMORY PERSISTENCE - BARREL EXPORT
 * ============================================
 *
 * Implementaciones en memoria para tests.
 * NO usar en producción - solo para testing.
 *
 * VENTAJAS:
 * - Tests rápidos (sin I/O)
 * - Sin dependencias externas
 * - Estado controlable
 * - Fácil de resetear
 */

export * from './in-memory-user.repository.js';
export * from './in-memory-refresh-token.repository.js';
