/**
 * ============================================
 * UNIT TEST: Email Value Object
 * ============================================
 *
 * Tests unitarios para el Value Object Email.
 * Validan la creación, validación, normalización y comparación de emails.
 */

import { describe, it, expect } from 'vitest';
import { Email } from '../../../../src/domain/value-objects/email.value-object.js';
import { InvalidEmailError } from '../../../../src/domain/errors/user.errors.js';

describe('Email Value Object', () => {
  describe('create()', () => {
    it('should create an Email with a valid email address', () => {
      const email = Email.create('user@example.com');

      expect(email).toBeInstanceOf(Email);
      expect(email.value).toBe('user@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('User@EXAMPLE.COM');

      expect(email.value).toBe('user@example.com');
    });

    it('should trim whitespace from email', () => {
      const email = Email.create('  user@example.com  ');

      expect(email.value).toBe('user@example.com');
    });

    it('should throw InvalidEmailError for empty string', () => {
      expect(() => Email.create('')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for whitespace only', () => {
      expect(() => Email.create('   ')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for email without @', () => {
      expect(() => Email.create('userexample.com')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for email without domain', () => {
      expect(() => Email.create('user@')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for email without local part', () => {
      expect(() => Email.create('@example.com')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for email with multiple @', () => {
      expect(() => Email.create('user@@example.com')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for email exceeding max length', () => {
      const longLocalPart = 'a'.repeat(250);
      const longEmail = `${longLocalPart}@example.com`;

      expect(() => Email.create(longEmail)).toThrow(InvalidEmailError);
    });

    it('should accept valid emails with subdomain', () => {
      const email = Email.create('user@mail.example.com');

      expect(email.value).toBe('user@mail.example.com');
    });

    it('should accept valid emails with plus sign', () => {
      const email = Email.create('user+tag@example.com');

      expect(email.value).toBe('user+tag@example.com');
    });

    it('should accept valid emails with dots in local part', () => {
      const email = Email.create('first.last@example.com');

      expect(email.value).toBe('first.last@example.com');
    });
  });

  describe('localPart getter', () => {
    it('should return the local part of the email', () => {
      const email = Email.create('user@example.com');

      expect(email.localPart).toBe('user');
    });
  });

  describe('domain getter', () => {
    it('should return the domain of the email', () => {
      const email = Email.create('user@example.com');

      expect(email.domain).toBe('example.com');
    });
  });

  describe('equals()', () => {
    it('should return true for emails with same value', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('user@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for emails with same value different case', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('USER@EXAMPLE.COM');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for emails with different values', () => {
      const email1 = Email.create('user1@example.com');
      const email2 = Email.create('user2@example.com');

      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return the email string', () => {
      const email = Email.create('user@example.com');

      expect(email.toString()).toBe('user@example.com');
    });
  });

  describe('MAX_LENGTH', () => {
    it('should have MAX_LENGTH of 254', () => {
      expect(Email.MAX_LENGTH).toBe(254);
    });
  });
});
