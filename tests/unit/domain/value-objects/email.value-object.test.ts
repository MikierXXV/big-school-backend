/**
 * ============================================
 * UNIT TEST: Email Value Object
 * ============================================
 *
 * Tests unitarios para el Value Object Email.
 * Validan formato y normalización.
 *
 * CASOS A TESTEAR:
 * - Creación con email válido
 * - Rechazo de emails inválidos
 * - Normalización a lowercase
 * - Extracción de partes (local, domain)
 * - Igualdad por valor
 */

import { describe, it, expect } from 'vitest';
// import { Email } from '@domain/value-objects/email.value-object';
// import { InvalidEmailError } from '@domain/errors/user.errors';

describe('Email Value Object', () => {
  describe('create()', () => {
    it.todo('should create an Email with valid format');
    it.todo('should normalize email to lowercase');
    it.todo('should trim whitespace');
    it.todo('should throw InvalidEmailError for empty string');
    it.todo('should throw InvalidEmailError for missing @');
    it.todo('should throw InvalidEmailError for missing domain');
    it.todo('should throw InvalidEmailError for missing local part');
    it.todo('should throw InvalidEmailError for email exceeding max length');
  });

  describe('localPart', () => {
    it.todo('should return the part before @');
  });

  describe('domain', () => {
    it.todo('should return the part after @');
  });

  describe('equals()', () => {
    it.todo('should return true for same email (case insensitive)');
    it.todo('should return false for different emails');
  });

  describe('toString()', () => {
    it.todo('should return the normalized email string');
  });
});
