# Feature 004: HTTP Interfaces Layer

## Resumen

Implementación de la capa de interfaces HTTP siguiendo TDD, utilizando Express como framework y el patrón Adapter para mantener los controllers independientes del framework.

## Componentes Implementados

### 1. Express Adapters

#### toHttpRequest / sendHttpResponse

**Archivo:** `src/interfaces/http/adapters/express.adapter.ts`

Convierte entre Express Request/Response y las abstracciones HttpRequest/HttpResponse.

```typescript
// Uso
const httpRequest = toHttpRequest<LoginDto>(expressReq);
// { body, headers, params, query, ip?, userAgent? }

sendHttpResponse(expressRes, httpResponse);
// Envía statusCode, body y headers
```

**Características:**
- Extrae IP de `X-Forwarded-For` (soporte proxy)
- Extrae User-Agent del header
- Compatible con `exactOptionalPropertyTypes: true`

#### adaptRoute

**Archivo:** `src/interfaces/http/adapters/route-adapter.ts`

Wrappea métodos de controller para usarlos como handlers de Express.

```typescript
// Uso
app.post('/auth/login', adaptRoute(authController, 'login'));
```

**Características:**
- Convierte Request → HttpRequest automáticamente
- Captura errores y los pasa a `next(error)`
- Validación de existencia de método

#### createExpressErrorHandler

**Archivo:** `src/interfaces/http/adapters/error-handler.adapter.ts`

Adapta ErrorHandlerMiddleware para Express.

```typescript
// Uso
app.use(createExpressErrorHandler(errorHandlerMiddleware));
```

**Características:**
- Extrae correlationId del request
- Mapea DomainError/ApplicationError a HTTP status codes
- Oculta detalles en producción

#### createValidationMiddleware

**Archivo:** `src/interfaces/http/adapters/validation.adapter.ts`

Adapta funciones de validación a Express middleware.

```typescript
// Uso
app.post('/auth/register',
  createValidationMiddleware(validateRegisterRequest),
  adaptRoute(authController, 'register')
);
```

**Características:**
- Retorna 400 con VALIDATION_ERROR si falla
- Incluye errores de campo en `details`
- Llama `next()` si validación pasa

#### createExpressAuthMiddleware

**Archivo:** `src/interfaces/http/adapters/auth-middleware.adapter.ts`

Adapta AuthMiddleware para Express.

```typescript
// Uso
app.post('/auth/logout',
  createExpressAuthMiddleware(authMiddleware),
  adaptRoute(authController, 'logout')
);
```

**Características:**
- Extrae Bearer token del header Authorization
- Adjunta `user` al request si autenticación exitosa
- Retorna 401 con WWW-Authenticate header si falla

### 2. AuthController

**Archivo:** `src/interfaces/http/controllers/auth.controller.ts`

Controller framework-agnostic para autenticación.

```typescript
// Métodos implementados
controller.register(request)  // POST /auth/register → 201
controller.login(request)     // POST /auth/login → 200
controller.refresh(request)   // POST /auth/refresh → 200
controller.logout(request)    // POST /auth/logout → 200
```

**Características:**
- Independiente de Express
- Propaga errores al error handler (no captura internamente)
- Incluye `deviceInfo` desde `userAgent` en login

### 3. AuthMiddleware

**Archivo:** `src/interfaces/http/middlewares/auth.middleware.ts`

Middleware framework-agnostic para autenticación.

```typescript
// Uso
const result = await authMiddleware.authenticate(httpRequest);
// { success: true, user: { userId, email } }
// { success: false, response: HttpResponse }
```

**Características:**
- Valida formato Bearer token
- Mensajes específicos para token expirado vs inválido
- Incluye header WWW-Authenticate en respuestas 401

### 4. App Factory

**Archivo:** `src/interfaces/http/app.factory.ts`

Factory para crear la aplicación Express configurada.

```typescript
// Uso
const app = createApp({
  logger,
  uuidGenerator,
  tokenService,
  registerUserUseCase,
  loginUserUseCase,
  refreshSessionUseCase,
  isProduction: false,
  version: '1.0.0',
});

app.listen(3000);
```

**Características:**
- Configura body parser JSON
- Request context middleware (correlationId)
- Rutas de health check
- Rutas de autenticación con validación
- Handler 404
- Error handler centralizado

## Arquitectura

```
Express Request
       │
       ▼
┌──────────────────┐
│ express.adapter  │  toHttpRequest()
└──────────────────┘
       │
       ▼
┌──────────────────┐
│  HttpRequest     │  (framework-agnostic)
└──────────────────┘
       │
       ▼
┌──────────────────┐
│  Controller      │  AuthController.register()
└──────────────────┘
       │
       ▼
┌──────────────────┐
│  HttpResponse    │  (framework-agnostic)
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ express.adapter  │  sendHttpResponse()
└──────────────────┘
       │
       ▼
Express Response
```

