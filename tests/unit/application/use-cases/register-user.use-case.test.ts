/**
 * ============================================
 * UNIT TEST: RegisterUser Use Case
 * ============================================
 *
 * Tests unitarios para el caso de uso de registro.
 * Usa mocks/stubs para las dependencias.
 *
 * CASOS A TESTEAR:
 * - Registro exitoso
 * - Email ya registrado
 * - Contraseña débil
 * - Contraseñas no coinciden
 * - Términos no aceptados
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { RegisterUserUseCase, RegisterUserDependencies } from '@application/use-cases/auth/register-user.use-case';
// import { RegisterUserRequestDto } from '@application/dtos/auth/register.dto';
// import { InMemoryUserRepository } from '@infrastructure/persistence/in-memory/in-memory-user.repository';

describe('RegisterUser Use Case', () => {
  // let useCase: RegisterUserUseCase;
  // let mockDependencies: RegisterUserDependencies;

  beforeEach(() => {
    // TODO: Setup mocks
    // mockDependencies = {
    //   userRepository: new InMemoryUserRepository(),
    //   hashingService: {
    //     hash: vi.fn().mockResolvedValue(PasswordHash.fromHash('hashed')),
    //     verify: vi.fn(),
    //     needsRehash: vi.fn(),
    //   },
    //   uuidGenerator: {
    //     generate: vi.fn().mockReturnValue('test-uuid'),
    //     isValid: vi.fn().mockReturnValue(true),
    //   },
    //   dateTimeService: {
    //     now: vi.fn().mockReturnValue(new Date()),
    //     // ... otros métodos
    //   },
    //   logger: {
    //     info: vi.fn(),
    //     warn: vi.fn(),
    //     error: vi.fn(),
    //     debug: vi.fn(),
    //     child: vi.fn().mockReturnThis(),
    //     setLevel: vi.fn(),
    //   },
    // };
    // useCase = new RegisterUserUseCase(mockDependencies);
  });

  describe('execute()', () => {
    describe('successful registration', () => {
      it.todo('should create a new user with valid data');
      it.todo('should return success response with user data');
      it.todo('should hash the password before saving');
      it.todo('should set user status to PENDING_VERIFICATION');
    });

    describe('validation failures', () => {
      it.todo('should throw PasswordMismatchError when passwords do not match');
      it.todo('should throw TermsNotAcceptedError when acceptTerms is false');
      it.todo('should throw WeakPasswordError when password is too weak');
    });

    describe('business rule failures', () => {
      it.todo('should throw UserAlreadyExistsError when email is taken');
      it.todo('should throw InvalidEmailError for invalid email format');
    });

    describe('logging', () => {
      it.todo('should log registration start');
      it.todo('should log registration success');
      it.todo('should log registration failure');
    });
  });
});
