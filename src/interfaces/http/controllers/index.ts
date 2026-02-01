/**
 * ============================================
 * CONTROLLERS - BARREL EXPORT
 * ============================================
 *
 * Los controladores manejan HTTP requests.
 * Traducen requests a DTOs, invocan casos de uso,
 * y traducen respuestas a HTTP responses.
 *
 * NOTA: Los controladores son independientes del framework.
 * La integración con Express, Fastify, etc. se hace en routes.
 */

export * from './auth.controller.js';
export * from './health.controller.js';
