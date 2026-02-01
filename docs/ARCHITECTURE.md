# Big School Backend - Arquitectura

## Principios Arquitecturales Aplicados

### 1. Clean Architecture (Robert C. Martin)

La arquitectura limpia organiza el código en capas concéntricas donde las dependencias apuntan **siempre hacia adentro**.

```
┌─────────────────────────────────────────────────────────┐
│                    INTERFACES                           │
│              (Controllers, Routes, Middlewares)         │
├─────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE                        │
│        (Repositories, Services, Config, Logging)        │
├─────────────────────────────────────────────────────────┤
│                    APPLICATION                          │
│              (Use Cases, DTOs, Ports)                   │
├─────────────────────────────────────────────────────────┤
│                      DOMAIN                             │
│    (Entities, Value Objects, Repositories Interfaces)   │
└─────────────────────────────────────────────────────────┘
```

**Regla de Dependencia**: El código de las capas internas no conoce nada de las capas externas.

---

### 2. Hexagonal Architecture (Ports & Adapters)

También conocida como arquitectura de puertos y adaptadores.

```
                    ┌─────────────────┐
                    │   HTTP Client   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Controllers   │  ◄── Adapter (Driving)
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────┐
              │                             │
              │    ┌─────────────────┐      │
              │    │    Use Cases    │      │
              │    └────────┬────────┘      │
              │             │               │
              │    ┌────────▼────────┐      │
              │    │     Ports       │      │  ◄── Application Core
              │    │  (Interfaces)   │      │
              │    └────────┬────────┘      │
              │             │               │
              │    ┌────────▼────────┐      │
              │    │     Domain      │      │
              │    └─────────────────┘      │
              │                             │
              └──────────────┬──────────────┘
                             │
                    ┌────────▼────────┐
                    │   Repositories  │  ◄── Adapter (Driven)
                    │    Services     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   External APIs │
                    └─────────────────┘
```

**Ports**: Interfaces definidas en la capa de aplicación (`src/application/ports/`)
**Adapters**: Implementaciones en infraestructura (`src/infrastructure/services/`)

---

### 3. Domain-Driven Design (DDD)

#### Aggregate Root
- **User**: Entidad principal que controla la consistencia del agregado

#### Value Objects
Objetos inmutables que representan conceptos del dominio:
- `UserId`: Identificador único (UUID)
- `Email`: Email validado y normalizado
- `PasswordHash`: Hash seguro de contraseña
- `AccessToken`: Token de acceso JWT (5 horas)
- `RefreshToken`: Token de refresco (3 días)

#### Domain Events
Eventos que representan hechos importantes del dominio:
- `UserRegisteredEvent`
- `LoginSucceededEvent`
- `LoginFailedEvent`
- `SessionRefreshedEvent`
- `TokenReuseDetectedEvent`

#### Domain Errors
Errores específicos del dominio con códigos identificables:
- `UserNotFoundError`
- `EmailAlreadyExistsError`
- `InvalidCredentialsError`
- `TokenExpiredError`
- `TokenReuseDetectedError`

---

### 4. Test-Driven Development (TDD)

Estructura de tests en tres niveles:

```
tests/
├── unit/           # Tests unitarios (Vitest)
│   ├── domain/     # Entidades, Value Objects
│   └── application/# Use Cases
├── integration/    # Tests de integración (Vitest)
│   └── repositories/
└── e2e/            # Tests End-to-End (Playwright)
    └── auth/
```

---

## Configuración de Tokens JWT

| Token | Duración | Uso |
|-------|----------|-----|
| Access Token | 5 horas (18000s) | Autenticación de requests |
| Refresh Token | 3 días (259200s) | Renovación de sesión |

### Estrategia de Rotación de Refresh Tokens

```
1. Login → Se genera Refresh Token A
2. Refresh con A → Se genera B, A se marca como ROTATED
3. Si alguien usa A de nuevo → Se detecta REUSO
4. Se revoca toda la familia de tokens (A, B, ...)
```

Esta estrategia protege contra el robo de refresh tokens.

---

## Árbol de Carpetas

