/**
 * ============================================
 * DOMAIN EVENTS - BARREL EXPORT
 * ============================================
 *
 * Los eventos de dominio representan hechos que han ocurrido
 * en el dominio y que pueden ser de interés para otras partes
 * del sistema.
 *
 * CARACTERÍSTICAS:
 * - Inmutables (representan el pasado)
 * - Nombrados en pasado (UserRegistered, LoginSucceeded)
 * - Contienen toda la información necesaria
 * - Desacoplan componentes del sistema
 *
 * USO FUTURO:
 * - Event Sourcing
 * - CQRS
 * - Notificaciones
 * - Auditoría
 */

export * from './domain-event.interface.js';
export * from './user.events.js';
export * from './authentication.events.js';
