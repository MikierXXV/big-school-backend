/**
 * ============================================
 * UNIT TEST: AuthController
 * ============================================
 *
 * Tests para el controlador de autenticación.
 * Los controllers NO capturan errores internamente,
 * los propagan al error handler middleware.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController, HttpRequest } from '../../../../../src/interfaces/http/controllers/auth.controller.js';
import { RegisterUserUseCase } from '../../../../../src/application/use-cases/auth/register-user.use-case.js';
import { LoginUserUseCase } from '../../../../../src/application/use-cases/auth/login-user.use-case.js';
import { RefreshSessionUseCase } from '../../../../../src/application/use-cases/auth/refresh-session.use-case.js';
import { RegisterUserRequestDto, RegisterUserResponseDto } from '../../../../../src/application/dtos/auth/register.dto.js';
import { LoginUserRequestDto, LoginUserResponseDto } from '../../../../../src/application/dtos/auth/login.dto.js';
import { RefreshSessionRequestDto, RefreshSessionResponseDto } from '../../../../../src/application/dtos/auth/refresh-session.dto.js';
import { UserAlreadyExistsError, UserNotActiveError } from '../../../../../src/domain/errors/user.errors.js';
import { InvalidCredentialsError } from '../../../../../src/domain/errors/authentication.errors.js';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegisterUserUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockLoginUserUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockRefreshSessionUseCase: { execute: ReturnType<typeof vi.fn> };

  const VALID_USER_ID = '123e4567-e89b-42d3-a456-426614174000';

  beforeEach(() => {
    mockRegisterUserUseCase = {
      execute: vi.fn(),
    };
    mockLoginUserUseCase = {
      execute: vi.fn(),
    };
    mockRefreshSessionUseCase = {
      execute: vi.fn(),
    };

    controller = new AuthController({
      registerUserUseCase: mockRegisterUserUseCase as unknown as RegisterUserUseCase,
      loginUserUseCase: mockLoginUserUseCase as unknown as LoginUserUseCase,
      refreshSessionUseCase: mockRefreshSessionUseCase as unknown as RefreshSessionUseCase,
    });
  });

  describe('register()', () => {
    const validRegisterRequest: HttpRequest<RegisterUserRequestDto> = {
      body: {
        email: 'test@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        acceptTerms: true,
      },
      headers: {},
      params: {},
      query: {},
    };

    const successfulRegisterResponse: RegisterUserResponseDto = {
      success: true,
      message: 'User registered successfully',
      user: {
        id: VALID_USER_ID,
        email: 'test@example.com',
        fullName: 'Test User',
        status: 'PENDING_VERIFICATION',
        createdAt: new Date().toISOString(),
        requiresEmailVerification: true,
      },
    };

    it('should return 201 with user data on successful registration', async () => {
      mockRegisterUserUseCase.execute.mockResolvedValue(successfulRegisterResponse);

      const result = await controller.register(validRegisterRequest);

      expect(result.statusCode).toBe(201);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successfulRegisterResponse);
    });

    it('should call registerUserUseCase.execute with body from request', async () => {
      mockRegisterUserUseCase.execute.mockResolvedValue(successfulRegisterResponse);

      await controller.register(validRegisterRequest);

      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith(validRegisterRequest.body);
    });

    it('should propagate UserAlreadyExistsError to error handler', async () => {
      const error = new UserAlreadyExistsError('test@example.com');
      mockRegisterUserUseCase.execute.mockRejectedValue(error);

      await expect(controller.register(validRegisterRequest)).rejects.toThrow(UserAlreadyExistsError);
    });

    it('should propagate unexpected errors to error handler', async () => {
      const error = new Error('Unexpected database error');
      mockRegisterUserUseCase.execute.mockRejectedValue(error);

      await expect(controller.register(validRegisterRequest)).rejects.toThrow('Unexpected database error');
    });
  });

  describe('login()', () => {
    const validLoginRequest: HttpRequest<LoginUserRequestDto> = {
      body: {
        email: 'test@example.com',
        password: 'Password123!',
      },
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      params: {},
      query: {},
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    };

    const successfulLoginResponse: LoginUserResponseDto = {
      success: true,
      message: 'Login successful',
      user: {
        id: VALID_USER_ID,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        status: 'ACTIVE',
        emailVerified: true,
        lastLoginAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: 'access-token-value',
        tokenType: 'Bearer',
        expiresIn: 18000,
        expiresAt: new Date(Date.now() + 18000000).toISOString(),
        refreshToken: 'refresh-token-value',
        refreshExpiresIn: 259200,
      },
    };

    it('should return 200 with user and tokens on successful login', async () => {
      mockLoginUserUseCase.execute.mockResolvedValue(successfulLoginResponse);

      const result = await controller.login(validLoginRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successfulLoginResponse);
    });

    it('should call loginUserUseCase.execute with credentials', async () => {
      mockLoginUserUseCase.execute.mockResolvedValue(successfulLoginResponse);

      await controller.login(validLoginRequest);

      expect(mockLoginUserUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should include deviceInfo from userAgent in DTO', async () => {
      mockLoginUserUseCase.execute.mockResolvedValue(successfulLoginResponse);

      await controller.login(validLoginRequest);

      const calledWith = mockLoginUserUseCase.execute.mock.calls[0][0];
      expect(calledWith.deviceInfo).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    it('should return tokens with correct structure', async () => {
      mockLoginUserUseCase.execute.mockResolvedValue(successfulLoginResponse);

      const result = await controller.login(validLoginRequest);

      expect(result.body.data?.tokens).toBeDefined();
      expect(result.body.data?.tokens.accessToken).toBeDefined();
      expect(result.body.data?.tokens.refreshToken).toBeDefined();
    });

    it('should propagate InvalidCredentialsError to error handler', async () => {
      const error = new InvalidCredentialsError();
      mockLoginUserUseCase.execute.mockRejectedValue(error);

      await expect(controller.login(validLoginRequest)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should propagate UserNotActiveError to error handler', async () => {
      const error = new UserNotActiveError(VALID_USER_ID, 'SUSPENDED');
      mockLoginUserUseCase.execute.mockRejectedValue(error);

      await expect(controller.login(validLoginRequest)).rejects.toThrow(UserNotActiveError);
    });
  });

  describe('refresh()', () => {
    const validRefreshRequest: HttpRequest<RefreshSessionRequestDto> = {
      body: {
        refreshToken: 'valid-refresh-token-value',
      },
      headers: {},
      params: {},
      query: {},
    };

    const successfulRefreshResponse: RefreshSessionResponseDto = {
      success: true,
      message: 'Session refreshed successfully',
      tokens: {
        accessToken: 'new-access-token-value',
        tokenType: 'Bearer',
        expiresIn: 18000,
        expiresAt: new Date(Date.now() + 18000000).toISOString(),
        refreshToken: 'new-refresh-token-value',
        refreshExpiresIn: 259200,
      },
    };

    it('should return 200 with new tokens on successful refresh', async () => {
      mockRefreshSessionUseCase.execute.mockResolvedValue(successfulRefreshResponse);

      const result = await controller.refresh(validRefreshRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(successfulRefreshResponse);
    });

    it('should call refreshSessionUseCase.execute with refreshToken from body', async () => {
      mockRefreshSessionUseCase.execute.mockResolvedValue(successfulRefreshResponse);

      await controller.refresh(validRefreshRequest);

      expect(mockRefreshSessionUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockRefreshSessionUseCase.execute).toHaveBeenCalledWith(validRefreshRequest.body);
    });

    it('should return new token pair', async () => {
      mockRefreshSessionUseCase.execute.mockResolvedValue(successfulRefreshResponse);

      const result = await controller.refresh(validRefreshRequest);

      expect(result.body.data?.tokens.accessToken).toBe('new-access-token-value');
      expect(result.body.data?.tokens.refreshToken).toBe('new-refresh-token-value');
    });

    it('should propagate errors to error handler', async () => {
      const error = new Error('Invalid refresh token');
      mockRefreshSessionUseCase.execute.mockRejectedValue(error);

      await expect(controller.refresh(validRefreshRequest)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout()', () => {
    const validLogoutRequest: HttpRequest<{ refreshToken: string }> = {
      body: {
        refreshToken: 'refresh-token-to-revoke',
      },
      headers: {},
      params: {},
      query: {},
    };

    it('should return 200 with success message', async () => {
      const result = await controller.logout(validLogoutRequest);

      expect(result.statusCode).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data?.message).toBeDefined();
    });

    it('should accept refreshToken in body', async () => {
      const result = await controller.logout(validLogoutRequest);

      // Should not throw, should handle gracefully
      expect(result.statusCode).toBe(200);
    });
  });
});
