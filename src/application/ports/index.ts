/**
 * ============================================
 * PORTS - BARREL EXPORT
 * ============================================
 *
 * Los Ports son INTERFACES que definen cómo la aplicación
 * se comunica con el mundo exterior (infraestructura).
 *
 * ARQUITECTURA HEXAGONAL:
 * - Ports de ENTRADA: Cómo el exterior llama a la aplicación
 * - Ports de SALIDA: Cómo la aplicación llama al exterior
 *
 * Aquí definimos los Ports de SALIDA:
 * - TokenService: Generación y validación de tokens
 * - HashingService: Hashing de contraseñas
 * - DateTimeService: Abstracción de fecha/hora
 * - UuidGenerator: Generación de UUIDs
 * - Logger: Logging abstracto
 */

export * from './token.service.port.js';
export * from './hashing.service.port.js';
export * from './datetime.service.port.js';
export * from './uuid-generator.port.js';
export * from './logger.port.js';
