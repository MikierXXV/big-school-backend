/**
 * ============================================
 * INFRASTRUCTURE LAYER - BARREL EXPORT
 * ============================================
 *
 * La capa de infraestructura contiene implementaciones
 * concretas de los puertos definidos en la aplicación.
 *
 * RESPONSABILIDADES:
 * - Implementar repositorios (persistencia)
 * - Implementar servicios externos (JWT, hashing, etc.)
 * - Configuración de entorno
 * - Logging concreto
 * - Conexiones a bases de datos
 *
 * PRINCIPIO:
 * Aquí vive todo lo que cambia si cambiamos de tecnología:
 * - Si cambias de PostgreSQL a MongoDB → cambias repositorios
 * - Si cambias de bcrypt a argon2 → cambias hashing service
 * - Si cambias de JWT a PASETO → cambias token service
 */

// ============================================
// PERSISTENCE (Repositorios)
// ============================================
export * from './persistence/index.js';

// ============================================
// SERVICES (Implementaciones de ports)
// ============================================
export * from './services/index.js';

// ============================================
// CONFIG (Configuración de entorno)
// ============================================
export * from './config/index.js';

// ============================================
// LOGGING
// ============================================
export * from './logging/index.js';
