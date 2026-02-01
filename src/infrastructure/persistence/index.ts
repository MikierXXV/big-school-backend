/**
 * ============================================
 * PERSISTENCE - BARREL EXPORT
 * ============================================
 *
 * Implementaciones concretas de los repositorios.
 * Aquí vive la lógica de acceso a datos.
 *
 * IMPLEMENTACIONES DISPONIBLES:
 * - PostgreSQL (producción)
 * - InMemory (tests)
 */

export * from './postgresql/index.js';
export * from './in-memory/index.js';
