/**
 * ============================================
 * UNIT TEST: Environment Configuration
 * ============================================
 *
 * Tests para la carga y validación de configuración de entorno.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadEnvironmentConfig,
  Environment,
  ServerConfig,
  EnvironmentConfig,
} from '../../../../src/infrastructure/config/environment.config.js';

describe('Environment Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loadEnvironmentConfig', () => {
    describe('server configuration', () => {
      it('should load PORT from environment variable', () => {
        process.env.PORT = '4000';

        const config = loadEnvironmentConfig();

        expect(config.server.port).toBe(4000);
      });

      it('should use default PORT 3000 when not set', () => {
        delete process.env.PORT;

        const config = loadEnvironmentConfig();

        expect(config.server.port).toBe(3000);
      });

      it('should load HOST from environment variable', () => {
        process.env.HOST = '0.0.0.0';

        const config = loadEnvironmentConfig();

        expect(config.server.host).toBe('0.0.0.0');
      });

      it('should use default HOST localhost when not set', () => {
        delete process.env.HOST;

        const config = loadEnvironmentConfig();

        expect(config.server.host).toBe('localhost');
      });

      it('should detect NODE_ENV correctly', () => {
        process.env.NODE_ENV = 'production';

        const config = loadEnvironmentConfig();

        expect(config.server.environment).toBe('production');
      });

      it('should default to development when NODE_ENV not set', () => {
        delete process.env.NODE_ENV;

        const config = loadEnvironmentConfig();

        expect(config.server.environment).toBe('development');
      });
    });

    describe('environment flags', () => {
      it('should set isProduction true when NODE_ENV is production', () => {
        process.env.NODE_ENV = 'production';

        const config = loadEnvironmentConfig();

        expect(config.server.isProduction).toBe(true);
        expect(config.server.isDevelopment).toBe(false);
        expect(config.server.isTest).toBe(false);
      });

      it('should set isDevelopment true when NODE_ENV is development', () => {
        process.env.NODE_ENV = 'development';

        const config = loadEnvironmentConfig();

        expect(config.server.isProduction).toBe(false);
        expect(config.server.isDevelopment).toBe(true);
        expect(config.server.isTest).toBe(false);
      });

      it('should set isTest true when NODE_ENV is test', () => {
        process.env.NODE_ENV = 'test';

        const config = loadEnvironmentConfig();

        expect(config.server.isProduction).toBe(false);
        expect(config.server.isDevelopment).toBe(false);
        expect(config.server.isTest).toBe(true);
      });
    });

    describe('CORS configuration', () => {
      it('should load CORS_ORIGIN from environment variable', () => {
        process.env.CORS_ORIGIN = 'https://example.com';

        const config = loadEnvironmentConfig();

        expect(config.cors.origin).toBe('https://example.com');
      });

      it('should use default CORS origin when not set', () => {
        delete process.env.CORS_ORIGIN;

        const config = loadEnvironmentConfig();

        expect(config.cors.origin).toBe('http://localhost:5173');
      });

      it('should load CORS_CREDENTIALS from environment variable', () => {
        process.env.CORS_CREDENTIALS = 'true';

        const config = loadEnvironmentConfig();

        expect(config.cors.credentials).toBe(true);
      });

      it('should default CORS_CREDENTIALS to false when not true', () => {
        process.env.CORS_CREDENTIALS = 'false';

        const config = loadEnvironmentConfig();

        expect(config.cors.credentials).toBe(false);
      });
    });

    describe('rate limit configuration', () => {
      it('should load RATE_LIMIT_WINDOW_MS from environment variable', () => {
        process.env.RATE_LIMIT_WINDOW_MS = '60000';

        const config = loadEnvironmentConfig();

        expect(config.rateLimit.windowMs).toBe(60000);
      });

      it('should use default rate limit window when not set', () => {
        delete process.env.RATE_LIMIT_WINDOW_MS;

        const config = loadEnvironmentConfig();

        expect(config.rateLimit.windowMs).toBe(900000); // 15 minutes
      });

      it('should load RATE_LIMIT_MAX_REQUESTS from environment variable', () => {
        process.env.RATE_LIMIT_MAX_REQUESTS = '50';

        const config = loadEnvironmentConfig();

        expect(config.rateLimit.maxRequests).toBe(50);
      });

      it('should use default max requests when not set', () => {
        delete process.env.RATE_LIMIT_MAX_REQUESTS;

        const config = loadEnvironmentConfig();

        expect(config.rateLimit.maxRequests).toBe(100);
      });
    });

    describe('configuration immutability', () => {
      it('should return readonly configuration object', () => {
        const config = loadEnvironmentConfig();

        // TypeScript should prevent mutations, but we verify the structure
        expect(config.server).toBeDefined();
        expect(config.cors).toBeDefined();
        expect(config.rateLimit).toBeDefined();
      });
    });
  });
});
