# Feature 003: Infrastructure Services

## Resumen

Implementación de los servicios de infraestructura siguiendo TDD, proporcionando las implementaciones concretas de los ports definidos en la capa de aplicación.

## Componentes Implementados

### 1. CryptoUuidGenerator

**Archivo:** `src/infrastructure/services/crypto-uuid-generator.service.ts`

Implementa `IUuidGenerator` usando el módulo `crypto` nativo de Node.js.

```typescript
// Uso
const generator = new CryptoUuidGenerator();
const uuid = generator.generate();      // "123e4567-e89b-42d3-a456-426614174000"
const isValid = generator.isValid(uuid); // true
```

**Características:**
- Genera UUIDs v4 criptográficamente seguros
- Validación de formato UUID v4
- Sin dependencias externas

### 2. BcryptHashingService

**Archivo:** `src/infrastructure/services/bcrypt-hashing.service.ts`

Implementa `IHashingService` usando `bcryptjs` para hashing de contraseñas.

```typescript
// Uso
const service = new BcryptHashingService({ saltRounds: 12 });

const hash = await service.hash("password123");
const isValid = await service.verify("password123", hash);
const needsRehash = service.needsRehash(hash);
```

**Características:**
- Salt rounds configurables (default: 12)
- Comparación en tiempo constante
- Detección de necesidad de rehash

### 3. JwtConfig

**Archivo:** `src/infrastructure/config/jwt.config.ts`

Carga y valida la configuración JWT desde variables de entorno.

```typescript
// Uso
const config = loadJwtConfig();
// {
//   accessToken: { secret, expirationSeconds, algorithm },
//   refreshToken: { secret, expirationSeconds, algorithm },
//   issuer, audience
// }
```

**Variables de Entorno:**
| Variable | Requerido | Default | Descripción |
|----------|-----------|---------|-------------|
| `JWT_ACCESS_SECRET` | ✅ | - | Clave para access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | - | Clave para refresh tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRATION` | ❌ | 18000 | Expiración access token (segundos) |
| `JWT_REFRESH_EXPIRATION` | ❌ | 259200 | Expiración refresh token (segundos) |
| `JWT_ISSUER` | ❌ | "big-school-api" | Emisor del token |
| `JWT_AUDIENCE` | ❌ | "big-school-client" | Audiencia del token |

### 4. JwtTokenService

**Archivo:** `src/infrastructure/services/jwt-token.service.ts`

Implementa `ITokenService` usando `jsonwebtoken` para operaciones JWT.

```typescript
// Uso
const service = new JwtTokenService(config, dateTimeService);

// Generar tokens
const accessToken = await service.generateAccessToken({ userId, email });
const refreshToken = await service.generateRefreshToken({ userId, tokenId });

// Validar tokens
const result = await service.validateAccessToken(token);
// { isValid: true, payload: { userId, email } }
// { isValid: false, error: 'expired' | 'malformed' | 'invalid_signature' }

// Decodificar sin validar (útil para tokens expirados)
const payload = service.decodeAccessToken(token);

// Hash para almacenamiento seguro
const hash = await service.hashRefreshToken(tokenValue);
```

**Tiempos de Expiración:**
- Access Token: **5 horas** (18000 segundos)
- Refresh Token: **3 días** (259200 segundos)

## Dependencias Instaladas

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.9"
  }
}
```

> **Nota:** Se usa `bcryptjs` (JavaScript puro) en lugar de `bcrypt` (nativo) para evitar problemas de compilación en diferentes plataformas.

## Tests Implementados

### Resumen de Tests

| Componente | Tests | Estado |
|------------|-------|--------|
| CryptoUuidGenerator | 10 | ✅ |
| BcryptHashingService | 14 | ✅ |
| JwtConfig | 16 | ✅ |
| JwtTokenService | 27 | ✅ |
| **Total** | **67** | ✅ |

### Cobertura por Componente

**CryptoUuidGenerator:**
- `generate()`: formato UUID v4, unicidad, bits de versión/variante
- `isValid()`: validación de formato, case-insensitive

**BcryptHashingService:**
- `hash()`: genera PasswordHash válido, salts únicos
- `verify()`: comparación correcta/incorrecta
- `needsRehash()`: detección de rounds insuficientes
- Constructor: saltRounds configurables

**JwtConfig:**
- `loadJwtConfig()`: carga desde env, valores por defecto
- `isValidJwtSecret()`: validación de longitud
- Errores: secrets faltantes o inválidos

**JwtTokenService:**
- `generateAccessToken()`: payload, expiración, claims custom
- `generateRefreshToken()`: tokenId, parentTokenId, deviceInfo
- `validateAccessToken()`: válido, expirado, malformado, firma inválida
- `validateRefreshToken()`: mismos casos
- `decodeAccessToken()`: sin validación, null para inválidos
- `hashRefreshToken()`: SHA256 consistente

## Ejecutar Tests

```bash
# Tests de infraestructura
npx vitest run tests/unit/infrastructure/

# Todos los tests unitarios (229 tests)
npx vitest run tests/unit/

# Tests con watch mode
npx vitest tests/unit/infrastructure/
```

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  ITokenService  │  │ IHashingService │  │IUuidGenerator│ │
│  │     (Port)      │  │     (Port)      │  │   (Port)     │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
└───────────┼────────────────────┼──────────────────┼─────────┘
            │ implements         │ implements       │ implements
┌───────────┼────────────────────┼──────────────────┼─────────┐
│           ▼                    ▼                  ▼         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ JwtTokenService │  │BcryptHashing    │  │CryptoUuid   │ │
│  │   (Adapter)     │  │  Service        │  │ Generator   │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                  │         │
│           ▼                    ▼                  ▼         │
│      jsonwebtoken         bcryptjs           crypto         │
│                    Infrastructure Layer                      │
└─────────────────────────────────────────────────────────────┘
```

## Decisiones Técnicas

### 1. bcryptjs vs bcrypt

Se eligió `bcryptjs` (implementación pura en JavaScript) sobre `bcrypt` (binding nativo) para:
- Evitar problemas de compilación de módulos nativos
- Mayor compatibilidad entre plataformas
- Instalación más sencilla

### 2. ES Module Imports

Los imports se realizan con `import * as`:
```typescript
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
```

Esto es necesario para compatibilidad con ES Modules y el target de compilación.

### 3. RefreshToken.fromPersistence vs createNew

`JwtTokenService.generateRefreshToken()` usa `RefreshToken.fromPersistence()` en lugar de `createNew()` para soportar tanto tokens iniciales como tokens rotados con `parentTokenId`.

### 4. Token Hash Storage

Los refresh tokens se hashean con SHA256 antes de almacenarse:
```typescript
const hash = await tokenService.hashRefreshToken(token.value);
```

Esto permite verificar tokens sin almacenar el valor real.

## Próximos Pasos

1. **Fase 4.6:** Implementar PostgreSQL repositories
2. **Fase 5:** Implementar capa de interfaces HTTP (controllers, middlewares)
3. **Fase 6:** Tests E2E con Playwright
