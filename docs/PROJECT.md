# Big School Backend — Documentación completa del proyecto

## Índice

1. [Visión general](#1-visión-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Domain Layer](#4-domain-layer)
5. [Application Layer](#5-application-layer)
6. [Infrastructure Layer](#6-infrastructure-layer)
7. [Interfaces Layer](#7-interfaces-layer)
8. [Base de datos](#8-base-de-datos)
9. [Autenticación y seguridad](#9-autenticación-y-seguridad)
10. [OAuth2](#10-oauth2)
11. [RBAC y organizaciones](#11-rbac-y-organizaciones)
12. [Email transaccional](#12-email-transaccional)
13. [Docker](#13-docker)
14. [Variables de entorno](#14-variables-de-entorno)
15. [Scripts npm](#15-scripts-npm)
16. [Testing](#16-testing)
17. [Documentación de features](#17-documentación-de-features)
18. [Producción](#18-producción)

---

## 1. Visión general

**Big School Backend** es un sistema de autenticación y autorización de nivel empresarial construido con **TypeScript**, **Express.js** y **PostgreSQL**. Implementa Clean Architecture, Hexagonal Architecture (Ports & Adapters) y Domain-Driven Design (DDD).

El proyecto sirve de backend para una aplicación de gestión sanitaria (**Health Care Suite**), proporcionando:

- Registro y autenticación de usuarios (email/password y OAuth2)
- Verificación de email y recuperación de contraseña
- Control de acceso basado en roles (RBAC) con tres niveles
- Gestión de organizaciones sanitarias y membresías
- Email transaccional con Resend
- Rate limiting y bloqueo progresivo de cuentas

**Entorno de ejecución:** Node.js 20+ con TypeScript compilado mediante `tsx` (hot reload en desarrollo).

---

## 2. Stack tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime | Node.js | 20+ |
| Lenguaje | TypeScript | 5.3 |
| HTTP Framework | Express.js | 5.2.1 |
| Base de datos | PostgreSQL | 16 (Alpine) |
| ORM/Driver | node-postgres (pg) | 8.18.0 |
| Autenticación | jsonwebtoken | 9.0.3 |
| Hashing | bcryptjs | 3.0.3 |
| Email | Resend SDK | 6.9.4 |
| HTTP Client | axios | 1.6.0 |
| Config | dotenv | 16.6.1 |
| Testing | Vitest | 1.x |
| E2E Testing | Playwright | 1.x |
| Linting | ESLint | 8.x |

---

## 3. Arquitectura

El proyecto implementa **Clean Architecture de 4 capas** con la regla de dependencia apuntando hacia adentro:

```
Interfaces → Application → Domain
     ↓            ↓
Infrastructure ───┘
```

### Capas

| Capa | Ruta | Contenido |
|------|------|-----------|
| **Domain** | `src/domain/` | Entities, Value Objects, Repository interfaces, Domain Errors, Domain Events |
| **Application** | `src/application/` | Use Cases, DTOs, Ports (interfaces de servicios) |
| **Infrastructure** | `src/infrastructure/` | Implementaciones de repos, adapters de servicios, Config, DB |
| **Interfaces** | `src/interfaces/` | Controllers HTTP, Routes, Middlewares, Validators |

### Path aliases (tsconfig.json)

```
@domain/*         → src/domain/*
@application/*    → src/application/*
@infrastructure/* → src/infrastructure/*
@interfaces/*     → src/interfaces/*
@shared/*         → src/shared/*
```

### Patrones arquitectónicos

- **Hexagonal (Ports & Adapters):** El dominio define puertos (interfaces), la infraestructura implementa adaptadores. Permite intercambiar JWT por PASETO, PostgreSQL por MongoDB, etc. modificando un único archivo.
- **Repository Pattern:** Los repositorios son interfaces en el dominio. Existen dos implementaciones por repositorio: en memoria (tests) y PostgreSQL (producción).
- **Dependency Injection:** Un único contenedor (`container.ts`) instancia y conecta todas las dependencias. Los use cases reciben sus dependencias inyectadas, no las instancian.
- **Value Objects:** Encapsulan validación y son inmutables. Fuerzan datos correctos mediante factory methods.
- **Domain Events:** Preparado para CQRS. Los eventos se generan en las entidades y pueden ser consumidos por listeners externos.

---

## 4. Domain Layer

**Ubicación:** `src/domain/`

### 4.1 Entidades

#### User (Aggregate Root)

`src/domain/entities/user.entity.ts`

La entidad principal del sistema. Actúa como Aggregate Root del contexto de autenticación.

**Propiedades:**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | `UserId` | UUID único |
| `email` | `Email` | Email validado |
| `passwordHash` | `PasswordHash \| null` | Hash de contraseña (null para usuarios OAuth) |
| `firstName` | `string` | Nombre |
| `lastName` | `string` | Apellido |
| `status` | `UserStatus` | PENDING_VERIFICATION \| ACTIVE \| SUSPENDED \| DEACTIVATED |
| `systemRole` | `SystemRole` | SUPER_ADMIN \| ADMIN \| USER |
| `createdAt` | `Date` | Fecha de creación |
| `updatedAt` | `Date` | Fecha de última actualización |
| `lastLoginAt` | `Date \| null` | Último login |
| `emailVerifiedAt` | `Date \| null` | Fecha de verificación de email |
| `failedLoginAttempts` | `number` | Intentos fallidos acumulados |
| `lockoutUntil` | `Date \| null` | Bloqueo hasta esta fecha |
| `lockoutCount` | `number` | Número de bloqueos progresivos |
| `lastFailedLoginAt` | `Date \| null` | Último intento fallido |

**Factory Methods:**

```typescript
User.create(data)          // Registro normal → status: PENDING_VERIFICATION
User.createOAuth(data)     // Registro OAuth → status: ACTIVE (email pre-verificado)
User.fromPersistence(props) // Reconstruir desde base de datos
```

**Métodos de negocio:**

```typescript
// Estado
canLogin(): boolean
isEmailVerified(): boolean
isActive(): boolean
isSuperAdmin(): boolean
isAdmin(): boolean
isUser(): boolean

// Cambios de estado
verifyEmail(verifiedAt: Date): void
recordLogin(loginAt: Date): void
updatePassword(newPasswordHash, updatedAt): void
suspend(suspendedAt: Date): void
deactivate(deactivatedAt: Date): void
reactivate(reactivatedAt: Date): void
changeSystemRole(newRole, updatedAt): void

// Account Lockout (bloqueo progresivo)
isLockedOut(now: Date): boolean
getRemainingLockoutSeconds(now: Date): number
canAttemptLogin(now: Date): boolean
recordFailedLogin(now: Date): void      // Incrementa intentos y bloquea si supera umbral
recordSuccessfulLogin(now: Date): void  // Resetea contadores

// Domain Events
get domainEvents(): DomainEvent[]
addDomainEvent(event: DomainEvent): void
clearDomainEvents(): void
```

**Configuración de bloqueo:**

```
MAX_FAILED_ATTEMPTS = 5 intentos
BASE_LOCKOUT_DURATION_MS = 15 minutos
MAX_LOCKOUT_DURATION_MS = 1 hora
Bloqueo progresivo: 15min → 30min → 1h (capped)
```

#### Organization

`src/domain/entities/organization.entity.ts`

Organización sanitaria. Puede ser HOSPITAL, CLINIC, LABORATORY, PHARMACY, INSURANCE, GOVERNMENT o OTHER.

#### OrganizationMembership

`src/domain/entities/organization-membership.entity.ts`

Membresía de un usuario en una organización, con un rol específico dentro de ella.

#### AdminPermissionGrant

`src/domain/entities/admin-permission-grant.entity.ts`

Registro de un permiso específico concedido a un usuario con rol ADMIN.

#### OAuthConnection

`src/domain/entities/oauth-connection.entity.ts`

Conexión OAuth de un usuario con un proveedor externo (Google, Microsoft).

---

### 4.2 Value Objects

Todos los value objects son inmutables y se validan en su creación mediante factory methods. Lanzan `DomainError` si los datos son inválidos.

| Value Object | Archivo | Valida | Factory |
|---|---|---|---|
| **UserId** | `user-id.value-object.ts` | Formato UUID v4 | `UserId.create(value)` |
| **Email** | `email.value-object.ts` | Formato email, máx 254 chars | `Email.create(value)` |
| **PasswordHash** | `password-hash.value-object.ts` | Hash bcrypt (mín 50 chars) | `fromHash()`, `fromNewlyHashed()` |
| **AccessToken** | `access-token.value-object.ts` | JWT access token | Generado por `ITokenService` |
| **RefreshToken** | `refresh-token.value-object.ts` | JWT refresh token | Generado por `ITokenService` |
| **SystemRole** | `system-role.value-object.ts` | SUPER_ADMIN \| ADMIN \| USER | `SystemRole.create(value)` |
| **OrganizationType** | `organization-type.value-object.ts` | Tipos válidos de org | `OrganizationType.create(value)` |
| **OrganizationRole** | `organization-role.value-object.ts` | Roles válidos dentro de org | `OrganizationRole.create(value)` |
| **AdminPermission** | `admin-permission.value-object.ts` | Permisos válidos de admin | `AdminPermission.create(value)` |
| **OAuthProvider** | `oauth-provider.value-object.ts` | google \| microsoft | `OAuthProvider.create(value)` |

---

### 4.3 Domain Errors

Todos los errores de dominio heredan de `DomainError` (abstracto) que incluye: `code`, `isDomainError: true`, `timestamp`, `context`.

**Errores de autenticación** (`authentication.errors.ts`):

| Error | Descripción |
|-------|-------------|
| `InvalidCredentialsError` | Email o contraseña incorrectos |
| `AccessTokenExpiredError` | Access token caducado |
| `InvalidAccessTokenError` | Access token inválido |
| `RefreshTokenExpiredError` | Refresh token caducado |
| `InvalidRefreshTokenError` | Refresh token inválido |
| `RefreshTokenRevokedError` | Refresh token revocado |
| `RefreshTokenReuseDetectedError` | Reutilización detectada (brecha de seguridad) |
| `SessionNotFoundError` | Sesión no encontrada |
| `UnauthenticatedError` | Usuario no autenticado |
| `UnauthorizedError` | Sin permisos |
| `WeakPasswordError` | Contraseña insegura |
| `InvalidVerificationTokenError` | Token de verificación inválido |
| `VerificationTokenExpiredError` | Token de verificación caducado |
| `EmailAlreadyVerifiedError` | Email ya verificado |
| `InvalidPasswordResetTokenError` | Token de reset inválido |
| `PasswordResetTokenExpiredError` | Token de reset caducado |
| `PasswordResetTokenAlreadyUsedError` | Token de reset ya usado |
| `AccountLockedError` | Cuenta bloqueada (incluye `remainingSeconds`) |
| `TooManyRequestsError` | Rate limit superado |

**Errores de usuario** (`user.errors.ts`):

| Error | Descripción |
|-------|-------------|
| `UserNotFoundError` | Usuario no encontrado |
| `UserAlreadyExistsError` | Email ya registrado |
| `InvalidEmailError` | Email inválido |
| `InvalidUserIdError` | ID inválido |
| `UserNotActiveError` | Usuario inactivo |
| `EmailNotVerifiedError` | Email no verificado |
| `UserSuspendedError` | Usuario suspendido |
| `InvalidPasswordHashError` | Hash de contraseña inválido |

**Otros errores:**

- `authorization.errors.ts`: `InvalidSystemRoleError`, `InvalidOrganizationRoleError`, `InvalidAdminPermissionError`
- `organization.errors.ts`: `OrganizationNotFoundError`, `OrganizationAlreadyExistsError`, `InvalidOrganizationTypeError`
- `oauth.errors.ts`: `InvalidOAuthProviderError`, `OAuthConnectionNotFoundError`, `OAuthProviderConfigError`, `OAuthCallbackError`

---

### 4.4 Repository Interfaces

Las interfaces de repositorio definen el contrato de persistencia. Son puertos del dominio implementados en la capa de infraestructura.

| Interface | Archivo | Operaciones principales |
|---|---|---|
| **UserRepository** | `user.repository.interface.ts` | `save`, `update`, `delete`, `hardDelete`, `findById`, `findByEmail`, `existsByEmail`, `findAll` (paginado), `findBySystemRole`, `getStats` |
| **RefreshTokenRepository** | `refresh-token.repository.interface.ts` | `save`, `findByTokenId`, `markAsRotated`, `markFamilyAsRevoked` |
| **PasswordResetTokenRepository** | `password-reset-token.repository.interface.ts` | `save`, `findByTokenId`, `markAsUsed` |
| **OrganizationRepository** | `organization.repository.interface.ts` | CRUD completo + paginación |
| **OrganizationMembershipRepository** | `organization-membership.repository.interface.ts` | `assign`, `remove`, `findByOrg`, `findByUser`, `changeRole` |
| **AdminPermissionRepository** | `admin-permission.repository.interface.ts` | `grant`, `revoke`, `findByUser`, `findAll` |
| **OAuthConnectionRepository** | `oauth-connection.repository.interface.ts` | `save`, `findByProvider`, `findByUserId` |

---

### 4.5 Domain Events

Interface base `DomainEvent`: `eventName`, `occurredOn`, `aggregateId`.

Eventos implementados:

- `UserRegisteredEvent`
- `LoginSucceededEvent`
- `LoginFailedEvent`
- `SessionRefreshedEvent`
- `TokenReuseDetectedEvent`

---

## 5. Application Layer

**Ubicación:** `src/application/`

### 5.1 Ports (Interfaces de servicios)

Los puertos definen qué necesita la capa de aplicación sin importar cómo está implementado.

| Puerto | Archivo | Responsabilidad |
|--------|---------|----------------|
| **ITokenService** | `token.service.port.ts` | Generar y validar JWT (access, refresh, reset) |
| **IHashingService** | `hashing.service.port.ts` | Hashear contraseñas (bcrypt), verificar hashes |
| **IDateTimeService** | `datetime.service.port.ts` | Obtener hora actual, añadir segundos, formatear fechas |
| **IUuidGenerator** | `uuid-generator.port.ts` | Generar UUIDs v4 |
| **ILogger** | `logger.port.ts` | Logging estructurado (debug, info, warn, error, child) |
| **IRateLimiter** | `rate-limiter.port.ts` | Rate limiting por clave (IP) |
| **IAuthorizationService** | `authorization.service.port.ts` | Verificar permisos RBAC |
| **IEmailService** | `email.service.port.ts` | Enviar emails transaccionales |
| **IOAuthProviderService** | `oauth-provider.service.port.ts` | Integración con proveedores OAuth2 |

---

### 5.2 Use Cases (30 total)

#### Autenticación (8)

| Use Case | Archivo | Descripción |
|----------|---------|-------------|
| **RegisterUserUseCase** | `register-user.use-case.ts` | Registro con email/password. Genera token de verificación. En producción envía email. |
| **LoginUserUseCase** | `login-user.use-case.ts` | Login con email/password. Verifica lockout, genera access + refresh tokens. |
| **RefreshSessionUseCase** | `refresh-session.use-case.ts` | Rota el refresh token. Detecta reutilización (revoca familia entera). |
| **VerifyEmailUseCase** | `verify-email.use-case.ts` | Valida el token JWT de verificación y activa la cuenta. |
| **RequestPasswordResetUseCase** | `request-password-reset.use-case.ts` | Genera token de reset. En producción envía email. Respuesta genérica (no revela si el email existe). |
| **ConfirmPasswordResetUseCase** | `confirm-password-reset.use-case.ts` | Valida token, actualiza contraseña y revoca todas las sesiones activas. |
| **InitiateOAuthUseCase** | `initiate-oauth.use-case.ts` | Genera URL de autorización + state JWT (5 min). |
| **HandleOAuthCallbackUseCase** | `handle-oauth-callback.use-case.ts` | Intercambia code por tokens. Crea o vincula cuenta. |

#### Gestión de usuarios (5)

| Use Case | Descripción |
|----------|-------------|
| **ListUsersUseCase** | Lista todos los usuarios con paginación y filtros por rol/estado |
| **GetUserStatsUseCase** | Estadísticas de usuarios: total, por rol, por estado, verificados |
| **UpdateUserStatusUseCase** | Cambia el estado de un usuario (ACTIVE / SUSPENDED / DEACTIVATED) |
| **DeleteUserUseCase** | Soft-delete (status → DEACTIVATED) |
| **HardDeleteUserUseCase** | Eliminación permanente de la base de datos |

#### Gestión de admins (6)

| Use Case | Descripción |
|----------|-------------|
| **PromoteToAdminUseCase** | Promueve USER a ADMIN |
| **DemoteToUserUseCase** | Degrada ADMIN a USER |
| **GrantAdminPermissionUseCase** | Concede un permiso específico a un ADMIN |
| **RevokeAdminPermissionUseCase** | Revoca un permiso de un ADMIN |
| **GetAdminPermissionsUseCase** | Lista los permisos de un ADMIN concreto |
| **ListAdminsUseCase** | Lista todos los usuarios con rol ADMIN |

#### Gestión de organizaciones (6)

| Use Case | Descripción |
|----------|-------------|
| **CreateOrganizationUseCase** | Crea una organización sanitaria |
| **GetOrganizationUseCase** | Obtiene detalles de una organización |
| **ListOrganizationsUseCase** | Lista organizaciones con paginación |
| **UpdateOrganizationUseCase** | Actualiza datos de una organización |
| **DeleteOrganizationUseCase** | Soft-delete (marca como inactiva) |
| **HardDeleteOrganizationUseCase** | Eliminación permanente |

#### Gestión de membresías (5)

| Use Case | Descripción |
|----------|-------------|
| **AssignUserToOrganizationUseCase** | Añade un usuario a una organización con un rol |
| **RemoveUserFromOrganizationUseCase** | Elimina un usuario de una organización |
| **ChangeUserOrganizationRoleUseCase** | Cambia el rol de un usuario en una organización |
| **GetOrganizationMembersUseCase** | Lista los miembros de una organización |
| **GetUserOrganizationsUseCase** | Lista las organizaciones de un usuario (incluye `isActive` por organización) |

---

### 5.3 DTOs

**Auth DTOs:**
- `RegisterUserRequestDto` / `RegisterUserResponseDto`
- `LoginUserRequestDto` / `LoginUserResponseDto`
- `RefreshSessionRequestDto` / `RefreshSessionResponseDto`
- `VerifyEmailRequestDto` / `VerifyEmailResponseDto`
- `RequestPasswordResetRequestDto` / `RequestPasswordResetResponseDto`
- `ConfirmPasswordResetRequestDto` / `ConfirmPasswordResetResponseDto`
- `OAuthInitiateRequestDto` / `OAuthInitiateResponseDto`
- `OAuthCallbackRequestDto` / `OAuthCallbackResponseDto`
- `TokenResponseDto`: `{ accessToken, refreshToken, expiresIn }`

**User DTOs:**
- `UserDto`: id, email, firstName, lastName, fullName, systemRole, status, emailVerified, createdAt, lastLoginAt
- `ListUsersRequestDto` / `ListUsersResponseDto` (paginado)
- `UserStatsDto`: total, byRole, byStatus, emailVerified

**Organization DTOs:**
- `OrganizationDto`, `CreateOrganizationDto`, `UpdateOrganizationDto`
- `ListOrganizationsDto` (paginado)

**Membership DTOs:**
- `MembershipResponseDto` (incluye `systemRole` del usuario para gate de controles)
- `AssignMemberDto`, `ChangeMemberRoleDto`
- `UserOrganizationDTO`: organización + rol del usuario + `isActive: boolean` (devuelto por `GetUserOrganizationsUseCase`)

**Admin DTOs:**
- `AdminDto`, `AdminPermissionDto`, `PromoteAdminDto`

---

## 6. Infrastructure Layer

**Ubicación:** `src/infrastructure/`

### 6.1 Servicios (Adaptadores)

| Servicio | Implementa | Descripción |
|----------|-----------|-------------|
| **JwtTokenService** | `ITokenService` | Genera/valida JWTs con `jsonwebtoken`. Configurable por secretos y duraciones. |
| **BcryptHashingService** | `IHashingService` | Hash y verificación con bcrypt. Salt rounds: 12 (configurable). |
| **SystemDateTimeService** | `IDateTimeService` | `Date.now()` y operaciones de tiempo. |
| **CryptoUuidGenerator** | `IUuidGenerator` | `crypto.randomUUID()` nativo de Node. |
| **ConsoleLogger** | `ILogger` | Logging estructurado JSON con módulo y correlationId. Soporta `.child()`. |
| **InMemoryRateLimiter** | `IRateLimiter` | Map en memoria con ventana deslizante. Se resetea al reiniciar. |
| **RBACAuthorizationService** | `IAuthorizationService` | Combina system roles + permisos de admin para autorizar operaciones. |
| **OAuthProviderService** | `IOAuthProviderService` | Integra Google y Microsoft via Authorization Code Flow. |
| **ResendEmailService** | `IEmailService` | Envía emails con el SDK de Resend v4. Verifica `{ error }` en la respuesta. |

---

### 6.2 Repositorios

Cada repositorio tiene dos implementaciones: en memoria (tests sin BD) y PostgreSQL (producción).

#### In-Memory (Testing)

| Repositorio | Descripción |
|------------|-------------|
| `InMemoryUserRepository` | Map en memoria con búsqueda por email y paginación |
| `InMemoryRefreshTokenRepository` | Gestiona tokens y familias en memoria |
| `InMemoryPasswordResetTokenRepository` | Tokens de reset en memoria |
| `InMemoryOrganizationRepository` | Organizaciones en memoria |
| `InMemoryOrganizationMembershipRepository` | Membresías en memoria |
| `InMemoryAdminPermissionRepository` | Permisos en memoria |
| `InMemoryOAuthConnectionRepository` | Conexiones OAuth en memoria |

#### PostgreSQL (Producción)

| Repositorio | Descripción |
|------------|-------------|
| `PostgresUserRepository` | Pool de conexiones pg, queries SQL raw |
| `PostgresRefreshTokenRepository` | Gestiona token rotation en tabla `refresh_tokens` |
| `PostgresPasswordResetTokenRepository` | Tabla `password_reset_tokens` |
| `PostgresOrganizationRepository` | Tabla `organizations` con soft-delete |
| `PostgresOrganizationMembershipRepository` | Tabla `organization_memberships` |
| `PostgresAdminPermissionRepository` | Tabla `admin_permissions` |
| `PostgresOAuthConnectionRepository` | Tabla `oauth_connections` |

---

### 6.3 DI Container

**`src/infrastructure/container/container.ts`**

Composition root del sistema. La función `createContainer()` instancia y conecta **todo** el grafo de dependencias:

```
1. Lee configuración (env, JWT, OAuth)
2. Instancia servicios (Logger, DateTime, UUID, Hashing, Token, RateLimiter, Email, OAuth)
3. Elige repositorios (USE_POSTGRES=true → PostgreSQL, false → InMemory)
4. Instancia los 30 use cases con dependencias inyectadas
5. Instancia los 6 controllers
6. Instancia middlewares
7. Retorna el contenedor completo
```

**Selección de email service:**
```typescript
const emailService = process.env.RESEND_API_KEY
  ? new ResendEmailService(apiKey, emailFrom, appName)
  : undefined; // dev mode: token en respuesta HTTP
```

**Selección de repositorios:**
```typescript
const usePostgres = process.env.USE_POSTGRES === 'true';
userRepository = usePostgres
  ? new PostgresUserRepository(pool)
  : new InMemoryUserRepository();

// Todos los repositorios siguen el mismo patrón, incluyendo adminPermissionRepository:
adminPermissionRepository = usePostgres
  ? new PostgresAdminPermissionRepository(pool)
  : new InMemoryAdminPermissionRepository();
```

---

### 6.4 Email Templates

**`src/infrastructure/templates/`**

| Template | Función | Descripción |
|----------|---------|-------------|
| `email-verification.template.ts` | `buildVerificationEmailHtml(options, appName)` | Email de verificación de cuenta. Header azul `#2563eb`, icono cruz médica, botón "Verificar mi cuenta". Válido 5 horas. |
| `password-reset.template.ts` | `buildPasswordResetEmailHtml(options, appName)` | Email de recuperación de contraseña. Mismo branding, botón rojo "Restablecer contraseña". Válido 30 minutos. |

Los templates son HTML inline (sin dependencias externas), compatible con todos los clientes de email.

---

### 6.5 Config Files

| Archivo | Variables | Descripción |
|---------|----------|-------------|
| `environment.config.ts` | `NODE_ENV`, `PORT`, `HOST`, `CORS_ORIGIN` | Config de servidor y entorno |
| `jwt.config.ts` | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_PASSWORD_RESET_SECRET` | Secretos y duraciones de tokens |
| `database.config.ts` | `DATABASE_HOST/PORT/NAME/USER/PASSWORD`, `DATABASE_URL` | Conexión PostgreSQL |
| `oauth.config.ts` | `GOOGLE_*`, `MICROSOFT_*` | Credenciales OAuth2 |

---

## 7. Interfaces Layer

**Ubicación:** `src/interfaces/http/`

### 7.1 App Factory

**`app.factory.ts`** — Crea y configura la aplicación Express:

```
1. CORS (origin: '*', credentials: true)
2. JSON parsing (express.json())
3. Request context (correlationId, startTime)
4. Rate limiting global
5. Auth middleware (extrae JWT)
6. Registro de rutas
7. Error handler (siempre último)
```

---

### 7.2 Rutas HTTP

#### Auth (`/auth`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/register` | Registrar nuevo usuario | No |
| `POST` | `/auth/login` | Login con email/password | No |
| `POST` | `/auth/refresh` | Rotar refresh token | No |
| `POST` | `/auth/verify-email` | Verificar email con token | No |
| `POST` | `/auth/logout` | Cerrar sesión | Sí |
| `POST` | `/auth/password-reset` | Solicitar reset de contraseña | No |
| `POST` | `/auth/password-reset/confirm` | Confirmar nuevo password | No |
| `POST` | `/auth/oauth/initiate` | Iniciar OAuth (devuelve authorizationUrl) | No |
| `POST` | `/auth/oauth/callback` | Callback OAuth (code exchange) | No |

#### Admin (`/admin`)

| Método | Ruta | Requiere | Descripción |
|--------|------|----------|-------------|
| `GET` | `/admin/users` | SUPER_ADMIN | Listar todos los usuarios |
| `GET` | `/admin/users/stats` | SUPER_ADMIN | Estadísticas de usuarios |
| `PATCH` | `/admin/users/:id/status` | ADMIN + `manage_users` | Cambiar estado de usuario (ACTIVE / SUSPENDED / DEACTIVATED) |
| `DELETE` | `/admin/users/:id` | SUPER_ADMIN | Soft-delete usuario |
| `DELETE` | `/admin/users/:id/hard` | SUPER_ADMIN | Hard-delete usuario |
| `POST` | `/admin/users/:id/promote` | SUPER_ADMIN | Promover a ADMIN |
| `POST` | `/admin/users/:id/demote` | SUPER_ADMIN | Degradar a USER |
| `GET` | `/admin/admins` | SUPER_ADMIN | Listar admins |
| `GET` | `/admin/users/:id/permissions` | SUPER_ADMIN | Ver permisos de un admin |
| `POST` | `/admin/users/:id/permissions` | SUPER_ADMIN | Conceder permiso |
| `DELETE` | `/admin/users/:id/permissions/:perm` | SUPER_ADMIN | Revocar permiso |
| `GET` | `/admin/my-permissions` | ADMIN (JWT) | Ver mis propios permisos |

#### Organizations (`/organizations`)

| Método | Ruta | Requiere | Descripción |
|--------|------|----------|-------------|
| `POST` | `/organizations` | ADMIN + `manage_organizations` | Crear organización |
| `GET` | `/organizations` | ADMIN | Listar organizaciones |
| `GET` | `/organizations/:id` | ADMIN | Ver organización |
| `PUT` | `/organizations/:id` | ADMIN + `manage_organizations` | Actualizar organización |
| `DELETE` | `/organizations/:id` | ADMIN + `manage_organizations` | Soft-delete |
| `DELETE` | `/organizations/:id/permanent` | SUPER_ADMIN | Hard-delete |

#### Memberships (`/organizations/:id/members`)

| Método | Ruta | Requiere | Descripción |
|--------|------|----------|-------------|
| `POST` | `/organizations/:id/members` | ADMIN + `assign_members` | Añadir miembro |
| `GET` | `/organizations/:id/members` | ADMIN | Listar miembros |
| `PUT` | `/organizations/:id/members/:userId/role` | ADMIN + `assign_members` | Cambiar rol |
| `DELETE` | `/organizations/:id/members/:userId` | ADMIN + `assign_members` | Eliminar miembro |
| `GET` | `/users/:userId/organizations` | Auth | Organizaciones del usuario |

#### Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Liveness check. Devuelve `{ status: "ok", version }` |

---

### 7.3 Middlewares

| Middleware | Descripción |
|-----------|-------------|
| **AuthMiddleware** | Extrae y valida el JWT del header `Authorization: Bearer <token>`. Añade `req.user` al request. |
| **ErrorHandlerMiddleware** | Catch-all de errores. Convierte `DomainError` → HTTP response con código apropiado. Maneja errores inesperados con 500. |
| **RequestContextMiddleware** | Añade `correlationId` (UUID) y `startTime` al request para logging y trazabilidad. |
| **RateLimitMiddleware** | Limita peticiones por IP. Auth routes: 5 req/min. Global: 100 req/15min. |
| **AuthorizationMiddleware** | Verifica system roles y permisos de admin via `IAuthorizationService`. Lanza `UnauthorizedError` si no autorizado. |

---

### 7.4 Validators

`src/interfaces/http/validators/auth.validators.ts`:
- `validateRegisterRequest` — email formato, contraseña fuerte
- `validateLoginRequest` — email y password requeridos
- `validateRefreshRequest` — refresh token requerido
- `validateVerifyEmailRequest` — token formato
- `validateRequestPasswordResetRequest` — email formato
- `validateConfirmPasswordResetRequest` — token + nueva contraseña

---

### 7.5 Express Adapters

`src/interfaces/http/adapters/`:
- `adaptRoute` — Envuelve un use case en un Express handler
- `createExpressErrorHandler` — Middleware de error Express
- `createValidationMiddleware` — Middleware de validación Express
- `createExpressAuthMiddleware` — Middleware de autenticación Express
- `createExpressRateLimitMiddleware` — Middleware de rate limit Express

---

## 8. Base de datos

### PostgreSQL 16

**Conexión:** `src/infrastructure/database/connection.ts`
- Pool de conexiones con `node-postgres`
- Configurable via `DATABASE_URL` o variables individuales
- SSL configurable (`DATABASE_SSL`)

**Migraciones:** `migrations/`
- Archivos SQL numerados secuencialmente
- Ejecutar con `npm run migrate`
- Tablas: `users`, `refresh_tokens`, `password_reset_tokens`, `organizations`, `organization_memberships`, `admin_permissions`, `oauth_connections`

**Seed de Super Admin:** `src/infrastructure/database/seed-super-admin.ts`
- Se ejecuta al arrancar la aplicación (si no está en modo test)
- Crea el usuario SUPER_ADMIN inicial si no existe
- Variables: `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_FIRST_NAME`, `SUPER_ADMIN_LAST_NAME`

---

## 9. Autenticación y seguridad

### JWT Tokens

| Token | Duración | Secret | Payload |
|-------|---------|--------|---------|
| **Access Token** | 5 horas (18000s) | `JWT_ACCESS_SECRET` | userId, email, systemRole, permissions |
| **Refresh Token** | 3 días (259200s) | `JWT_REFRESH_SECRET` | userId, tokenId, parentTokenId |
| **Password Reset** | 30 minutos (1800s) | `JWT_PASSWORD_RESET_SECRET` | userId, tokenId (uso único) |

### Token Rotation (Refresh Token)

El sistema implementa rotación completa de refresh tokens:

```
1. Cliente envía refresh token
2. Backend valida token (no expirado, no revocado, no rotado)
3. Genera nuevo access token + nuevo refresh token
4. Marca el token usado como ROTATED
5. Guarda nuevo token con parentTokenId = tokenId anterior
6. Si el token ya estaba ROTATED → BRECHA DETECTADA
   → Revoca toda la familia de tokens
   → Usuario debe hacer login de nuevo
```

Estados de refresh token: `ACTIVE` → `ROTATED` → `REVOKED`

### Account Lockout (Bloqueo progresivo)

```
Intento 1-4: Solo registra el fallo
Intento 5+:  Bloquea la cuenta
  - 1er bloqueo: 15 minutos
  - 2do bloqueo: 30 minutos
  - 3er bloqueo+: 1 hora (máximo)

Login exitoso: resetea todos los contadores
```

La respuesta `AccountLockedError` incluye `remainingSeconds` para que el frontend muestre el tiempo restante.

### Rate Limiting

- **Auth routes:** 5 peticiones/minuto por IP
- **Global:** 100 peticiones/15 minutos por IP

Implementado en memoria (`InMemoryRateLimiter`). Se resetea al reiniciar el servidor.

### Hashing

- Algoritmo: bcrypt
- Salt rounds: 12 (configurable via `HASH_SALT_ROUNDS`)
- Los usuarios OAuth tienen `passwordHash = null`

---

## 10. OAuth2

### Proveedores soportados

- **Google** (`google`)
- **Microsoft** (`microsoft`)

### Flujo (Authorization Code Flow)

```
1. Frontend llama POST /auth/oauth/initiate { provider }
2. Backend genera state (JWT, 5 min) + authorizationUrl
3. Frontend guarda state en sessionStorage, redirige al proveedor
4. Proveedor redirige a /oauth/callback?code=...&state=...
5. Frontend llama POST /auth/oauth/callback { provider, code, state }
6. Backend valida state, intercambia code por tokens del proveedor
7. Obtiene perfil del usuario del proveedor
8. Busca: OAuthConnection por providerUserId → Email existente → Crea nuevo usuario
9. Usuario OAuth: passwordHash=null, status=ACTIVE, emailVerifiedAt=now
10. Retorna access + refresh tokens
```

### Variables de entorno

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_TENANT_ID (default: 'common')
```

---

## 11. RBAC y organizaciones

### System Roles

| Rol | Descripción |
|-----|-------------|
| `USER` | Usuario estándar. Solo accede a sus propias rutas. |
| `ADMIN` | Administrador. Puede gestionar orgs y miembros según permisos. |
| `SUPER_ADMIN` | Superadministrador. Acceso total. Bypass de todos los checks de permisos. |

### Admin Permissions (para usuarios ADMIN)

| Permiso | Descripción |
|---------|-------------|
| `manage_users` | Puede gestionar usuarios |
| `manage_organizations` | Puede crear/editar/borrar organizaciones |
| `assign_members` | Puede gestionar membresías |
| `view_all_data` | Puede acceder a analíticas y datos globales |

### Organization Types

`HOSPITAL`, `CLINIC`, `LABORATORY`, `PHARMACY`, `INSURANCE`, `GOVERNMENT`, `OTHER`

### Organization Roles (dentro de una organización)

`org_admin`, `doctor`, `nurse`, `specialist`, `staff`, `guest`

### Authorization Service

`RBACAuthorizationService` implementa `IAuthorizationService`:
- SUPER_ADMIN bypasses todos los checks
- ADMIN requiere el permiso específico concedido
- USER no tiene permisos de admin
- Combina system role + permisos granulares

---

## 12. Email transaccional

### Proveedor: Resend

**SDK:** `resend` v6.9.4
**Documentación:** https://resend.com

### Comportamiento por entorno

| `NODE_ENV` | `RESEND_API_KEY` | Comportamiento |
|------------|-----------------|---------------|
| `production` | Presente | Email enviado, token **NO** en respuesta HTTP |
| `development` | Cualquiera | **No** se envía email, token incluido en respuesta JSON |
| Cualquiera | Ausente | **No** se envía email, token incluido en respuesta JSON |

### Emails implementados

| Email | Subject | Trigger | Validez |
|-------|---------|---------|---------|
| **Verificación de cuenta** | `Verifica tu cuenta - {appName}` | `POST /auth/register` | 5 horas |
| **Reset de contraseña** | `Restablecer contraseña - {appName}` | `POST /auth/password-reset` | 30 minutos |

### Variables de entorno

```
RESEND_API_KEY  → API key de Resend
EMAIL_FROM      → Remitente (dominio verificado o onboarding@resend.dev en free trial)
APP_BASE_URL    → URL base del frontend para construir links (ej: https://app.healthcaresuite.com)
APP_NAME        → Nombre en emails (default: "Health Care Suite")
```

### Nota sobre free trial

Sin dominio verificado en Resend, los emails solo se entregan al email del propietario de la cuenta Resend. Para envío a cualquier destinatario, verificar el dominio en el dashboard de Resend.

---

## 13. Docker

### docker-compose.yaml

**Servicios:**

**`postgres`** (PostgreSQL 16 Alpine):
- Container: `big_school_postgres`
- Puerto: `5432:5432`
- DB: `big_school`, User: `big_school_user`
- Healthcheck: `pg_isready`
- Volume persistente: `postgres_data`

**`backend`** (Node.js Development):
- Container: `big_school_backend`
- Puerto: `3000:3000`
- Dockerfile: `Dockerfile.dev`
- Hot reload: `./src:/app/src:ro` (montado como read-only)
- Depende de: postgres (healthcheck)

**Red:** `big_school_network` (bridge)

### Dockerfile.dev

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]
```

### Comandos

```bash
# Iniciar entorno completo
docker compose up -d

# Ver logs del backend
docker logs big_school_backend --tail 50

# Reconstruir (tras cambios en package.json o Dockerfile)
docker compose up --build -d

# Parar sin perder datos
docker compose stop

# Parar y eliminar contenedores (datos PostgreSQL persisten en volume)
docker compose down
```

---

## 14. Variables de entorno

| Variable | Requerida | Default | Descripción |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Entorno. `production` activa envío de emails. |
| `PORT` | No | `3000` | Puerto HTTP |
| `HOST` | No | `0.0.0.0` | Host de escucha |
| `DATABASE_URL` | Sí (Postgres) | — | URL completa de conexión PostgreSQL |
| `DATABASE_HOST` | No | `localhost` | Host de PostgreSQL |
| `DATABASE_PORT` | No | `5432` | Puerto de PostgreSQL |
| `DATABASE_NAME` | No | `big_school` | Nombre de la base de datos |
| `DATABASE_USER` | No | — | Usuario de PostgreSQL |
| `DATABASE_PASSWORD` | Sí | — | Contraseña de PostgreSQL |
| `DATABASE_SSL` | No | `false` | Usar SSL en conexión |
| `USE_POSTGRES` | No | `false` | `true` para usar PostgreSQL (vs in-memory) |
| `JWT_ACCESS_SECRET` | Sí | — | Secreto para access tokens (mín 32 chars) |
| `JWT_REFRESH_SECRET` | Sí | — | Secreto para refresh tokens (mín 32 chars) |
| `JWT_PASSWORD_RESET_SECRET` | Sí | — | Secreto para tokens de reset (mín 32 chars) |
| `HASH_SALT_ROUNDS` | No | `12` | Rounds de bcrypt |
| `SUPER_ADMIN_EMAIL` | Sí | — | Email del super admin inicial |
| `SUPER_ADMIN_PASSWORD` | Sí | — | Contraseña del super admin inicial |
| `SUPER_ADMIN_FIRST_NAME` | Sí | — | Nombre del super admin inicial |
| `SUPER_ADMIN_LAST_NAME` | Sí | — | Apellido del super admin inicial |
| `RESEND_API_KEY` | No | — | API key de Resend. Sin ella, no se envían emails. |
| `EMAIL_FROM` | No | `noreply@example.com` | Remitente de los emails |
| `APP_BASE_URL` | No | `http://localhost:3000` | URL base del frontend para links en emails |
| `APP_NAME` | No | `Health Care Suite` | Nombre de la app en los emails |
| `GOOGLE_CLIENT_ID` | No | — | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | — | Client Secret de Google OAuth |
| `MICROSOFT_CLIENT_ID` | No | — | Client ID de Microsoft OAuth |
| `MICROSOFT_CLIENT_SECRET` | No | — | Client Secret de Microsoft OAuth |
| `MICROSOFT_TENANT_ID` | No | `common` | Tenant de Microsoft (common = personal + org) |

---

## 15. Scripts npm

Ejecutar desde `/backend`:

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `tsx watch src/index.ts` | Servidor de desarrollo con hot reload |
| `build` | `tsc` | Compilar TypeScript a JavaScript |
| `start` | `node dist/index.js` | Iniciar servidor compilado (producción) |
| `typecheck` | `tsc --noEmit` | Verificar tipos sin compilar |
| `lint` | `eslint src` | Linting con ESLint |
| `test` | `vitest` | Tests en modo watch |
| `test:unit` | `vitest run tests/unit` | Solo tests unitarios |
| `test:integration` | `vitest run tests/integration` | Solo tests de integración |
| `test:e2e` | `playwright test` | Tests E2E con Playwright |
| `test:coverage` | `vitest run --coverage` | Tests con cobertura |
| `migrate` | `tsx migrations/run.ts` | Ejecutar migraciones de BD |

---

## 16. Testing

### Estructura

```
tests/
├── unit/              # 53 archivos — lógica sin dependencias externas
│   ├── domain/
│   │   ├── entities/  # user.entity, organization.entity, etc.
│   │   └── value-objects/ # email, password-hash, system-role, etc.
│   └── application/
│       └── use-cases/ # register, login, refresh, verify-email, password-reset, etc.
├── integration/       # 1 archivo — tests con base de datos real
└── e2e/               # Playwright (configurado, listo para implementar)
```

### Framework y herramientas

- **Vitest** — Runner de tests, compatible con Jest
- **Vitest coverage v8** — Cobertura de código
- **Playwright** — Tests E2E

### Filosofía de testing

- Los use cases se testean con repositorios in-memory (sin BD real)
- Los mocks se inyectan via constructor (DI)
- El dominio se testea sin ninguna dependencia de infraestructura
- Los tests de integración usan la BD real de PostgreSQL

### Estadísticas

| Tipo | Archivos | Estado |
|------|---------|--------|
| Unit | 53 | Todos pasando |
| Integration | 1 | Pasando |
| E2E | 0 | Playwright configurado |

---

## 17. Documentación de features

Documentos en `backend/docs/`:

| Documento | Contenido |
|-----------|-----------|
| `ARCHITECTURE.md` | Diagrama de arquitectura, estructura de carpetas, convenciones |
| `feature-001-domain-value-objects.md` | Diseño de Value Objects |
| `feature-002-use-cases.md` | Implementación de use cases |
| `feature-003-infrastructure.md` | Servicios e implementaciones |
| `feature-004-http-interfaces.md` | Controllers, routes, validators |
| `feature-005-entry-point.md` | Arranque de la aplicación |
| `feature-006-email-verification.md` | Flujo de verificación de email |
| `feature-007-e2e-auth-tests.md` | Setup de tests E2E |
| `feature-008-password-reset.md` | Flujo de recuperación de contraseña |
| `feature-009-postgresql-docker.md` | Setup PostgreSQL + Docker |
| `feature-010-rate-limiting-lockout.md` | Rate limiting + bloqueo de cuentas |
| `feature-011-oauth2-authentication.md` | OAuth2 con Google y Microsoft |
| `feature-012-rbac-organizations.md` | RBAC completo + organizaciones (14 iteraciones) |

---

---

## 18. Producción

### Plataformas

| Componente | Plataforma | Plan |
|-----------|-----------|------|
| API (este servicio) | Render | Free |
| Base de datos | Neon PostgreSQL | Free |
| Frontend | Vercel | Hobby |

### URLs

| Recurso | URL |
|---------|-----|
| API | `https://health-care-suite-backend.onrender.com` |
| Health check | `https://health-care-suite-backend.onrender.com/health` |
| Frontend | `https://health-care-suite-frontend.vercel.app` |

### Limitaciones del Free Tier

#### Render Free

- **Cold start:** el servicio se duerme tras **15 min de inactividad**; la primera petición tarda ~30-50 s en despertar.
- **RAM:** 512 MB | **CPU:** compartida (sin garantía de rendimiento)
- **Ancho de banda:** 100 GB/mes
- **Uptime:** no garantizado; Render puede pausar el servicio si necesita recursos del host.
- **Dominio:** URL tipo `*.onrender.com`; no incluye dominio personalizado en el plan gratuito.

**Mitigaciones aplicadas:**

| Mitigación | Detalle |
|-----------|---------|
| Timeout HTTP aumentado | El cliente Axios del frontend usa **60 000 ms** (`axios-http-client.ts`) para absorber el cold start |
| UptimeRobot | Configurar monitor HTTP gratuito cada **5 min** apuntando a `/health` para mantener el servicio activo |

> **Nota:** estas limitaciones desaparecen al desplegar en servidores propios de la empresa.

#### Neon PostgreSQL Free

- **Storage:** 0,5 GB
- **Compute:** se pausa tras 5 min de inactividad del proyecto; su cold start se suma al de Render.
- **Compute hours:** ~192 h/mes (suficiente para uso de desarrollo y demo)
- **Conexiones concurrentes:** ~100

### Variables de entorno en Render

Configurar en Render → Settings → Environment Variables:

| Variable | Valor / Descripción |
|----------|---------------------|
| `NODE_ENV` | `production` |
| `USE_POSTGRES` | `true` |
| `PORT` | `3000` |
| `HOST` | `0.0.0.0` |
| `DATABASE_URL` | Connection string de Neon (incluye SSL) |
| `DATABASE_SSL` | `true` |
| `JWT_ACCESS_SECRET` | Secreto mínimo 32 chars |
| `JWT_REFRESH_SECRET` | Secreto mínimo 32 chars |
| `JWT_PASSWORD_RESET_SECRET` | Secreto mínimo 32 chars |
| `CORS_ORIGIN` | `https://health-care-suite-frontend.vercel.app` |
| `APP_BASE_URL` | `https://health-care-suite-frontend.vercel.app` |
| `APP_NAME` | `Health Care Suite` |
| `OAUTH_STATE_SECRET` | Secreto para JWT de estado OAuth (mín 48 chars) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciales OAuth Google |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | Credenciales OAuth Microsoft |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Credenciales del super admin inicial |
| `SUPER_ADMIN_FIRST_NAME` / `SUPER_ADMIN_LAST_NAME` | Nombre del super admin inicial |

### Start Command (Render)

```
npm run build && npm run migrate && npm start
```

---

*Documento generado el 2026-03-19 — Versión del proyecto: 1.0.0*
