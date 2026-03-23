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

#### Entities
Objetos con identidad única y ciclo de vida propio:
- `User`: Aggregate root — usuario con roles y estado
- `Organization`: Organización con tipo y metadata
- `OrganizationMembership`: Relación usuario-organización con rol
- `AdminPermissionGrant`: Permiso administrativo asignado a un admin
- `OAuthConnection`: Conexión OAuth de un usuario con un proveedor externo

#### Value Objects
Objetos inmutables que representan conceptos del dominio:
- `UserId`: Identificador único (UUID)
- `Email`: Email validado y normalizado
- `PasswordHash`: Hash seguro de contraseña
- `AccessToken`: Token de acceso JWT (5 horas)
- `RefreshToken`: Token de refresco (3 días)
- `PasswordResetToken`: Token de reseteo de contraseña (30 min)
- `AdminPermission`: Permiso admin tipado (MANAGE_USERS, etc.)
- `OrganizationRole`: Rol dentro de una organización
- `OrganizationType`: Tipo de organización (HOSPITAL, CLINIC, etc.)
- `SystemRole`: Rol global del sistema (superadmin/admin/user)
- `OAuthProvider`: Proveedor OAuth soportado (GOOGLE, MICROSOFT)

#### Domain Events
Eventos que representan hechos importantes del dominio:
- `UserRegisteredEvent`
- `LoginSucceededEvent`
- `LoginFailedEvent`
- `SessionRefreshedEvent`
- `TokenReuseDetectedEvent`

#### Domain Errors
Errores específicos del dominio con códigos identificables:
- `user.errors.ts`: `UserNotFoundError`, `EmailAlreadyExistsError`, `AccountLockedError`
- `authentication.errors.ts`: `InvalidCredentialsError`, `TokenExpiredError`, `TokenReuseDetectedError`
- `authorization.errors.ts`: `UnauthorizedError`, `ForbiddenError`, `InsufficientPermissionsError`
- `organization.errors.ts`: `OrganizationNotFoundError`, `OrganizationAlreadyExistsError`
- `oauth.errors.ts`: `OAuthProviderError`, `OAuthAccountLinkError`

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
| Password Reset Token | 30 minutos | Reseteo de contraseña |

### Estrategia de Rotación de Refresh Tokens

```
1. Login → Se genera Refresh Token A
2. Refresh con A → Se genera B, A se marca como ROTATED
3. Si alguien usa A de nuevo → Se detecta REUSO
4. Se revoca toda la familia de tokens (A, B, ...)
```

Esta estrategia protege contra el robo de refresh tokens.

---

## OAuth2

Flujo de Authorization Code para Google y Microsoft:

```
1. Frontend solicita: GET /auth/oauth/initiate?provider=google
2. Backend genera state JWT (5 min) y devuelve redirect URL
3. Usuario se autentica en Google/Microsoft
4. Proveedor redirige a: GET /auth/oauth/callback?code=...&state=...
5. Backend valida state, intercambia code por tokens
6. Backend busca usuario por providerUserId → email → crea si no existe
7. Backend devuelve AccessToken + RefreshToken al frontend
```

**Estrategia de account linking**:
1. Buscar OAuthConnection por `providerUserId`
2. Si no existe, buscar `User` por email
3. Si no existe, crear nuevo usuario (sin contraseña, status=ACTIVE, emailVerifiedAt=now)

**Configuración**: `src/infrastructure/config/oauth.config.ts`
**Service**: `src/infrastructure/services/oauth-provider.service.ts`
**Use Cases**: `initiate-oauth.use-case.ts`, `handle-oauth-callback.use-case.ts`

---

## RBAC (Control de Acceso Basado en Roles)

### System Roles (3)
| Rol | Descripción |
|-----|-------------|
| `superadmin` | Acceso total al sistema |
| `admin` | Acceso según permisos asignados |
| `user` | Usuario estándar |

