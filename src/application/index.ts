/**
 * ============================================
 * APPLICATION LAYER - BARREL EXPORT
 * ============================================
 *
 * La capa de aplicación orquesta el flujo de la aplicación.
 * Contiene los casos de uso que coordinan el dominio e infraestructura.
 *
 * RESPONSABILIDADES:
 * - Orquestar casos de uso
 * - Definir DTOs para entrada/salida
 * - Definir ports (interfaces) para servicios externos
 * - Coordinar transacciones
 * - Manejar errores de aplicación
 *
 * PRINCIPIOS:
 * - Los casos de uso son independientes del framework HTTP
 * - Dependen de abstracciones (ports), no de implementaciones
 * - No contienen lógica de dominio (esa está en entities)
 * - Son el punto de entrada para cualquier interface (HTTP, CLI, etc.)
 */

// ============================================
// USE CASES
// ============================================
export * from './use-cases/index.js';

// ============================================
// DTOs
// ============================================
export * from './dtos/index.js';

// ============================================
// PORTS (Interfaces para infraestructura)
// ============================================
export * from './ports/index.js';

// ============================================
// APPLICATION ERRORS
// ============================================
export * from './errors/index.js';
