# Feature 005: Entry Point + DI Container

## Resumen

Implementación del punto de entrada de la aplicación y el contenedor de inyección de dependencias, haciendo el servidor completamente ejecutable.

## Componentes Implementados

### 1. Environment Config

**Archivo:** `src/infrastructure/config/environment.config.ts`

Implementación completa de `loadEnvironmentConfig()` que carga y valida variables de entorno.

```typescript
// Uso
const config = loadEnvironmentConfig();
// {
//   server: { port, host, environment, isProduction, isDevelopment, isTest },
//   cors: { origin, credentials },
//   rateLimit: { windowMs, maxRequests }
// }
```

**Características:**
- Carga PORT (default: 3000)
- Carga HOST (default: localhost)
- Detecta NODE_ENV (default: development)
- Flags de entorno: isProduction, isDevelopment, isTest
- Configuración CORS desde variables de entorno
- Configuración Rate Limiting

### 2. DI Container

**Archivo:** `src/infrastructure/container/container.ts`

Contenedor de inyección de dependencias que instancia y conecta todas las dependencias.

```typescript
// Uso
const container = createContainer();
// {
//   logger, dateTimeService, uuidGenerator, hashingService, tokenService,
//   userRepository, refreshTokenRepository,
//   registerUserUseCase, loginUserUseCase, refreshSessionUseCase,
//   config: { server, jwt }
// }
```

**Características:**
- Instancia servicios de infraestructura (Logger, DateTime, UUID, Hashing, Token)
- Instancia repositorios (InMemory por defecto)
- Instancia use cases con todas sus dependencias inyectadas
- Expone configuración del servidor y JWT

### 3. Entry Point

**Archivo:** `src/index.ts`

Punto de entrada principal de la aplicación.

```typescript
// Iniciar servidor
npm run dev
// o
npx tsx src/index.ts
```

**Características:**
- Carga dotenv al inicio
- Crea DI container
- Crea Express app via `createApp()`
- Inicia servidor HTTP
- Logs estructurados de inicio
- Graceful shutdown (SIGTERM/SIGINT)

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        main()                                │
│                     (src/index.ts)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   createContainer()                          │
│              (container/container.ts)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Config    │  │  Services   │  │    Repositories     │ │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────┤ │
│  │ ServerConfig│  │ ConsoleLogger│ │ InMemoryUserRepo    │ │
│  │ JwtConfig   │  │ SystemDateTime│ │ InMemoryTokenRepo   │ │
│  │             │  │ CryptoUuid  │  │                     │ │
│  │             │  │ BcryptHash  │  │                     │ │
│  │             │  │ JwtToken    │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     Use Cases                            ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ RegisterUserUseCase │ LoginUserUseCase │ RefreshSession ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      createApp()                             │
│                  (app.factory.ts)                            │
│                         │                                    │
│                         ▼                                    │
│                 Express Application                          │
│                         │                                    │
│                         ▼                                    │
│               app.listen(port)                               │
└─────────────────────────────────────────────────────────────┘
```

## Variables de Entorno

| Variable | Requerido | Default | Descripción |
|----------|-----------|---------|-------------|
| `NODE_ENV` | ❌ | development | Entorno de ejecución |
| `PORT` | ❌ | 3000 | Puerto del servidor |
| `HOST` | ❌ | localhost | Host del servidor |
| `JWT_ACCESS_SECRET` | ✅ | - | Clave para access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | - | Clave para refresh tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRATION` | ❌ | 18000 | Expiración access token (segundos) |
| `JWT_REFRESH_EXPIRATION` | ❌ | 259200 | Expiración refresh token (segundos) |
| `HASH_SALT_ROUNDS` | ❌ | 12 | Rounds para bcrypt |
| `LOG_LEVEL` | ❌ | info | Nivel de log (debug/info/warn/error) |
| `CORS_ORIGIN` | ❌ | http://localhost:5173 | Origen CORS permitido |
| `CORS_CREDENTIALS` | ❌ | false | Permitir credentials |
| `RATE_LIMIT_WINDOW_MS` | ❌ | 900000 | Ventana rate limit (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | 100 | Max requests por ventana |

## Tests Implementados

### Resumen de Tests

| Componente | Tests | Estado |
|------------|-------|--------|
| environment.config | 18 | ✅ |
| container | 12 | ✅ |
| **Total Feature 005** | **30** | ✅ |
| **Total Proyecto** | **346** | ✅ |

### Cobertura por Componente

**environment.config:**
- Server config: PORT, HOST, NODE_ENV
- Environment flags: isProduction, isDevelopment, isTest
- CORS config: origin, credentials
- Rate limit config: windowMs, maxRequests

**container:**
- Crea todas las dependencias
- Servicios implementan interfaces correctamente
- Use cases son instancias válidas
- Repositorios son InMemory
- Config incluye server y JWT

## Ejecutar

```bash
# 1. Configurar .env
cp .env.example .env
# Editar JWT secrets (min 32 caracteres)

# 2. Instalar dependencias
npm install

# 3. Ejecutar tests
npx vitest run tests/unit/

# 4. Iniciar servidor
npm run dev

# 5. Verificar health
curl http://localhost:3000/health

# 6. Probar registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","confirmPassword":"Test123!@#"}'
```

## Dependencias

```json
{
  "dependencies": {
    "dotenv": "^16.x"
  }
}
```

## Cambios Adicionales

### jwt-token.service.ts

Se corrigió la importación de clases de error de jsonwebtoken para compatibilidad ESM:

```typescript
// Antes (no funciona con ESM)
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// Después (compatible con ESM)
import * as jwt from 'jsonwebtoken';
const { JsonWebTokenError, TokenExpiredError } = jwt;
```

## Próximos Pasos

1. **Fase 6:** Tests E2E con Playwright
2. **PostgreSQL:** Implementar repositorios reales (cuando se integre la BD)
3. **Docker:** Configurar containerización
4. **CI/CD:** Pipeline de integración continua