### Admin Permissions (4)
| Permiso | Descripción |
|---------|-------------|
| `MANAGE_USERS` | Crear, editar, eliminar usuarios |
| `MANAGE_ORGANIZATIONS` | Gestionar organizaciones |
| `MANAGE_MEMBERSHIPS` | Gestionar membresías en organizaciones |
| `VIEW_ANALYTICS` | Ver métricas y estadísticas |

### Organization Types (6)
`HOSPITAL`, `CLINIC`, `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_CENTER`, `OTHER`

### Organization Roles (6)
`OWNER`, `MANAGER`, `DOCTOR`, `NURSE`, `TECHNICIAN`, `VIEWER`

**Servicio**: `src/infrastructure/services/rbac-authorization.service.ts`
**Port**: `src/application/ports/authorization.service.port.ts`
**Middleware**: `src/interfaces/http/middlewares/authorization.middleware.ts`

---

## Email Transaccional

Integración con **Resend SDK** para envío de emails HTML.

### Templates disponibles
| Template | Archivo | Uso |
|----------|---------|-----|
| Verificación de email | `email-verification.template.ts` | Tras el registro |
| Reseteo de contraseña | `password-reset.template.ts` | Solicitud de reset |

### Comportamiento por entorno
- **Sin `RESEND_API_KEY`**: El servicio no se instancia, los emails se omiten sin error
- **Con `RESEND_API_KEY` (free trial)**: Solo entrega a la cuenta propietaria del API key
- **Con dominio verificado**: Entrega a cualquier destinatario

### Configuración
```env
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@yourdomain.com
APP_NAME=Health Care Suite   # Aparece en el asunto y cuerpo del email
```

**Service**: `src/infrastructure/services/resend-email.service.ts`
**Port**: `src/application/ports/email.service.port.ts`

---

## Rate Limiting

Protección in-memory contra abuso de endpoints críticos.

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `POST /auth/register` | 5 req | 15 min |
| `POST /auth/login` | 10 req | 15 min |
| `POST /auth/refresh` | 30 req | 15 min |

**Service**: `src/infrastructure/services/in-memory-rate-limiter.service.ts`
**Port**: `src/application/ports/rate-limiter.port.ts`
**Config**: `src/interfaces/http/config/rate-limits.config.ts`

---

## Capas Arquitectónicas

### Application Layer — Puertos (9)

| Puerto | Interfaz | Implementación |
|--------|----------|----------------|
| Token | `ITokenService` | `JwtTokenService` |
| Hashing | `IHashingService` | `BcryptHashingService` |
| UUID | `IUuidGenerator` | `CryptoUuidGeneratorService` |
| Logger | `ILogger` | `ConsoleLoggerService` |
| DateTime | `IDatetimeService` | `SystemDatetimeService` |
| RateLimiter | `IRateLimiterService` | `InMemoryRateLimiterService` |
| Authorization | `IAuthorizationService` | `RbacAuthorizationService` |
| OAuthProvider | `IOAuthProviderService` | `OAuthProviderService` |
| Email | `IEmailService` | `ResendEmailService` (opcional) |

### Application Layer — Use Cases (30)

