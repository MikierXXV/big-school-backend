/**
 * ============================================
 * UNIT TEST: LoginUser Use Case
 * ============================================
 *
 * Tests unitarios para el caso de uso de login.
 *
 * CASOS A TESTEAR:
 * - Login exitoso
 * - Usuario no encontrado
 * - Contraseña incorrecta
 * - Usuario no activo
 * - Generación de tokens
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { LoginUserUseCase, LoginUserDependencies } from '@application/use-cases/auth/login-user.use-case';

describe('LoginUser Use Case', () => {
  // let useCase: LoginUserUseCase;
  // let mockDependencies: LoginUserDependencies;

  beforeEach(() => {
    // TODO: Setup mocks
  });

  describe('execute()', () => {
    describe('successful login', () => {
      it.todo('should return tokens for valid credentials');
      it.todo('should return user data without sensitive information');
      it.todo('should generate access token with correct expiration (5 hours)');
      it.todo('should generate refresh token with correct expiration (3 days)');
      it.todo('should store refresh token in repository');
      it.todo('should update lastLoginAt');
    });

    describe('authentication failures', () => {
      it.todo('should throw InvalidCredentialsError for non-existent email');
      it.todo('should throw InvalidCredentialsError for wrong password');
      it.todo('should not reveal whether email exists or password is wrong');
    });

    describe('authorization failures', () => {
      it.todo('should throw UserNotActiveError for suspended user');
      it.todo('should throw UserNotActiveError for deactivated user');
      it.todo('should throw EmailNotVerifiedError for unverified user');
    });

    describe('security', () => {
      it.todo('should use constant-time password comparison');
      it.todo('should log failed login attempts');
      it.todo('should include device info in refresh token if provided');
    });
  });
});
