/**
 * ============================================
 * SERVICE: OAuthProviderService
 * ============================================
 *
 * Implementación de IOAuthProviderService.
 * Maneja los flujos OAuth para Google y Microsoft.
 *
 * ENDPOINTS:
 * Google:
 *   - Auth: https://accounts.google.com/o/oauth2/v2/auth
 *   - Token: https://oauth2.googleapis.com/token
 *   - Profile: https://www.googleapis.com/oauth2/v3/userinfo
 *
 * Microsoft:
 *   - Auth: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
 *   - Token: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
 *   - Profile: https://graph.microsoft.com/v1.0/me
 *
 * ESTADO (CSRF):
 * Usa JWT firmado con OAUTH_STATE_SECRET para evitar almacenamiento server-side.
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';
import {
  IOAuthProviderService,
  OAuthProviderTokens,
  OAuthUserProfile,
} from '../../application/ports/oauth-provider.service.port.js';
import {
  OAuthProviderError,
  OAuthInvalidStateError,
  OAuthEmailNotProvidedError,
} from '../../domain/errors/oauth.errors.js';
import { OAuthConfig } from '../config/oauth.config.js';

// ============================================
// TIPOS INTERNOS
// ============================================

interface OAuthStatePayload {
  provider: string;
  nonce: string;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
}

interface MicrosoftTokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
}

interface MicrosoftUserInfo {
  id: string;
  mail?: string;
  userPrincipalName?: string;
  givenName?: string;
  surname?: string;
  displayName?: string;
}

/**
 * Implementación del servicio OAuth para Google y Microsoft.
 */
export class OAuthProviderService implements IOAuthProviderService {
  private readonly config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  // ============================================
  // STATE (CSRF)
  // ============================================

  public generateState(provider: string): string {
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const payload: OAuthStatePayload = { provider, nonce };
    return jwt.sign(payload, this.config.stateSecret, {
      expiresIn: this.config.stateExpiresInSeconds,
    });
  }

  public verifyState(state: string): { provider: string } {
    try {
      const decoded = jwt.verify(state, this.config.stateSecret) as OAuthStatePayload;
      return { provider: decoded.provider };
    } catch {
      throw new OAuthInvalidStateError('State JWT is invalid or expired');
    }
  }

  // ============================================
  // AUTHORIZATION URL
  // ============================================

  public getAuthorizationUrl(
    provider: string,
    redirectUri: string,
    state: string
  ): string {
    switch (provider) {
      case 'google':
        return this.getGoogleAuthorizationUrl(redirectUri, state);
      case 'microsoft':
        return this.getMicrosoftAuthorizationUrl(redirectUri, state);
      default:
        throw new OAuthProviderError(provider, `Unsupported provider: ${provider}`);
    }
  }

  private getGoogleAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.google.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.config.google.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private getMicrosoftAuthorizationUrl(redirectUri: string, state: string): string {
    const tenant = this.config.microsoft.tenantId || 'common';
    const params = new URLSearchParams({
      client_id: this.config.microsoft.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.config.microsoft.scopes.join(' '),
      state,
      response_mode: 'query',
    });
    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  // ============================================
  // CODE EXCHANGE
  // ============================================

  public async exchangeCode(
    provider: string,
    code: string,
    redirectUri: string
  ): Promise<OAuthProviderTokens> {
    switch (provider) {
      case 'google':
        return this.exchangeGoogleCode(code, redirectUri);
      case 'microsoft':
        return this.exchangeMicrosoftCode(code, redirectUri);
      default:
        throw new OAuthProviderError(provider, `Unsupported provider: ${provider}`);
    }
  }

  private async exchangeGoogleCode(
    code: string,
    redirectUri: string
  ): Promise<OAuthProviderTokens> {
    try {
      const response = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: this.config.google.clientId,
          client_secret: this.config.google.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return {
        accessToken: response.data.access_token,
        idToken: response.data.id_token,
      };
    } catch (error) {
      throw new OAuthProviderError('google', this.extractErrorMessage(error));
    }
  }

  private async exchangeMicrosoftCode(
    code: string,
    redirectUri: string
  ): Promise<OAuthProviderTokens> {
    const tenant = this.config.microsoft.tenantId || 'common';
    try {
      const response = await axios.post<MicrosoftTokenResponse>(
        `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
        new URLSearchParams({
          code,
          client_id: this.config.microsoft.clientId,
          client_secret: this.config.microsoft.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: this.config.microsoft.scopes.join(' '),
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return {
        accessToken: response.data.access_token,
        idToken: response.data.id_token,
      };
    } catch (error) {
      throw new OAuthProviderError('microsoft', this.extractErrorMessage(error));
    }
  }

  // ============================================
  // USER PROFILE
  // ============================================

  public async getUserProfile(
    provider: string,
    accessToken: string
  ): Promise<OAuthUserProfile> {
    switch (provider) {
      case 'google':
        return this.getGoogleUserProfile(accessToken);
      case 'microsoft':
        return this.getMicrosoftUserProfile(accessToken);
      default:
        throw new OAuthProviderError(provider, `Unsupported provider: ${provider}`);
    }
  }

  private async getGoogleUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    try {
      const response = await axios.get<GoogleUserInfo>(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = response.data;

      if (!data.email) {
        throw new OAuthEmailNotProvidedError('google');
      }

      const nameParts = (data.name || '').split(' ');
      return {
        providerUserId: data.sub,
        email: data.email,
        firstName: data.given_name || nameParts[0] || '',
        lastName: data.family_name || nameParts.slice(1).join(' ') || '',
        emailVerified: data.email_verified ?? false,
      };
    } catch (error) {
      if (error instanceof OAuthEmailNotProvidedError) throw error;
      throw new OAuthProviderError('google', this.extractErrorMessage(error));
    }
  }

  private async getMicrosoftUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    try {
      const response = await axios.get<MicrosoftUserInfo>(
        'https://graph.microsoft.com/v1.0/me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = response.data;

      // Microsoft puede devolver email en 'mail' o 'userPrincipalName'
      const email = data.mail || data.userPrincipalName || '';
      if (!email) {
        throw new OAuthEmailNotProvidedError('microsoft');
      }

      const displayParts = (data.displayName || '').split(' ');
      return {
        providerUserId: data.id,
        email,
        firstName: data.givenName || displayParts[0] || '',
        lastName: data.surname || displayParts.slice(1).join(' ') || '',
        emailVerified: true, // Microsoft siempre verifica emails
      };
    } catch (error) {
      if (error instanceof OAuthEmailNotProvidedError) throw error;
      throw new OAuthProviderError('microsoft', this.extractErrorMessage(error));
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as Record<string, unknown> | undefined;
      return (data?.['error_description'] as string) ||
             (data?.['error'] as string) ||
             error.message;
    }
    if (error instanceof Error) return error.message;
    return 'Unknown error';
  }
}