| Módulo | Use Case | Descripción |
|--------|----------|-------------|
| auth | `RegisterUserUseCase` | Registro con email verification |
| auth | `LoginUserUseCase` | Login con JWT + refresh token |
| auth | `RefreshSessionUseCase` | Renovación de sesión |
| auth | `VerifyEmailUseCase` | Confirmación de email |
| auth | `RequestPasswordResetUseCase` | Solicitud de reset |
| auth | `ConfirmPasswordResetUseCase` | Confirmación de reset |
| auth | `InitiateOAuthUseCase` | Inicia flujo OAuth |
| auth | `HandleOAuthCallbackUseCase` | Procesa callback OAuth |
| admin | `PromoteToAdminUseCase` | Ascender usuario a admin |
| admin | `DemoteToUserUseCase` | Degradar admin a user |
| admin | `ListAdminsUseCase` | Listar todos los admins |
| admin | `GetAdminPermissionsUseCase` | Ver permisos de un admin |
| admin | `GrantAdminPermissionUseCase` | Otorgar permiso a admin |
| admin | `RevokeAdminPermissionUseCase` | Revocar permiso de admin |
| organization | `CreateOrganizationUseCase` | Crear organización |
| organization | `GetOrganizationUseCase` | Obtener organización |
| organization | `ListOrganizationsUseCase` | Listar organizaciones |
| organization | `UpdateOrganizationUseCase` | Actualizar organización |
| organization | `DeleteOrganizationUseCase` | Soft delete organización |
| organization | `HardDeleteOrganizationUseCase` | Hard delete organización |
| membership | `AssignUserToOrganizationUseCase` | Asignar usuario a org |
| membership | `ChangeUserOrganizationRoleUseCase` | Cambiar rol en org |
| membership | `GetOrganizationMembersUseCase` | Listar miembros de org |
| membership | `GetUserOrganizationsUseCase` | Orgs de un usuario |
| membership | `RemoveUserFromOrganizationUseCase` | Eliminar miembro |
| user | `ListUsersUseCase` | Listar usuarios (admin) |
| user | `UpdateUserStatusUseCase` | Cambiar estado de usuario (ACTIVE / SUSPENDED / DEACTIVATED) |
| user | `DeleteUserUseCase` | Soft delete usuario |
| user | `HardDeleteUserUseCase` | Hard delete usuario |
| user | `GetUserStatsUseCase` | Estadísticas de usuarios |

### Infrastructure Layer — Servicios (9)

| Servicio | Archivo |
|---------|---------|
| `JwtTokenService` | `services/jwt-token.service.ts` |
| `BcryptHashingService` | `services/bcrypt-hashing.service.ts` |
| `CryptoUuidGeneratorService` | `services/crypto-uuid-generator.service.ts` |
| `SystemDatetimeService` | `services/system-datetime.service.ts` |
| `InMemoryRateLimiterService` | `services/in-memory-rate-limiter.service.ts` |
| `RbacAuthorizationService` | `services/rbac-authorization.service.ts` |
| `OAuthProviderService` | `services/oauth-provider.service.ts` |
| `ResendEmailService` | `services/resend-email.service.ts` |
| `ConsoleLoggerService` | `logging/console-logger.service.ts` |

### Infrastructure Layer — Repositorios

**In-Memory** (desarrollo/testing):

| Repositorio | Archivo |
|------------|---------|
| `InMemoryUserRepository` | `in-memory/in-memory-user.repository.ts` |
| `InMemoryRefreshTokenRepository` | `in-memory/in-memory-refresh-token.repository.ts` |
| `InMemoryPasswordResetTokenRepository` | `in-memory/in-memory-password-reset-token.repository.ts` |
| `InMemoryAdminPermissionRepository` | `in-memory/in-memory-admin-permission.repository.ts` |
| `InMemoryOrganizationMembershipRepository` | `in-memory/in-memory-organization-membership.repository.ts` |
| `InMemoryOrganizationRepository` | `in-memory/in-memory-organization.repository.ts` |
| `InMemoryOAuthConnectionRepository` | `in-memory/in-memory-oauth-connection.repository.ts` |

**PostgreSQL** (producción):

| Repositorio | Archivo |
|------------|---------|
| `PostgresUserRepository` | `postgresql/postgres-user.repository.ts` |
| `PostgresRefreshTokenRepository` | `postgresql/postgres-refresh-token.repository.ts` |
| `PostgresPasswordResetTokenRepository` | `postgresql/postgres-password-reset-token.repository.ts` |
| `PostgresOrganizationRepository` | `postgresql/postgres-organization.repository.ts` |
| `PostgresOrganizationMembershipRepository` | `postgresql/postgres-organization-membership.repository.ts` |
| `PostgresOAuthConnectionRepository` | `postgresql/postgres-oauth-connection.repository.ts` |