### Middleware Chain

```
1. express.json()               (body parser)
2. RequestContextMiddleware     (correlationId, logging)
3. ValidationMiddleware         (por ruta)
4. AuthMiddleware               (solo logout)
5. Controller Handler
6. ErrorHandlerMiddleware       (captura errores)
```

## Rutas Implementadas

| Método | Ruta | Auth | Validación | Descripción |
|--------|------|------|------------|-------------|
| GET | `/health` | ❌ | ❌ | Health check básico |
| GET | `/health/live` | ❌ | ❌ | Liveness probe |
| GET | `/health/ready` | ❌ | ❌ | Readiness probe |
| POST | `/auth/register` | ❌ | ✅ | Registro de usuario |
| POST | `/auth/login` | ❌ | ✅ | Login |
| POST | `/auth/refresh` | ❌ | ✅ | Refresh token |
| POST | `/auth/logout` | ✅ | ❌ | Logout |

## Tests Implementados

### Resumen de Tests

| Componente | Tests | Estado |
|------------|-------|--------|
| express.adapter | 13 | ✅ |
| route-adapter | 8 | ✅ |
| error-handler.adapter | 8 | ✅ |
| validation.adapter | 6 | ✅ |
| auth-middleware.adapter | 8 | ✅ |
| auth.controller | 16 | ✅ |
| auth.middleware | 15 | ✅ |
| app.factory | 13 | ✅ |
| **Total Interfaces** | **87** | ✅ |
| **Total Proyecto** | **316** | ✅ |

### Cobertura por Componente

**express.adapter:**
- `toHttpRequest()`: extracción de body, headers, params, query, ip, userAgent
- `sendHttpResponse()`: envío de statusCode, body, headers custom

**route-adapter:**
- `adaptRoute()`: conversión, llamada a controller, manejo de errores

**error-handler.adapter:**
- `createExpressErrorHandler()`: DomainError, ApplicationError, errores desconocidos

**validation.adapter:**
- `createValidationMiddleware()`: validación exitosa, fallida, errores múltiples

**auth-middleware.adapter:**
- `createExpressAuthMiddleware()`: token válido, inválido, expirado, faltante

**auth.controller:**
- `register()`: éxito, errores de validación, usuario existente
- `login()`: éxito, credenciales inválidas, usuario inactivo
- `refresh()`: éxito, token inválido
- `logout()`: éxito

**app.factory:**
- `createApp()`: configuración JSON, rutas health, rutas auth, validación, auth middleware, error handler, 404

## Ejecutar Tests

```bash
# Tests de interfaces HTTP
npx vitest run tests/unit/interfaces/

# Tests con watch mode
npx vitest tests/unit/interfaces/

# Todos los tests unitarios (316 tests)
npx vitest run tests/unit/

# Type checking
npm run typecheck
```

## Dependencias

```json
{
  "dependencies": {
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2"
  }
}
```

## Decisiones Técnicas

### 1. Controllers Framework-Agnostic

Los controllers no dependen de Express:
```typescript
// Controller recibe HttpRequest genérico
public async login(request: HttpRequest<LoginDto>): Promise<HttpResponse<LoginResponseDto>>
```

Esto permite:
- Testing sin Express
- Migración a otros frameworks (Fastify, Koa)
- Separación clara de responsabilidades

### 2. Adapter Pattern

Se usa el patrón Adapter para conectar:
- Express ↔ Controllers
- Express ↔ Middlewares
- Express ↔ Error Handlers

### 3. exactOptionalPropertyTypes

Compatibilidad con TypeScript estricto usando spread condicional:
```typescript
return {
  body: req.body,
  ...(req.ip ? { ip: req.ip } : {}),
  ...(userAgent ? { userAgent } : {}),
};
```

### 4. Error Propagation

Los controllers NO capturan errores internamente:
```typescript
// Errores se propagan al error handler
const result = await this.deps.loginUserUseCase.execute(dto);
```

El error handler centralizado convierte errores a HTTP responses.

### 5. Correlation ID

Cada request recibe un correlationId único:
- Generado o extraído de `X-Correlation-ID`
- Incluido en response headers
- Usado en logging y error tracking

## Próximos Pasos

1. **Fase 5:** Implementar PostgreSQL repositories (cuando se integre la BD)
2. **Fase 6:** Tests E2E con Playwright
3. **Server:** Crear entry point principal (`src/main.ts`)
4. **Docker:** Configurar containerización
