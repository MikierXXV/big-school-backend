/**
 * ============================================
 * DOMAIN LAYER - BARREL EXPORT
 * ============================================
 *
 * Punto de entrada único para la capa de dominio.
 * Esta capa contiene la lógica de negocio pura y NO depende
 * de ninguna otra capa ni framework externo.
 *
 * PRINCIPIOS:
 * - El dominio es el corazón de la aplicación
 * - No conoce infraestructura (bases de datos, HTTP, etc.)
 * - No conoce frameworks (Express, JWT libraries, etc.)
 * - Solo expresa reglas de negocio mediante entidades y value objects
 *
 * CONTENIDO:
 * - Entities: Objetos con identidad (User)
 * - Value Objects: Objetos inmutables sin identidad (Email, UserId, etc.)
 * - Repository Interfaces: Contratos para persistencia
 * - Domain Events: Eventos de dominio (opcional, preparado para CQRS)
 * - Domain Errors: Errores específicos del dominio
 */

// ============================================
// ENTITIES
// ============================================
export * from './entities/index.js';

// ============================================
// VALUE OBJECTS
// ============================================
export * from './value-objects/index.js';

// ============================================
// REPOSITORY INTERFACES (PORTS)
// ============================================
export * from './repositories/index.js';

// ============================================
// DOMAIN ERRORS
// ============================================
export * from './errors/index.js';

// ============================================
// DOMAIN EVENTS (preparado para Event Sourcing)
// ============================================
export * from './events/index.js';
