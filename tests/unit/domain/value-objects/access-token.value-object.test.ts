/**
 * ============================================
 * UNIT TEST: AccessToken Value Object
 * ============================================
 *
 * Tests unitarios para el Value Object AccessToken.
 *
 * CASOS A TESTEAR:
 * - Creación con datos válidos
 * - Validez: 5 horas
 * - Verificación de expiración
 * - Cálculo de tiempo restante
 */

import { describe, it, expect } from 'vitest';
// import { AccessToken } from '@domain/value-objects/access-token.value-object';

describe('AccessToken Value Object', () => {
  describe('VALIDITY_SECONDS', () => {
    it.todo('should be 18000 (5 hours)');
  });

  describe('create()', () => {
    it.todo('should create an AccessToken with provided values');
    it.todo('should store metadata correctly');
  });

  describe('isExpired()', () => {
    it.todo('should return false when current date is before expiresAt');
    it.todo('should return true when current date is after expiresAt');
    it.todo('should return true when current date equals expiresAt');
  });

  describe('remainingTimeSeconds()', () => {
    it.todo('should return positive seconds when not expired');
    it.todo('should return 0 when expired');
  });

  describe('expiresAt', () => {
    it.todo('should return a new Date instance each time');
  });

  describe('toString()', () => {
    it.todo('should return a safe representation (partial token)');
    it.todo('should include expiration info');
  });
});
