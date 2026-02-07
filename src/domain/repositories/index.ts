/**
 * ============================================
 * REPOSITORY INTERFACES - BARREL EXPORT
 * ============================================
 *
 * Los Repositorios son INTERFACES definidas en el dominio
 * que especifican cómo se accede a los agregados.
 *
 * PRINCIPIO DE INVERSIÓN DE DEPENDENCIAS:
 * - El dominio DEFINE las interfaces (ports)
 * - La infraestructura IMPLEMENTA las interfaces (adapters)
 * - El dominio NO conoce las implementaciones
 *
 * CARACTERÍSTICAS:
 * - Solo definen operaciones sobre agregados completos
 * - Abstraen completamente la persistencia
 * - Permiten cambiar de base de datos sin tocar el dominio
 */

export * from './user.repository.interface.js';
export * from './refresh-token.repository.interface.js';
export * from './password-reset-token.repository.interface.js';
