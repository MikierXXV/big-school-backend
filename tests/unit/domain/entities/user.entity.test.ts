/**
 * ============================================
 * UNIT TEST: User Entity
 * ============================================
 *
 * Tests unitarios para la entidad User.
 * Validan las reglas de negocio del Aggregate Root.
 *
 * CASOS A TESTEAR:
 * - Creación de usuario
 * - Verificación de email
 * - Registro de login
 * - Cambio de contraseña
 * - Suspensión/Reactivación
 * - Validación de estado para login
 */

import { describe, it, expect, beforeEach } from 'vitest';
// import { User, UserStatus, CreateUserData } from '@domain/entities/user.entity';
// import { UserId } from '@domain/value-objects/user-id.value-object';
// import { Email } from '@domain/value-objects/email.value-object';
// import { PasswordHash } from '@domain/value-objects/password-hash.value-object';

describe('User Entity', () => {
  // let validUserData: CreateUserData;

  beforeEach(() => {
    // TODO: Setup de datos válidos para tests
    // validUserData = {
    //   id: UserId.create('123e4567-e89b-12d3-a456-426614174000'),
    //   email: Email.create('test@example.com'),
    //   passwordHash: PasswordHash.fromHash('$2b$12$...'),
    //   firstName: 'John',
    //   lastName: 'Doe',
    // };
  });

  describe('create()', () => {
    it.todo('should create a user with PENDING_VERIFICATION status');
    it.todo('should set createdAt and updatedAt to current date');
    it.todo('should set lastLoginAt to null');
    it.todo('should set emailVerifiedAt to null');
  });

  describe('canLogin()', () => {
    it.todo('should return true when user is ACTIVE');
    it.todo('should return false when user is PENDING_VERIFICATION');
    it.todo('should return false when user is SUSPENDED');
    it.todo('should return false when user is DEACTIVATED');
  });

  describe('verifyEmail()', () => {
    it.todo('should set emailVerifiedAt to provided date');
    it.todo('should change status to ACTIVE if was PENDING_VERIFICATION');
    it.todo('should not change status if was already ACTIVE');
    it.todo('should update updatedAt');
  });

  describe('recordLogin()', () => {
    it.todo('should update lastLoginAt');
    it.todo('should update updatedAt');
  });

  describe('updatePassword()', () => {
    it.todo('should update passwordHash');
    it.todo('should update updatedAt');
  });

  describe('suspend()', () => {
    it.todo('should change status to SUSPENDED');
    it.todo('should update updatedAt');
  });

  describe('reactivate()', () => {
    it.todo('should change status to ACTIVE');
    it.todo('should update updatedAt');
  });

  describe('equals()', () => {
    it.todo('should return true for same id');
    it.todo('should return false for different id');
  });
});
