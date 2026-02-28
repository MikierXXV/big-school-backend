# Feature 011: OAuth2 Authentication

**Rama:** `feature-011-oauth2-authentication`

## Contexto

El proyecto ya tiene un sistema de autenticación completo con email/password, JWT tokens, refresh token rotation, rate limiting y account lockout. El objetivo es añadir OAuth2 con Google y Microsoft sin romper lo existente. Los usuarios podrán:
1. Registrarse/loguearse con Google o Microsoft
2. Vincular/desvincular OAuth a cuentas con password existentes
3. Tener cuentas solo-OAuth (sin password) o con ambos métodos

---

## Posibilidades de Implementación

### Opción A: Librerías Oficiales (RECOMENDADA)
- `google-auth-library` (Google SDK oficial) + `@azure/msal-node` (Microsoft SDK oficial)
- **Pros**: Bien mantenidas, manejan PKCE y validación JWT automáticamente, más seguras
- **Cons**: Dependencias adicionales (~500KB)

### Opción B: Axios + JWKS manual
- `axios` (ya instalado) + `jose` para validar tokens con JWKS
- **Pros**: Sin dependencias nuevas externas, más control
- **Cons**: Más código a mantener, debes gestionar rotación de JWKS keys

### Opción C: Passport.js
- `passport-google-oauth20` + `passport-azure-ad`
- **Pros**: Familiar, ampliamente documentado
- **Cons**: **Incompatible con Clean Architecture** — Passport inyecta en middlewares Express, dificulta test unitario y viola ports & adapters

**Decisión: Opción A** — Librerías oficiales envueltas en adapters (ports & adapters pattern).

---

## Impacto en el Proyecto Existente

| Componente | Tipo de Cambio | Detalle |
|------------|---------------|---------|
| `users` table | **MODIFICAR** | `password_hash` pasa a NULLABLE (OAuth users no tienen contraseña) |
| `User` entity | **MODIFICAR** | `passwordHash` opcional, nuevo método `hasPassword()` |
| `LoginUserUseCase` | **MODIFICAR** | Si user no tiene password → lanzar `OAuthOnlyAccountError` |
| `RegisterUserUseCase` | Sin cambios | El flujo password sigue igual |
| Container | **EXTENDER** | Registrar nuevos services/repos/use cases |
| Routes | **EXTENDER** | Añadir `/auth/oauth/:provider/*` routes |
| `.env` | **EXTENDER** | Añadir credenciales Google + Microsoft |

---

## Flujo OAuth2 Completo

```
┌──────────────────────────────────────────────────────────────────────────┐
│  FLUJO: Backend Redirect Directo + Exchange Code (1 sola tabla extra)   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Frontend ──► GET /auth/oauth/google/authorize                        │
│     ◄── { authorizationUrl: "https://accounts.google.com/...?state=JWT" }│
│                                                                           │
│  2. Frontend redirige al usuario a Google/Microsoft                      │
│                                                                           │
│  3. Google/Microsoft ──► GET /auth/oauth/google/callback?code=X&state=Y  │
│       Backend valida state JWT (PKCE + CSRF)                             │
│       Backend intercambia code por tokens del provider                   │
│       Backend obtiene user info (email, name, avatar)                    │
│       Backend encuentra/crea User + OAuthAccount                        │
│       Backend genera JWT accessToken + refreshToken                     │
│       Backend crea exchange_code (UUID, 30s, en memoria)                │
│       Backend ──► 302 Redirect a FRONTEND_CALLBACK_URL?code=exchange_code│
│                                                                           │
│  4. Frontend ──► POST /auth/oauth/exchange { code: exchange_code }       │
│     ◄── { accessToken, refreshToken, expiresIn, user, isNewUser }        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Migraciones SQL

Solo 2 migraciones (sin tabla de state tokens — usamos JWT firmados, igual que los verification tokens actuales):

### Migration 005: Hacer password_hash nullable

```sql
-- migrations/005_make_password_hash_nullable.sql

