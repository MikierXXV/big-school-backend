/**
 * ============================================
 * DTOs - BARREL EXPORT
 * ============================================
 *
 * Los DTOs (Data Transfer Objects) son objetos simples
 * para transferir datos entre capas.
 *
 * TIPOS DE DTOs:
 * - Request DTOs: Datos de entrada para casos de uso
 * - Response DTOs: Datos de salida de casos de uso
 *
 * CARACTERÍSTICAS:
 * - Son objetos planos (no tienen comportamiento)
 * - Son inmutables (propiedades readonly)
 * - NO contienen lógica de negocio
 * - Pueden incluir validaciones básicas de formato
 */

export * from './auth/index.js';
export * from './user/index.js';