```
backend/
├── docs/
│   └── ARCHITECTURE.md
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   └── index.ts
│   │   ├── value-objects/
│   │   │   ├── user-id.value-object.ts
│   │   │   ├── email.value-object.ts
│   │   │   ├── password-hash.value-object.ts
│   │   │   ├── access-token.value-object.ts
│   │   │   ├── refresh-token.value-object.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.interface.ts
│   │   │   ├── refresh-token.repository.interface.ts
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── domain-error.base.ts
│   │   │   ├── user.errors.ts
│   │   │   ├── authentication.errors.ts
│   │   │   └── index.ts
│   │   ├── events/
│   │   │   ├── domain-event.base.ts
│   │   │   ├── user.events.ts
│   │   │   ├── authentication.events.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   └── auth/
│   │   │       ├── register-user.use-case.ts
│   │   │       ├── login-user.use-case.ts
│   │   │       ├── refresh-session.use-case.ts
│   │   │       └── index.ts
│   │   ├── dtos/
│   │   │   └── auth/
│   │   │       ├── register-user.dto.ts
│   │   │       ├── login-user.dto.ts
│   │   │       ├── refresh-session.dto.ts
│   │   │       └── index.ts
│   │   ├── ports/
│   │   │   ├── token-service.port.ts
│   │   │   ├── hashing-service.port.ts
│   │   │   ├── datetime-service.port.ts
│   │   │   ├── uuid-generator.port.ts
│   │   │   ├── logger.port.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── infrastructure/
│   │   ├── config/
│   │   │   ├── environment.config.ts
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   └── index.ts
│   │   ├── persistence/
│   │   │   ├── postgresql/
│   │   │   │   ├── postgres-user.repository.ts
│   │   │   │   ├── postgres-refresh-token.repository.ts
│   │   │   │   └── index.ts
│   │   │   └── in-memory/
│   │   │       ├── in-memory-user.repository.ts
│   │   │       ├── in-memory-refresh-token.repository.ts
│   │   │       └── index.ts
│   │   ├── services/
│   │   │   ├── jwt-token.service.ts
│   │   │   ├── bcrypt-hashing.service.ts
│   │   │   ├── system-datetime.service.ts
│   │   │   ├── crypto-uuid-generator.service.ts
│   │   │   └── index.ts
│   │   ├── logging/
│   │   │   ├── console-logger.service.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── interfaces/
│   │   └── http/
│   │       ├── controllers/
│   │       │   ├── auth.controller.ts
│   │       │   ├── health.controller.ts
│   │       │   └── index.ts
│   │       ├── routes/
│   │       │   ├── auth.routes.ts
│   │       │   ├── health.routes.ts
│   │       │   └── index.ts
│   │       ├── middlewares/
│   │       │   ├── auth.middleware.ts
│   │       │   ├── error-handler.middleware.ts
│   │       │   ├── correlation-id.middleware.ts
│   │       │   └── index.ts
│   │       ├── validators/
│   │       │   ├── auth.validators.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.test.ts
│   │   │   └── value-objects/
│   │   │       ├── email.value-object.test.ts
│   │   │       ├── user-id.value-object.test.ts
│   │   │       └── password-hash.value-object.test.ts
│   │   └── application/
│   │       └── use-cases/
│   │           ├── register-user.use-case.test.ts
│   │           ├── login-user.use-case.test.ts
│   │           └── refresh-session.use-case.test.ts
│   ├── integration/
│   │   └── repositories/
│   │       ├── user.repository.test.ts
│   │       └── refresh-token.repository.test.ts
│   └── e2e/
│       └── auth/
│           ├── register.e2e.ts
│           ├── login.e2e.ts
│           └── refresh.e2e.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── playwright.config.ts
```

---

## Flujo de Dependencias

```
Interfaces → Application → Domain
     ↓            ↓
Infrastructure ───┘

Las flechas indican la dirección de las dependencias.
Domain NO depende de nada externo.
```

---

## Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Runtime | Node.js |
| Lenguaje | TypeScript |
| Config | dotenv |
| HTTP Client | axios |
| Auth | JWT (jsonwebtoken) |
| Hashing | bcrypt |
| Tests Unit | Vitest |
| Tests E2E | Playwright |
| Base de Datos | PostgreSQL |

---

## Próximos Pasos para Implementación

1. `npm install` - Instalar dependencias
2. Implementar Value Objects (validaciones)
3. Implementar User Entity
4. Implementar servicios de infraestructura (JWT, Bcrypt)
5. Implementar repositorios PostgreSQL
6. Implementar Use Cases
7. Configurar servidor HTTP (Express/Fastify)
8. Implementar Controllers y Routes
9. Ejecutar tests: `npm test`
10. Ejecutar tests E2E: `npm run test:e2e`