-- Los usuarios OAuth no tienen contraseña local
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Índice extra para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
```

### Migration 006: Tabla oauth_accounts

```sql
-- migrations/006_create_oauth_accounts_table.sql

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,              -- 'google' | 'microsoft'
    provider_user_id VARCHAR(255) NOT NULL,      -- 'sub' claim del ID token
    email VARCHAR(254) NOT NULL,                 -- email del provider
    display_name VARCHAR(200) NULL,
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT oauth_accounts_provider_check CHECK (
        provider IN ('google', 'microsoft')
    ),
    CONSTRAINT oauth_accounts_unique UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_lookup ON oauth_accounts(provider, provider_user_id);
CREATE INDEX idx_oauth_accounts_email ON oauth_accounts(provider, email);
```

> **Nota sobre State Tokens**: Se usan JWTs firmados (HMAC-SHA256) de 10 min como state parameter. El `code_verifier` del PKCE viaja en el propio state JWT — sin tabla adicional. Esto es consistente con el patrón de `verification tokens` ya existente.

---

## Componentes por Capa

### Domain Layer (CREAR)

| Archivo | Descripción |
|---------|-------------|
| `src/domain/value-objects/oauth-provider.value-object.ts` | `OAuthProvider`: 'google' \| 'microsoft' — validación, igualdad |
| `src/domain/entities/oauth-account.entity.ts` | `OAuthAccount`: id, userId, provider, providerUserId, email, displayName, avatarUrl, timestamps |
| `src/domain/repositories/oauth-account.repository.interface.ts` | `IOAuthAccountRepository`: findByProvider, findByUserId, save, delete |
| `src/domain/errors/oauth.errors.ts` | `OAuthProviderNotSupportedError`, `OAuthAccountAlreadyLinkedError`, `OAuthAccountNotFoundError`, `OAuthOnlyAccountError`, `InvalidOAuthStateError`, `OAuthProviderError` |

### Domain Layer (MODIFICAR)

| Archivo | Cambio |
|---------|--------|
| `src/domain/entities/user.entity.ts` | `passwordHash` → `PasswordHash \| null`; añadir `hasPassword(): boolean`; `canLogin()` actualizado |

### Application Layer (CREAR)

| Archivo | Descripción |
|---------|-------------|
| `src/application/ports/oauth-provider.service.port.ts` | `IOAuthProviderService`: `getAuthorizationUrl(state, codeChallenge)`, `exchangeCode(code, codeVerifier): OAuthUserInfo` |
| `src/application/ports/oauth-state.service.port.ts` | `IOAuthStateService`: `generateState(provider, action, userId?): string`, `validateState(token): OAuthStatePayload` |
| `src/application/dtos/auth/oauth.dto.ts` | `OAuthAuthorizeRequestDto`, `OAuthAuthorizeResponseDto`, `OAuthCallbackRequestDto`, `OAuthCallbackResponseDto`, `OAuthUserInfo`, `OAuthStatePayload`, `LinkedProviderDto` |
| `src/application/use-cases/auth/oauth-authorize.use-case.ts` | Genera state JWT + code_verifier PKCE → devuelve URL de redirección |
| `src/application/use-cases/auth/oauth-callback.use-case.ts` | Valida state, intercambia code, encuentra/crea user, genera JWT tokens, crea exchange_code |
| `src/application/use-cases/auth/exchange-oauth-code.use-case.ts` | Valida exchange_code (30s), devuelve JWT tokens + user + isNewUser |
| `src/application/use-cases/auth/oauth-link.use-case.ts` | Vincula provider OAuth a cuenta autenticada |
| `src/application/use-cases/auth/oauth-unlink.use-case.ts` | Desvincula; valida que el user no quede sin método de auth |
| `src/application/use-cases/auth/get-oauth-providers.use-case.ts` | Lista providers vinculados al usuario |

### Application Layer (MODIFICAR)

| Archivo | Cambio |
|---------|--------|
| `src/application/use-cases/auth/login-user.use-case.ts` | Si `!user.hasPassword()` → lanzar `OAuthOnlyAccountError` |

### Infrastructure Layer (CREAR)

| Archivo | Descripción |
|---------|-------------|
| `src/infrastructure/config/oauth.config.ts` | `loadOAuthConfig()`: lee GOOGLE_* y MICROSOFT_* del env |
| `src/infrastructure/services/google-oauth.service.ts` | `GoogleOAuthService implements IOAuthProviderService` — usa `google-auth-library` |
| `src/infrastructure/services/microsoft-oauth.service.ts` | `MicrosoftOAuthService implements IOAuthProviderService` — usa `@azure/msal-node` |
| `src/infrastructure/services/jwt-oauth-state.service.ts` | `JwtOAuthStateService implements IOAuthStateService` — firma con OAUTH_STATE_SECRET |
| `src/infrastructure/services/in-memory-oauth-exchange-code.service.ts` | `InMemoryOAuthExchangeCodeService` — Map<code, {tokens, user}>, TTL 30s, limpia expirados |
| `src/infrastructure/persistence/postgresql/postgres-oauth-account.repository.ts` | Implementación PostgreSQL |
| `src/infrastructure/persistence/in-memory/in-memory-oauth-account.repository.ts` | Para tests (igual patrón que los otros in-memory repos) |

### Infrastructure Layer (MODIFICAR)

| Archivo | Cambio |
|---------|--------|
| `src/infrastructure/container/container.ts` | Registrar todos los nuevos services, repos y use cases |

### Interfaces Layer (CREAR)

| Archivo | Descripción |
|---------|-------------|
| `src/interfaces/http/controllers/oauth.controller.ts` | `OAuthController`: authorize, callback, link, unlink, getProviders |
| `src/interfaces/http/routes/oauth.routes.ts` | Monta rutas bajo `/auth/oauth` |
| `src/interfaces/http/validators/oauth.validators.ts` | Validación de provider param ('google'\|'microsoft'), query params callback |

### Interfaces Layer (MODIFICAR)

| Archivo | Cambio |
|---------|--------|
| `src/interfaces/http/app.factory.ts` | Añadir oauth routes |
| `src/interfaces/http/config/rate-limits.config.ts` | Rate limit para endpoints OAuth (20 req/15min por IP) |

---

## Endpoints

| Método | Ruta | Auth | Rate Limit | Descripción |
|--------|------|------|-----------|-------------|
| GET | `/auth/oauth/:provider/authorize` | No | 20/15min | Genera state JWT + PKCE → { authorizationUrl } |
| GET | `/auth/oauth/:provider/callback` | No | 20/15min | Callback del provider → redirige a frontend?code=exchange_code |
| POST | `/auth/oauth/exchange` | No | 20/15min | Canjea exchange_code (UUID 30s) → JWT tokens + user |
| POST | `/auth/oauth/:provider/link` | **Sí** | 10/15min | Vincula provider OAuth a cuenta autenticada |
| DELETE | `/auth/oauth/:provider/unlink` | **Sí** | 10/15min | Desvincula (requiere otro método de auth) |
| GET | `/auth/oauth/providers` | **Sí** | 60/15min | Lista providers vinculados del usuario |

**Exchange Code**: UUID v4, expira en 30 segundos, un solo uso, guardado en memoria (Map en el servicio).

---

## Dependencias

```bash
# Desde /backend
npm install google-auth-library @azure/msal-node
```

Librerías existentes que se reutilizan:
- `jsonwebtoken` — state tokens JWT
- `crypto` (Node built-in) — PKCE code_verifier/code_challenge
- `axios` — no necesario (las libs oficiales hacen sus propias peticiones HTTP)

---

## Variables de Entorno

```env
# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/oauth/google/callback

