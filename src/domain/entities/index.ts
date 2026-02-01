/**
 * ============================================
 * ENTITIES - BARREL EXPORT
 * ============================================
 *
 * Las Entidades son objetos con identidad propia que persisten
 * a través del tiempo. Su igualdad se determina por su ID,
 * no por sus atributos.
 *
 * CARACTERÍSTICAS:
 * - Tienen identidad única (ID)
 * - Mutables dentro de reglas de negocio
 * - Contienen lógica de dominio
 * - Son Aggregate Roots o parte de un agregado
 *
 * AGGREGATE ROOT:
 * User es el Aggregate Root del contexto de autenticación.
 * Todas las operaciones sobre el agregado pasan por él.
 */

export * from './user.entity.js';
