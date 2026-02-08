# Feature 010: Rate Limiting + Account Lockout

## Resumen

Implementación de protección contra ataques de fuerza bruta mediante:
1. **Rate Limiting** - Limitar requests por IP
2. **Account Lockout** - Bloquear cuentas tras intentos fallidos de login

## Reglas de Negocio Implementadas

### Rate Limiting

| Regla | Valor | Descripción |
|-------|-------|-------------|
| RL-01 | 100 req/15min | Rate limit global por IP |
| RL-02 | 5 req/min | Rate limit para endpoints de auth por IP |
| RL-03 | 429 | Status code cuando se excede el límite |
| RL-04 | Retry-After | Header con segundos hasta poder reintentar |
| RL-05 | X-RateLimit-* | Headers informativos en cada response |

### Account Lockout

| Regla | Valor | Descripción |
|-------|-------|-------------|
| AL-01 | 5 intentos | Máximo de intentos fallidos antes de bloqueo |
| AL-02 | 15 minutos | Duración del primer bloqueo |
| AL-03 | Progresivo | Bloqueo aumenta: 15min → 30min → 1h |
| AL-04 | Reset | Intentos se resetean tras login exitoso |

## Archivos Creados

### Domain Layer
- `src/domain/errors/authentication.errors.ts` - Nuevos errores:
  - `AccountLockedError` - Cuenta bloqueada por intentos fallidos
  - `TooManyRequestsError` - Rate limit excedido

### Application Layer
- `src/application/ports/rate-limiter.port.ts` - Interface `IRateLimiter`

### Infrastructure Layer
- `src/infrastructure/services/in-memory-rate-limiter.service.ts` - Implementación in-memory del rate limiter
- `migrations/004_add_lockout_fields.sql` - Migración para campos de lockout en users

### Interfaces Layer
- `src/interfaces/http/middlewares/rate-limit.middleware.ts` - Middleware de rate limiting
- `src/interfaces/http/config/rate-limits.config.ts` - Configuración de límites

### Tests E2E
- `tests/e2e/auth/rate-limiting.e2e.ts` - 6 tests de rate limiting
- `tests/e2e/auth/account-lockout.e2e.ts` - 6 tests de account lockout

### Test Helpers
- `tests/e2e/helpers/api.helper.ts` - Actualizado con generación de IPs únicas

## Archivos Modificados

### Domain Layer
- `src/domain/entities/user.entity.ts` - Nuevos campos y métodos:
  ```typescript
  // Nuevos campos
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
  lockoutCount: number;
  lastFailedLoginAt: Date | null;

  // Nuevos métodos
  recordFailedLogin(now: Date): void;
  recordSuccessfulLogin(now: Date): void;
  isLockedOut(now: Date): boolean;
  getRemainingLockoutSeconds(now: Date): number;
  canAttemptLogin(now: Date): boolean;
  ```

### Application Layer
- `src/application/use-cases/auth/login-user.use-case.ts` - Integración de lógica de lockout

### Infrastructure Layer
- `src/infrastructure/persistence/postgresql/postgres-user.repository.ts` - Mapeo de nuevos campos
- `src/infrastructure/container/container.ts` - Registro del rate limiter

### Interfaces Layer
- `src/interfaces/http/app.factory.ts` - Aplicación de middlewares de rate limiting
- `src/interfaces/http/adapters/error-handler.adapter.ts` - Mapeo de nuevos errores (423, 429)

## Migración SQL

```sql
-- migrations/004_add_lockout_fields.sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS lockout_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP WITH TIME ZONE NULL;

CREATE INDEX IF NOT EXISTS idx_users_lockout_until
  ON users(lockout_until)
  WHERE lockout_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_failed_attempts
  ON users(failed_login_attempts)
  WHERE failed_login_attempts > 0;
```

## Arquitectura

```
Request
   │
   ▼
┌────────────────────┐
│  Rate Limiter      │  ← Límite global por IP (100 req/15min)
│  (Middleware)      │
└─────────┬──────────┘
          │ ✓ Dentro del límite
          ▼
┌────────────────────┐
│  Auth Rate Limiter │  ← Límite específico auth (5 req/min por IP)
│  (Middleware)      │
└─────────┬──────────┘
          │ ✓ Dentro del límite
          ▼
┌────────────────────┐
│  LoginUserUseCase  │
│                    │
│  1. Check lockout  │  ← ¿Cuenta bloqueada?
│  2. Verify creds   │
│  3. Record attempt │  ← Registrar intento (éxito/fallo)
│  4. Lock if needed │  ← Bloquear tras 5 fallos
└────────────────────┘
```

## Tests

### Resultados Finales

| Tipo | Cantidad | Estado |
|------|----------|--------|
| Unit Tests | 528 | ✅ Pasando |
| E2E Tests | 79 | ✅ Pasando |
| **Total** | **607** | ✅ |

### Tests Específicos de la Feature

#### rate-limiting.e2e.ts (6 tests)
- ✅ should include rate limit headers in response
- ✅ should decrement remaining count with each request
- ✅ should block requests when auth rate limit exceeded
- ✅ should return 429 with proper error structure
- ✅ should rate limit login attempts
- ✅ should only apply global rate limit to health endpoint

#### account-lockout.e2e.ts (6 tests)
- ✅ should allow login after 4 failed attempts
- ✅ should lock account after 5 failed attempts
- ✅ should include Retry-After header when account is locked
- ✅ should not reveal if password was correct during lockout
- ✅ should reset failed attempts after successful login
- ✅ should not reveal account existence via lockout for non-existent email

## Solución de Aislamiento de Tests

Para permitir que los tests E2E coexistan con el rate limiting de producción (5 req/min), se implementó aislamiento por IP usando `X-Forwarded-For`:

```typescript
// tests/e2e/helpers/api.helper.ts
let ipCounter = 0;
const workerRandomBase = Math.floor(Math.random() * 1000000);

export function generateUniqueIp(): string {
  ipCounter++;
  const uniqueValue = workerRandomBase + ipCounter + (Date.now() % 100000);
  const octet1 = 10 + (Math.floor(uniqueValue / 16777216) % 118);
  const octet2 = Math.floor(uniqueValue / 65536) % 256;
  const octet3 = Math.floor(uniqueValue / 256) % 256;
  const octet4 = uniqueValue % 256;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}
```

Esto permite:
- Cada test usa una IP única, evitando conflictos de rate limiting
- Los tests de rate limiting usan una IP fija para probar el comportamiento
- Los workers paralelos de Playwright no colisionan gracias a la base aleatoria

## Verificación

```bash
# Ejecutar tests unitarios
npx vitest run tests/unit

# Ejecutar tests E2E
npx playwright test

# Ejecutar tests específicos de la feature
npx playwright test tests/e2e/auth/rate-limiting.e2e.ts
npx playwright test tests/e2e/auth/account-lockout.e2e.ts
```

## Fecha de Implementación

2026-02-08