# Microsoft OAuth2
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common          # 'common' acepta cuentas personales y organizacionales
MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/oauth/microsoft/callback

# OAuth State Token (CSRF protection)
OAUTH_STATE_SECRET=min-32-chars-random-secret
OAUTH_STATE_EXPIRATION_SECONDS=600  # 10 minutos

# Exchange Code (post-callback, el frontend canjea esto por JWT tokens)
OAUTH_EXCHANGE_CODE_EXPIRATION_SECONDS=30
FRONTEND_CALLBACK_URL=http://localhost:5173/auth/callback   # URL del frontend
```

### Explicación de Variables

| Variable | Propósito | Obtención |
|----------|-----------|-----------|
| `GOOGLE_CLIENT_ID` | ID público de la app en Google | Google Cloud Console → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Secreto privado (NUNCA commitear) | Se genera junto con el Client ID |
| `GOOGLE_REDIRECT_URI` | URL de callback registrada en Google | Debe coincidir exactamente con Google Console |
| `MICROSOFT_CLIENT_ID` | Application (client) ID en Azure | Azure Portal → App registrations |
| `MICROSOFT_CLIENT_SECRET` | Client Secret en Azure | Azure Portal → Certificates & secrets |
| `MICROSOFT_TENANT_ID` | `common` / `organizations` / `consumers` / `<tenant-id>` | Define qué tipos de cuentas acepta |
| `OAUTH_STATE_SECRET` | Secreto para firmar state JWTs | `openssl rand -base64 32` |
| `FRONTEND_CALLBACK_URL` | URL del frontend para redirección | Ej: `http://localhost:5173/auth/callback` |