### Interfaces Layer — Controllers (6)

| Controlador | Responsabilidad |
|------------|----------------|
| `AuthController` | Register, login, refresh, logout, verify-email, reset |
| `OAuthController` | Initiate OAuth, handle callback |
| `AdminController` | Gestión de admins y permisos |
| `OrganizationController` | CRUD de organizaciones |
| `OrganizationMembershipController` | Gestión de membresías |
| `HealthController` | Health check endpoint |

### Interfaces Layer — Middlewares (4)

| Middleware | Función |
|-----------|---------|
| `authMiddleware` | Verifica Access Token JWT |
| `authorizationMiddleware` | Verifica roles y permisos RBAC |
| `rateLimitMiddleware` | Rate limiting in-memory |
| `requestContextMiddleware` | Inyecta correlation ID |
| `errorHandlerMiddleware` | Manejo centralizado de errores |

---

## Árbol de Carpetas

```
backend/
├── docs/
│   ├── ARCHITECTURE.md
│   └── PROJECT.md
│
├── migrations/                    # Migraciones SQL (node-pg-migrate)
│
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── organization.entity.ts
│   │   │   ├── organization-membership.entity.ts
│   │   │   ├── admin-permission-grant.entity.ts
│   │   │   ├── oauth-connection.entity.ts
│   │   │   └── index.ts
│   │   ├── value-objects/
│   │   │   ├── user-id.value-object.ts
│   │   │   ├── email.value-object.ts
│   │   │   ├── password-hash.value-object.ts
│   │   │   ├── access-token.value-object.ts
│   │   │   ├── refresh-token.value-object.ts
│   │   │   ├── password-reset-token.value-object.ts
│   │   │   ├── admin-permission.value-object.ts
│   │   │   ├── organization-role.value-object.ts
│   │   │   ├── organization-type.value-object.ts
│   │   │   ├── system-role.value-object.ts
│   │   │   ├── oauth-provider.value-object.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.interface.ts
│   │   │   ├── refresh-token.repository.interface.ts
│   │   │   ├── password-reset-token.repository.interface.ts
│   │   │   ├── admin-permission.repository.interface.ts
│   │   │   ├── organization-membership.repository.interface.ts
│   │   │   ├── organization.repository.interface.ts
│   │   │   ├── oauth-connection.repository.interface.ts
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── domain.error.ts
│   │   │   ├── user.errors.ts
│   │   │   ├── authentication.errors.ts
│   │   │   ├── authorization.errors.ts
│   │   │   ├── organization.errors.ts
│   │   │   ├── oauth.errors.ts
│   │   │   └── index.ts
│   │   ├── events/
│   │   │   ├── domain-event.interface.ts
│   │   │   ├── user.events.ts
│   │   │   ├── authentication.events.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── auth/
│   │   │   │   ├── register-user.use-case.ts
│   │   │   │   ├── login-user.use-case.ts
│   │   │   │   ├── refresh-session.use-case.ts
│   │   │   │   ├── verify-email.use-case.ts
│   │   │   │   ├── request-password-reset.use-case.ts
│   │   │   │   ├── confirm-password-reset.use-case.ts
│   │   │   │   ├── initiate-oauth.use-case.ts
│   │   │   │   ├── handle-oauth-callback.use-case.ts
│   │   │   │   └── index.ts
│   │   │   ├── admin/
│   │   │   │   ├── promote-to-admin.use-case.ts
│   │   │   │   ├── demote-to-user.use-case.ts
│   │   │   │   ├── list-admins.use-case.ts
│   │   │   │   ├── get-admin-permissions.use-case.ts
│   │   │   │   ├── grant-admin-permission.use-case.ts
│   │   │   │   └── revoke-admin-permission.use-case.ts
│   │   │   ├── organization/
│   │   │   │   ├── create-organization.use-case.ts
│   │   │   │   ├── get-organization.use-case.ts
│   │   │   │   ├── list-organizations.use-case.ts
│   │   │   │   ├── update-organization.use-case.ts
│   │   │   │   ├── delete-organization.use-case.ts
│   │   │   │   └── hard-delete-organization.use-case.ts
│   │   │   ├── membership/
│   │   │   │   ├── assign-user-to-organization.use-case.ts
│   │   │   │   ├── change-user-organization-role.use-case.ts
│   │   │   │   ├── get-organization-members.use-case.ts
│   │   │   │   ├── get-user-organizations.use-case.ts
│   │   │   │   └── remove-user-from-organization.use-case.ts
│   │   │   ├── user/
│   │   │   │   ├── list-users.use-case.ts
│   │   │   │   ├── update-user-status.use-case.ts
│   │   │   │   ├── delete-user.use-case.ts
│   │   │   │   ├── hard-delete-user.use-case.ts
│   │   │   │   └── get-user-stats.use-case.ts
│   │   │   └── index.ts
│   │   ├── dtos/
│   │   │   ├── auth/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── refresh-session.dto.ts
│   │   │   │   ├── token-response.dto.ts
│   │   │   │   ├── verify-email.dto.ts
│   │   │   │   ├── password-reset.dto.ts
│   │   │   │   ├── oauth.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── admin/
│   │   │   │   └── admin.dto.ts
│   │   │   ├── organization/
│   │   │   │   └── organization.dto.ts
│   │   │   ├── membership/
│   │   │   │   └── membership.dto.ts
│   │   │   ├── user/
│   │   │   │   ├── user.dto.ts
│   │   │   │   ├── list-users.dto.ts
│   │   │   │   └── user-stats.dto.ts
│   │   │   └── index.ts
│   │   ├── ports/
│   │   │   ├── token.service.port.ts
│   │   │   ├── hashing.service.port.ts
│   │   │   ├── uuid-generator.port.ts
│   │   │   ├── logger.port.ts
│   │   │   ├── datetime.service.port.ts
│   │   │   ├── rate-limiter.port.ts
│   │   │   ├── authorization.service.port.ts
│   │   │   ├── oauth-provider.service.port.ts
│   │   │   ├── email.service.port.ts
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── application.error.ts
│   │   │   ├── validation.errors.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── infrastructure/
│   │   ├── config/
│   │   │   ├── environment.config.ts
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   ├── oauth.config.ts
│   │   │   └── index.ts
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── seed-super-admin.ts
│   │   │   └── index.ts
│   │   ├── persistence/
│   │   │   ├── in-memory/
│   │   │   │   ├── in-memory-user.repository.ts
│   │   │   │   ├── in-memory-refresh-token.repository.ts
│   │   │   │   ├── in-memory-password-reset-token.repository.ts
│   │   │   │   ├── in-memory-admin-permission.repository.ts
│   │   │   │   ├── in-memory-organization-membership.repository.ts
│   │   │   │   ├── in-memory-organization.repository.ts
│   │   │   │   ├── in-memory-oauth-connection.repository.ts
│   │   │   │   └── index.ts
│   │   │   ├── postgresql/
│   │   │   │   ├── postgres-user.repository.ts
│   │   │   │   ├── postgres-refresh-token.repository.ts
│   │   │   │   ├── postgres-password-reset-token.repository.ts
│   │   │   │   ├── postgres-organization.repository.ts
│   │   │   │   ├── postgres-organization-membership.repository.ts
│   │   │   │   ├── postgres-oauth-connection.repository.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── jwt-token.service.ts
│   │   │   ├── bcrypt-hashing.service.ts
│   │   │   ├── crypto-uuid-generator.service.ts
│   │   │   ├── system-datetime.service.ts
│   │   │   ├── in-memory-rate-limiter.service.ts
│   │   │   ├── rbac-authorization.service.ts
│   │   │   ├── oauth-provider.service.ts
│   │   │   ├── resend-email.service.ts
│   │   │   └── index.ts
│   │   ├── templates/
│   │   │   ├── email-verification.template.ts
│   │   │   └── password-reset.template.ts
│   │   ├── logging/
│   │   │   ├── console-logger.service.ts
│   │   │   └── index.ts
│   │   ├── container/
│   │   │   ├── container.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── interfaces/
│   │   └── http/
│   │       ├── app.factory.ts
│   │       ├── controllers/
│   │       │   ├── auth.controller.ts
│   │       │   ├── oauth.controller.ts
│   │       │   ├── admin.controller.ts
│   │       │   ├── organization.controller.ts
│   │       │   ├── organization-membership.controller.ts
│   │       │   ├── health.controller.ts
│   │       │   └── index.ts
│   │       ├── routes/
│   │       │   ├── auth.routes.ts
│   │       │   ├── health.routes.ts
│   │       │   ├── rbac.routes.ts
│   │       │   └── index.ts
│   │       ├── middlewares/
│   │       │   ├── auth.middleware.ts
│   │       │   ├── authorization.middleware.ts
│   │       │   ├── rate-limit.middleware.ts
│   │       │   ├── request-context.middleware.ts
│   │       │   ├── error-handler.middleware.ts
│   │       │   └── index.ts
│   │       ├── adapters/
│   │       │   ├── express.adapter.ts
│   │       │   ├── route-adapter.ts
│   │       │   ├── auth-middleware.adapter.ts
│   │       │   ├── rate-limit-middleware.adapter.ts
│   │       │   ├── error-handler.adapter.ts
│   │       │   ├── validation.adapter.ts
│   │       │   └── index.ts
│   │       ├── validators/
│   │       │   ├── auth.validators.ts
│   │       │   ├── admin.validators.ts
│   │       │   ├── membership.validators.ts
│   │       │   ├── organization.validators.ts
│   │       │   ├── oauth.validators.ts
│   │       │   └── index.ts
│   │       ├── config/
│   │       │   └── rate-limits.config.ts
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
│   │   │   └── value-objects/
│   │   └── application/
│   │       └── use-cases/
│   ├── integration/
│   │   └── repositories/
│   └── e2e/
│       └── auth/
│
├── .env.example
├── .gitignore
├── docker-compose.yaml
├── Dockerfile.dev
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

| Categoría | Tecnología | Propósito |
|-----------|------------|-----------|
| Runtime | Node.js | Servidor |
| Lenguaje | TypeScript | Tipado estático |
| Framework HTTP | Express 5 | Servidor web |
| Auth | JWT (jsonwebtoken) | Tokens de acceso y refresco |
| Hashing | bcryptjs | Hash de contraseñas |
| Base de Datos | PostgreSQL 16 | Persistencia |
| DB Driver | pg | Cliente PostgreSQL |
| Migrations | node-pg-migrate | Migraciones SQL |
| Email | Resend | Emails transaccionales |
| HTTP Client | axios | Llamadas OAuth externas |
| CORS | cors | Cross-Origin Resource Sharing |
| Config | dotenv | Variables de entorno |
| Tests Unit | Vitest | Testing unitario e integración |
| Tests E2E | Playwright | Pruebas end-to-end |
| Dev | tsx | Hot reload desarrollo |

---

## Scripts npm

```bash
npm run dev          # Servidor con hot reload (tsx watch)
npm run build        # Compilación TypeScript
npm start            # Servidor producción
npm run typecheck    # Verificar tipos sin emitir
npm run lint         # ESLint

npm test             # Tests en watch mode
npm run test:unit    # Tests unitarios
npm run test:integration  # Tests de integración
npm run test:e2e     # Tests E2E (Playwright)
npm run test:coverage # Tests con cobertura

npm run migrate      # Aplicar migraciones pendientes
npm run migrate:down # Revertir última migración
npm run migrate:create <name>  # Crear nueva migración
```
