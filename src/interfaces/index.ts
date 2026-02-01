/**
 * ============================================
 * INTERFACES LAYER - BARREL EXPORT
 * ============================================
 *
 * La capa de interfaces maneja la comunicación con el exterior.
 * Traduce requests HTTP a DTOs y respuestas a JSON.
 *
 * RESPONSABILIDADES:
 * - Controllers: Manejar HTTP requests
 * - Routes: Definir endpoints
 * - Middlewares: Auth, validación, error handling
 * - Validators: Validar input
 *
 * PRINCIPIO:
 * Esta capa NO contiene lógica de negocio.
 * Solo traduce entre HTTP y casos de uso.
 */

// ============================================
// HTTP (Controllers, Routes, Middlewares)
// ============================================
export * from './http/index.js';