---

## Orden de Implementación TDD

```
PASO 1: Migraciones SQL                                   (no tests)
  005_make_password_hash_nullable.sql
  006_create_oauth_accounts_table.sql

PASO 2: Domain — Modificar User Entity                    → ~8 tests nuevos
  user.entity.test.ts (añadir casos):
  - hasPassword() → true si passwordHash != null
  - hasPassword() → false si passwordHash == null
  - canLogin() sin password (OAuth user) → true si ACTIVE + email verified
  - User.create() acepta passwordHash = null
  user.entity.ts: passwordHash?: PasswordHash, hasPassword()

PASO 3: Domain — OAuthProvider Value Object               → ~12 tests
  - create('google') → OK
  - create('microsoft') → OK
  - create('facebook') → OAuthProviderNotSupportedError
  - equals() entre dos OAuthProvider

PASO 4: Domain — OAuthAccount Entity                      → ~15 tests
  - create() con datos válidos
  - id es inmutable, provider es OAuthProvider VO
  - email es Email VO

PASO 5: Domain — OAuth Errors                             (solo definiciones)
  - OAuthProviderNotSupportedError
  - OAuthAccountAlreadyLinkedError
  - InvalidOAuthStateError, OAuthProviderError

PASO 6: Domain — IOAuthAccountRepository Interface        (solo definición)

PASO 7: Application — Ports                               (solo definiciones)
  IOAuthProviderService, IOAuthStateService

PASO 8: Application — DTOs                                (solo definiciones)

PASO 9: Infrastructure — OAuthConfig                     → ~10 tests
  - loadOAuthConfig() lee variables de entorno
  - lanza si faltan credenciales

PASO 10: Infrastructure — JwtOAuthStateService           → ~16 tests
  - generateState() devuelve JWT
  - validateState() con token válido/expirado/inválido

PASO 11: Infrastructure — GoogleOAuthService              → ~18 tests
  (mockeando google-auth-library)
  - getAuthorizationUrl() con PKCE
  - exchangeCode() → OAuthUserInfo

PASO 12: Infrastructure — MicrosoftOAuthService           → ~18 tests
  (mockeando @azure/msal-node)

PASO 13a: Infrastructure — InMemoryOAuthExchangeCodeService → ~15 tests
  - store() → exchange_code UUID
  - get() con código válido/expirado/usado/desconocido

PASO 13b: Infrastructure — InMemoryOAuthAccountRepository  → ~20 tests

PASO 14: Application — OAuthAuthorizeUseCase              → ~20 tests
  - execute('google') → { authorizationUrl }
  - genera PKCE code_verifier/code_challenge

PASO 15: Application — OAuthCallbackUseCase               → ~40 tests
  - Usuario nuevo → crear User + OAuthAccount
  - Usuario existente → login directo
  - Auto-link por email coincidente

PASO 15b: Application — ExchangeOAuthCodeUseCase           → ~15 tests
  - code válido → tokens
  - code expirado/usado → error

PASO 16-18: Use Cases de Link/Unlink/GetProviders        → ~45 tests

PASO 19: Modificar LoginUserUseCase                       → ~3 tests

PASO 20: Interfaces — OAuthController                     → ~30 tests

PASO 21: Container Integration                            → ~5 tests

PASO 22: E2E Tests                                        → ~40 tests
                                                  ─────────────
                                                  ~315 tests nuevos
                                                  (~900 tests total)
```

