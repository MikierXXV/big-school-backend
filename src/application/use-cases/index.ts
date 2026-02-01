/**
 * ============================================
 * USE CASES - BARREL EXPORT
 * ============================================
 *
 * Los casos de uso orquestan la lógica de la aplicación.
 * Son el punto de entrada para cualquier operación.
 *
 * RESPONSABILIDADES:
 * - Recibir DTOs de entrada
 * - Coordinar con dominio e infraestructura
 * - Aplicar reglas de aplicación (no de negocio)
 * - Devolver DTOs de salida
 * - Manejar transacciones
 *
 * PRINCIPIOS:
 * - Un caso de uso = una operación de negocio
 * - Independientes del framework HTTP
 * - Dependen de abstracciones (ports)
 * - Testables de forma aislada
 */

export * from './auth/index.js';
