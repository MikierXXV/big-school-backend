/**
 * Shared types for E2E tests
 */

export interface TestUserData {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface RegisteredUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  verificationToken?: string;
}

export interface TokenPair {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: string;
  refreshToken: string;
  refreshExpiresIn: number;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
}

export interface LoginResult {
  user: UserResponse;
  tokens: TokenPair;
}

export interface RefreshResult {
  tokens: TokenPair;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    retryAfter?: number;
  };
}

export type ApiResponse<T> = {
  status: number;
  body: ApiSuccessResponse<T> | ApiErrorResponse;
  headers: Record<string, string>;
};