---

## Seguridad

| Mecanismo | Implementación |
|-----------|---------------|
| **PKCE** | `code_verifier` (32 bytes random) + `code_challenge = base64url(SHA256(verifier))` — siempre S256 |
| **CSRF / State** | JWT firmado con `OAUTH_STATE_SECRET` (HS256), exp 10 min, uso único |
| **Redirect URI** | Validar contra whitelist de URIs configuradas (no se acepta redirect_uri del cliente) |
| **Rate Limiting** | 20 req/15min en authorize+callback, 10 req/15min en link+unlink |
| **Email verificado** | Para Google: solo si `email_verified=true`; para Microsoft: siempre verificado |
| **Auto-link email** | Seguro: solo se auto-vincula si el email del provider coincide exactamente con el user existente |

---

## Verificación

```bash
# 1. Instalar dependencias (desde /backend)
npm install google-auth-library @azure/msal-node

# 2. Configurar .env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
OAUTH_STATE_SECRET=min-32-chars-random-string
FRONTEND_CALLBACK_URL=http://localhost:5173/auth/callback

# 3. Ejecutar migraciones SQL
# Aplicar 005_make_password_hash_nullable.sql
# Aplicar 006_create_oauth_accounts_table.sql

# 4. Tests unitarios por componente (TDD - escribir antes de implementar)
npx vitest run tests/unit/domain/value-objects/oauth-provider.value-object.test.ts
npx vitest run tests/unit/domain/entities/oauth-account.entity.test.ts
npx vitest run tests/unit/infrastructure/services/jwt-oauth-state.service.test.ts
npx vitest run tests/unit/application/use-cases/oauth-callback.use-case.test.ts

# 5. Suite completa
npm run test:unit

# 6. Tests E2E
npx playwright test tests/e2e/auth/oauth.e2e.ts

# 7. Probar manualmente (requiere credenciales reales en .env)
npm run dev
# 1. GET http://localhost:3000/auth/oauth/google/authorize → copiar authorizationUrl
# 2. Visitar authorizationUrl en navegador
# 3. Google redirige a http://localhost:3000/auth/oauth/google/callback
# 4. Backend redirige a frontend?code=xxx
# 5. POST http://localhost:3000/auth/oauth/exchange { code: xxx } → JWT tokens
```

---

## Resultado Esperado

Al finalizar esta feature:
- ✅ Flujo completo: authorize → callback → exchange → JWT tokens
- ✅ Login/registro con Google (PKCE + state CSRF + email_verified check)
- ✅ Login/registro con Microsoft (personal + organizacional via tenant=common)
- ✅ Auto-link si el email ya existe con password
- ✅ Vincular/desvincular providers a cuentas existentes
- ✅ Usuarios OAuth-only (sin password) soportados
- ✅ LoginUseCase rechaza usuarios OAuth-only con mensaje informativo
- ✅ Exchange code de un solo uso, 30 segundos, en memoria
- ✅ ~315 tests nuevos (~900 tests total)
- ✅ Clean Architecture preservada (IOAuthProviderService port + adapters)
- ✅ 2 migraciones SQL: password_hash nullable + oauth_accounts table
