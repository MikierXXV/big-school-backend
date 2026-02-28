# Feature 012: RBAC + Organizations (Healthcare Context)

**Rama:** `feature-012-rbac-organizations`

## Contexto

La plataforma Big School se ha reorientado al sector salud. Los usuarios pertenecen a organizaciones sanitarias (hospitales, clínicas, centros de salud) y tienen roles específicos dentro de esas organizaciones (enfermero/a, médico/a, especialista, administrador/a).

### Modelo de Permisos

```
┌──────────────────────────────────────────────────────────────────────┐
│                    MODELO MULTI-TENANT RBAC                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Usuario                                                              │
│  ├── System Role (global)                                            │
│  │   ├── SUPER_ADMIN → Permisos completos, inmutables               │
│  │   ├── ADMIN → Permisos otorgados por SUPER_ADMIN                 │
│  │   │            (puede gestionar users, orgs si se le otorga)     │
│  │   └── USER → Usuario estándar (default)                          │
│  │                                                                    │
│  └── Organization Memberships (puede tener varias)                   │
│      ├── Hospital del Mar → DOCTOR                                   │
│      ├── Clínica Barcelona → NURSE                                   │
│      └── Centro de Salud → SPECIALIST                                │
│                                                                       │
│  Permisos = f(System Role, Granted Permissions, Org Role, Context)   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Roles del Sistema (System Roles)

| Role | Descripción | Permisos |
|------|-------------|----------|
| `SUPER_ADMIN` | Administrador de plataforma (inmutable) | Todos los permisos, siempre |
| `ADMIN` | Administrador delegado | Solo permisos otorgados explícitamente por SUPER_ADMIN |
| `USER` | Usuario estándar | Solo permisos dentro de organizaciones asignadas |

> El `SUPER_ADMIN` inicial se crea automáticamente al arrancar la app con credenciales del `.env`.

### Roles Organizacionales (Organization Roles)

| Role | Descripción | Permisos Típicos |
|------|-------------|------------------|
| `ORG_ADMIN` | Administrador de la organización | Gestionar miembros, asignar roles dentro de la org |
| `DOCTOR` | Médico/a | Ver/editar pacientes, crear citas, prescripciones |
| `NURSE` | Enfermero/a | Ver pacientes, actualizar registros, administrar medicación |
| `SPECIALIST` | Especialista | Ver/editar pacientes de su especialidad |
| `STAFF` | Personal administrativo | Ver información, gestionar citas |
| `GUEST` | Invitado/observador | Solo lectura de información pública |

---

## Flujo de Registro y Asignación de Roles

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FLUJO: REGISTRO → ASIGNACIÓN                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Usuario se registra (email/password o OAuth)                   │
│     → Cuenta creada con system_role = USER                         │
│     → Sin membresías a organizaciones                              │
│     → Acceso limitado: solo perfil propio, sin recursos           │
│                                                                      │
│  2. SUPER_ADMIN crea una organización                              │
│     POST /organizations { name, type }                             │
│     → Organization creada                                          │
│     → SUPER_ADMIN automáticamente añadido como ORG_ADMIN          │
│                                                                      │
│  3. SUPER_ADMIN promociona un USER a ADMIN (opcional)              │
│     POST /admin/users/:userId/promote { systemRole: 'admin' }     │
│     → Usuario ahora es ADMIN (sin permisos todavía)               │
│                                                                      │
│  4. SUPER_ADMIN otorga permisos al ADMIN                           │
│     POST /admin/users/:userId/permissions                          │
│     { permissions: ['MANAGE_USERS', 'ASSIGN_MEMBERS'] }           │
│     → ADMIN ahora puede gestionar usuarios y asignar a orgs       │
│                                                                      │
│  5. ADMIN (con permisos) o SUPER_ADMIN asigna usuario a org       │
│     POST /organizations/:orgId/members                             │
│     { userId, role: 'NURSE' }                                      │
│     → OrganizationMembership creada                               │
│     → Usuario ahora tiene permisos de NURSE en esa organización   │
│                                                                      │
│  6. Usuario accede a recursos                                      │
│     GET /patients?organizationId=xxx                               │
│     → Middleware verifica:                                         │
│       - Usuario pertenece a la organización                       │
│       - Rol tiene permiso VIEW_PATIENTS                           │
│     → Devuelve datos filtrados por organización                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Migraciones SQL

### Migration 007: Tabla organizations

```sql
-- migrations/007_create_organizations_table.sql

CREATE TYPE organization_type AS ENUM (
    'hospital',
    'clinic',
    'health_center',
    'laboratory',
    'pharmacy',
    'other'
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type organization_type NOT NULL,
    description TEXT NULL,
    address VARCHAR(500) NULL,
    contact_email VARCHAR(254) NULL,
    contact_phone VARCHAR(50) NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT organizations_name_unique UNIQUE (name)
);

CREATE INDEX idx_organizations_active ON organizations(active);
CREATE INDEX idx_organizations_type ON organizations(type);
```

### Migration 008: System Role en users

```sql
-- migrations/008_add_system_role_to_users.sql

CREATE TYPE system_role AS ENUM ('super_admin', 'admin', 'user');

ALTER TABLE users ADD COLUMN system_role system_role NOT NULL DEFAULT 'user';

CREATE INDEX idx_users_system_role ON users(system_role);
```

### Migration 009: Tabla admin_permissions

```sql
-- migrations/009_create_admin_permissions_table.sql

CREATE TYPE admin_permission AS ENUM (
    -- Platform management
    'manage_users',           -- Crear, editar, eliminar usuarios
    'manage_organizations',   -- Crear, editar, eliminar organizaciones
    'assign_members',         -- Asignar usuarios a organizaciones
    'view_all_data'           -- Ver todos los datos de todas las organizaciones
);

CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission admin_permission NOT NULL,
    granted_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT admin_permissions_unique UNIQUE (admin_user_id, permission),
    CONSTRAINT admin_permissions_role_check CHECK (
        (SELECT system_role FROM users WHERE id = admin_user_id) = 'admin'
    )
);

CREATE INDEX idx_admin_permissions_user ON admin_permissions(admin_user_id);
```

### Migration 010: Tabla organization_memberships

```sql
-- migrations/010_create_organization_memberships_table.sql

CREATE TYPE organization_role AS ENUM (
    'org_admin',
    'doctor',
    'nurse',
    'specialist',
    'staff',
    'guest'
);

CREATE TABLE IF NOT EXISTS organization_memberships (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role organization_role NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,  -- Quién asignó
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT membership_active_unique UNIQUE (user_id, organization_id, left_at)
        WHERE left_at IS NULL,
    CONSTRAINT membership_dates_check CHECK (left_at IS NULL OR left_at >= joined_at)
);

CREATE INDEX idx_memberships_user_active ON organization_memberships(user_id) WHERE left_at IS NULL;
CREATE INDEX idx_memberships_org_active ON organization_memberships(organization_id) WHERE left_at IS NULL;
CREATE INDEX idx_memberships_role ON organization_memberships(role);
```

---

## Variables de Entorno

```env
# ============ SUPER ADMIN INICIAL ============
SUPER_ADMIN_EMAIL=superadmin@bigschool.com
SUPER_ADMIN_PASSWORD=change-this-strong-password-123!
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin

# Estas credenciales se usan en el seed inicial para crear el primer SUPER_ADMIN
# La app verifica al arrancar si existe, y si no, lo crea automáticamente
```

El seed inicial (`src/infrastructure/database/seed-super-admin.ts`):
```typescript
// Se ejecuta en app.factory.ts al arrancar si NODE_ENV !== 'test'
// Verifica si existe un SUPER_ADMIN con el email configurado
// Si no existe, lo crea con los datos del .env
```

---

## Permisos de ADMIN (Admin Permissions)

Los ADMIN pueden tener uno o más de estos permisos, otorgados por SUPER_ADMIN:

| Permission | Descripción | Permite |
|------------|-------------|---------|
| `MANAGE_USERS` | Gestión de usuarios | Crear users, cambiar system_role (solo a USER/ADMIN, no a SUPER_ADMIN), eliminar users |
| `MANAGE_ORGANIZATIONS` | Gestión de organizaciones | Crear, editar, eliminar organizaciones |
| `ASSIGN_MEMBERS` | Asignación de miembros | Asignar/remover usuarios de organizaciones, cambiar roles organizacionales |
| `VIEW_ALL_DATA` | Vista global | Ver datos de todas las organizaciones (sin necesidad de ser miembro) |

**Restricciones de ADMIN**:
- NO puede promocionar a SUPER_ADMIN
- NO puede otorgar permisos a otros ADMIN (solo SUPER_ADMIN puede)
- NO puede revocar sus propios permisos (solo SUPER_ADMIN puede)
- NO puede eliminar SUPER_ADMIN

---

## Componentes por Capa

### Domain Layer (CREAR)

| Archivo | Descripción |
|---------|-------------|
| `src/domain/value-objects/system-role.value-object.ts` | `SystemRole`: 'super_admin' \| 'admin' \| 'user' |
| `src/domain/value-objects/organization-role.value-object.ts` | `OrganizationRole`: 'org_admin' \| 'doctor' \| 'nurse' \| 'specialist' \| 'staff' \| 'guest' |
| `src/domain/value-objects/organization-type.value-object.ts` | `OrganizationType`: 'hospital' \| 'clinic' \| 'health_center' \| etc. |
| `src/domain/value-objects/admin-permission.value-object.ts` | `AdminPermission`: 'manage_users' \| 'manage_organizations' \| 'assign_members' \| 'view_all_data' |
| `src/domain/entities/organization.entity.ts` | `Organization`: id, name, type, description, address, contactEmail, contactPhone, active, timestamps |
| `src/domain/entities/organization-membership.entity.ts` | `OrganizationMembership`: id, userId, organizationId, role, joinedAt, leftAt, createdBy, timestamps |
| `src/domain/entities/admin-permission-grant.entity.ts` | `AdminPermissionGrant`: id, adminUserId, permission, grantedBy, grantedAt |
| `src/domain/repositories/organization.repository.interface.ts` | `IOrganizationRepository`: save, findById, findByName, findAll, update, delete |
| `src/domain/repositories/organization-membership.repository.interface.ts` | `IOrganizationMembershipRepository`: save, findByUserId, findByOrganizationId, findActiveMembership, update, remove |
| `src/domain/repositories/admin-permission.repository.interface.ts` | `IAdminPermissionRepository`: grant, revoke, findByUserId, hasPermission |
| `src/domain/errors/organization.errors.ts` | `OrganizationNotFoundError`, `OrganizationAlreadyExistsError`, `UserNotMemberError`, `InsufficientPermissionsError`, `MembershipAlreadyExistsError` |
| `src/domain/errors/authorization.errors.ts` | `UnauthorizedError`, `ForbiddenError`, `CannotModifySuperAdminError` |

### Domain Layer (MODIFICAR)

| Archivo | Cambio |
|---------|--------|
| `src/domain/entities/user.entity.ts` | Añadir `systemRole: SystemRole` (default USER); métodos `isSuperAdmin()`, `isAdmin()`, `isUser()` |

### Application Layer (CREAR)

| Archivo | Descripción |
|---------|-------------|
| `src/application/ports/authorization.service.port.ts` | `IAuthorizationService`: `hasPermission(userId, permission, context?): boolean`, `canAccessOrganization(userId, orgId): boolean` |
| `src/application/dtos/organization/organization.dto.ts` | `CreateOrganizationDto`, `OrganizationResponseDto`, `UpdateOrganizationDto` |
| `src/application/dtos/organization/membership.dto.ts` | `AssignMemberDto`, `MembershipResponseDto`, `UpdateMemberRoleDto` |
| `src/application/dtos/admin/admin.dto.ts` | `PromoteToAdminDto`, `GrantPermissionDto`, `AdminPermissionsResponseDto` |
| `src/application/use-cases/organizations/create-organization.use-case.ts` | Crea organización (SUPER_ADMIN o ADMIN con MANAGE_ORGANIZATIONS) |
| `src/application/use-cases/organizations/get-organization.use-case.ts` | Obtiene organización por ID (miembros, ADMIN con VIEW_ALL_DATA, o SUPER_ADMIN) |
| `src/application/use-cases/organizations/list-organizations.use-case.ts` | Lista organizaciones (filtradas por acceso) |
| `src/application/use-cases/organizations/update-organization.use-case.ts` | Actualiza org (ORG_ADMIN, ADMIN con MANAGE_ORGANIZATIONS, o SUPER_ADMIN) |
| `src/application/use-cases/organizations/delete-organization.use-case.ts` | Elimina org (SUPER_ADMIN o ADMIN con MANAGE_ORGANIZATIONS) |
| `src/application/use-cases/memberships/assign-user-to-organization.use-case.ts` | Asigna user a org con rol (ORG_ADMIN, ADMIN con ASSIGN_MEMBERS, o SUPER_ADMIN) |
| `src/application/use-cases/memberships/remove-user-from-organization.use-case.ts` | Remueve user de org |
| `src/application/use-cases/memberships/change-user-organization-role.use-case.ts` | Cambia rol dentro de org |
| `src/application/use-cases/memberships/get-user-organizations.use-case.ts` | Lista organizaciones del usuario |
| `src/application/use-cases/memberships/get-organization-members.use-case.ts` | Lista miembros de una org |
| `src/application/use-cases/admin/promote-user-to-admin.use-case.ts` | Promociona USER a ADMIN (SUPER_ADMIN only) |
| `src/application/use-cases/admin/demote-admin-to-user.use-case.ts` | Degrada ADMIN a USER (SUPER_ADMIN only) |
| `src/application/use-cases/admin/grant-admin-permission.use-case.ts` | Otorga permiso a ADMIN (SUPER_ADMIN only) |
| `src/application/use-cases/admin/revoke-admin-permission.use-case.ts` | Revoca permiso de ADMIN (SUPER_ADMIN only) |
| `src/application/use-cases/admin/get-admin-permissions.use-case.ts` | Lista permisos de un ADMIN |

### Infrastructure Layer (CREAR)

| Archivo | Descripción |
|---------|-------------|
| `src/infrastructure/services/rbac-authorization.service.ts` | `RBACAuthorizationService implements IAuthorizationService` — lógica de permisos |
| `src/infrastructure/database/seed-super-admin.ts` | `seedSuperAdmin()` — crea SUPER_ADMIN inicial desde .env |
| `src/infrastructure/persistence/postgresql/postgres-organization.repository.ts` | Implementación PostgreSQL |
| `src/infrastructure/persistence/postgresql/postgres-organization-membership.repository.ts` | Implementación PostgreSQL |
| `src/infrastructure/persistence/postgresql/postgres-admin-permission.repository.ts` | Implementación PostgreSQL |
| `src/infrastructure/persistence/in-memory/in-memory-organization.repository.ts` | Para tests |
| `src/infrastructure/persistence/in-memory/in-memory-organization-membership.repository.ts` | Para tests |
| `src/infrastructure/persistence/in-memory/in-memory-admin-permission.repository.ts` | Para tests |

### Infrastructure Layer (MODIFICAR)

| Archivo | Cambio |
|---------|--------|
| `src/infrastructure/container/container.ts` | Registrar nuevos repos, services, use cases |

### Interfaces Layer (CREAR)

| Archivo | Descripción |
|---------|-------------|
| `src/interfaces/http/controllers/organizations.controller.ts` | `OrganizationsController`: create, get, list, update, delete |
| `src/interfaces/http/controllers/memberships.controller.ts` | `MembershipsController`: assign, remove, changeRole, listMembers |
| `src/interfaces/http/controllers/admin.controller.ts` | `AdminController`: promoteToAdmin, demoteToUser, grantPermission, revokePermission, getPermissions |
| `src/interfaces/http/routes/organizations.routes.ts` | Rutas `/organizations` |
| `src/interfaces/http/routes/memberships.routes.ts` | Rutas `/organizations/:orgId/members` |
| `src/interfaces/http/routes/admin.routes.ts` | Rutas `/admin/users/:userId/*` |
| `src/interfaces/http/validators/organization.validators.ts` | Validación de DTOs de organizaciones |
| `src/interfaces/http/validators/membership.validators.ts` | Validación de DTOs de membresías |
| `src/interfaces/http/validators/admin.validators.ts` | Validación de DTOs de admin |
| `src/interfaces/http/middlewares/require-permission.middleware.ts` | `requirePermission(permission)` — verifica permisos |
| `src/interfaces/http/middlewares/require-system-role.middleware.ts` | `requireSystemRole(roles)` — verifica system_role |
| `src/interfaces/http/middlewares/require-organization-access.middleware.ts` | `requireOrganizationAccess(orgIdParam)` — verifica acceso a org |

### Interfaces Layer (MODIFICAR)

| Archivo | Cambio |
|---------|--------|
| `src/interfaces/http/app.factory.ts` | Añadir organization, membership, admin routes; ejecutar `seedSuperAdmin()` al arrancar |
| `src/interfaces/http/middlewares/auth.middleware.ts` | Añadir `organizationContext` al request si viene organizationId en query/param |

---

## Endpoints

### Admin Management (Solo SUPER_ADMIN)

| Método | Ruta | Auth | Permisos | Descripción |
|--------|------|------|----------|-------------|
| POST | `/admin/users/:userId/promote` | Sí | SUPER_ADMIN | Promocionar a ADMIN |
| POST | `/admin/users/:userId/demote` | Sí | SUPER_ADMIN | Degradar a USER |
| POST | `/admin/users/:userId/permissions` | Sí | SUPER_ADMIN | Otorgar permiso a ADMIN |
| DELETE | `/admin/users/:userId/permissions/:permission` | Sí | SUPER_ADMIN | Revocar permiso de ADMIN |
| GET | `/admin/users/:userId/permissions` | Sí | SUPER_ADMIN o propio user | Listar permisos de ADMIN |

### Organizations

| Método | Ruta | Auth | Permisos | Descripción |
|--------|------|------|----------|-------------|
| POST | `/organizations` | Sí | SUPER_ADMIN o ADMIN con MANAGE_ORGANIZATIONS | Crear organización |
| GET | `/organizations` | Sí | * | Listar organizaciones (filtradas por acceso) |
| GET | `/organizations/:id` | Sí | Miembro, ADMIN con VIEW_ALL_DATA, o SUPER_ADMIN | Obtener organización |
| PATCH | `/organizations/:id` | Sí | ORG_ADMIN, ADMIN con MANAGE_ORGANIZATIONS, o SUPER_ADMIN | Actualizar organización |
| DELETE | `/organizations/:id` | Sí | SUPER_ADMIN o ADMIN con MANAGE_ORGANIZATIONS | Eliminar organización |

### Memberships

| Método | Ruta | Auth | Permisos | Descripción |
|--------|------|------|----------|-------------|
| POST | `/organizations/:orgId/members` | Sí | ORG_ADMIN, ADMIN con ASSIGN_MEMBERS, o SUPER_ADMIN | Asignar usuario a organización |
| GET | `/organizations/:orgId/members` | Sí | Miembro, ADMIN con VIEW_ALL_DATA, o SUPER_ADMIN | Listar miembros |
| GET | `/users/:userId/organizations` | Sí | Propio usuario, ADMIN con MANAGE_USERS, o SUPER_ADMIN | Listar organizaciones del usuario |
| PATCH | `/organizations/:orgId/members/:userId` | Sí | ORG_ADMIN, ADMIN con ASSIGN_MEMBERS, o SUPER_ADMIN | Cambiar rol |
| DELETE | `/organizations/:orgId/members/:userId` | Sí | ORG_ADMIN, ADMIN con ASSIGN_MEMBERS, o SUPER_ADMIN | Remover de organización |

---

## Orden de Implementación TDD

```
PASO 1: Migraciones SQL                                   (no tests)
  007_create_organizations_table.sql
  008_add_system_role_to_users.sql
  009_create_admin_permissions_table.sql
  010_create_organization_memberships_table.sql

PASO 2: Infrastructure — Seed Super Admin                 (no tests)
  src/infrastructure/database/seed-super-admin.ts
  - Lee SUPER_ADMIN_EMAIL, PASSWORD del .env
  - Verifica si existe un SUPER_ADMIN con ese email
  - Si no existe, crea User con systemRole = SUPER_ADMIN
  - Hash password, status ACTIVE, email verified
  - Se ejecuta en app.factory.ts al arrancar (solo si NODE_ENV !== 'test')

PASO 3: Domain — SystemRole Value Object                  → ~12 tests
  - create('super_admin'), ('admin'), ('user') → OK
  - create('invalid') → error
  - equals(), isSuperAdmin(), isAdmin(), isUser()

PASO 4: Domain — AdminPermission Value Object             → ~10 tests
  - create('manage_users'), ('manage_organizations'), etc. → OK
  - create('invalid') → error
  - equals()

PASO 5: Domain — OrganizationRole Value Object            → ~15 tests
  - create('org_admin'), ('doctor'), ('nurse'), etc. → OK
  - equals()

PASO 6: Domain — OrganizationType Value Object            → ~8 tests
  - create('hospital'), ('clinic'), etc. → OK

PASO 7: Domain — Modificar User Entity                    → ~12 tests
  - User.create() con systemRole = USER (default)
  - User.create() con systemRole = SUPER_ADMIN
  - User.create() con systemRole = ADMIN
  - isSuperAdmin(), isAdmin(), isUser()
  - systemRole es inmutable

PASO 8: Domain — AdminPermissionGrant Entity              → ~15 tests
  - create() con adminUserId, permission, grantedBy
  - adminUserId debe ser un ADMIN (validación en app layer)
  - permission es AdminPermission VO
  - grantedAt automático = now

PASO 9: Domain — Organization Entity                      → ~20 tests
  - create() con datos válidos
  - name no puede estar vacío
  - type es OrganizationType VO
  - activate(), deactivate()

PASO 10: Domain — OrganizationMembership Entity           → ~25 tests
  - create() con userId, organizationId, role
  - leave() marca leftAt
  - changeRole(newRole)

PASO 11: Domain — Errors                                  (solo definiciones)
  - OrganizationNotFoundError, InsufficientPermissionsError, etc.
  - CannotModifySuperAdminError

PASO 12: Domain — Repository Interfaces                   (solo definiciones)
  - IOrganizationRepository
  - IOrganizationMembershipRepository
  - IAdminPermissionRepository

PASO 13: Application — IAuthorizationService Port         (solo definición)

PASO 14: Application — DTOs                               (solo definiciones)

PASO 15: Infrastructure — InMemoryAdminPermissionRepo     → ~20 tests
  - grant() + hasPermission()
  - findByUserId()
  - revoke()

PASO 16: Infrastructure — InMemoryOrganizationRepo        → ~20 tests
  - save(), findById(), findByName(), etc.

PASO 17: Infrastructure — InMemoryMembershipRepo          → ~25 tests
  - save(), findByUserId(), findActiveMembership(), etc.

PASO 18: Infrastructure — RBACAuthorizationService        → ~40 tests
  - SUPER_ADMIN siempre tiene todos los permisos
  - ADMIN solo tiene permisos otorgados
  - hasPermission(superAdminId, any) → true
  - hasPermission(adminId, MANAGE_USERS) → true si tiene el permiso
  - hasPermission(adminId, MANAGE_USERS) → false si no tiene el permiso
  - hasPermission(userId, MANAGE_USERS) → false (USER no puede)
  - canAccessOrganization() verifica memberships

PASO 19: Application — PromoteToAdminUseCase              → ~20 tests
  - execute() por SUPER_ADMIN → cambia systemRole a ADMIN
  - execute() por ADMIN → InsufficientPermissionsError
  - execute() sobre SUPER_ADMIN → CannotModifySuperAdminError
  - usuario no existe → UserNotFoundError

PASO 20: Application — GrantAdminPermissionUseCase        → ~20 tests
  - execute() por SUPER_ADMIN → crea AdminPermissionGrant
  - execute() por ADMIN → InsufficientPermissionsError
  - otorgar a USER → error (debe ser ADMIN)
  - otorgar permiso duplicado → idempotente

PASO 21: Application — RevokeAdminPermissionUseCase       → ~15 tests
  - execute() por SUPER_ADMIN → elimina grant
  - permiso no existe → idempotente

PASO 22: Application — CreateOrganizationUseCase          → ~25 tests
  - execute() por SUPER_ADMIN → crea org + membership como ORG_ADMIN
  - execute() por ADMIN con MANAGE_ORGANIZATIONS → crea org
  - execute() por ADMIN sin MANAGE_ORGANIZATIONS → InsufficientPermissionsError
  - execute() por USER → InsufficientPermissionsError

PASO 23: Application — GetOrganizationUseCase             → ~20 tests
  - execute() por miembro → devuelve org
  - execute() por ADMIN con VIEW_ALL_DATA → devuelve org
  - execute() por SUPER_ADMIN → siempre devuelve
  - execute() por no miembro sin permisos → OrganizationNotFoundError

PASO 24: Application — ListOrganizationsUseCase           → ~20 tests
  - execute() por SUPER_ADMIN → todas
  - execute() por ADMIN con VIEW_ALL_DATA → todas
  - execute() por USER → solo las suyas

PASO 25: Application — UpdateOrganizationUseCase          → ~20 tests
  - execute() por ORG_ADMIN → actualiza
  - execute() por ADMIN con MANAGE_ORGANIZATIONS → actualiza
  - execute() por SUPER_ADMIN → actualiza
  - execute() por miembro no admin → InsufficientPermissionsError

PASO 26: Application — DeleteOrganizationUseCase          → ~15 tests
  - execute() por SUPER_ADMIN → elimina
  - execute() por ADMIN con MANAGE_ORGANIZATIONS → elimina
  - execute() por ORG_ADMIN → InsufficientPermissionsError (solo platform admins)

PASO 27: Application — AssignUserToOrganizationUseCase    → ~30 tests
  - execute() por ORG_ADMIN → crea membership
  - execute() por ADMIN con ASSIGN_MEMBERS → crea membership
  - execute() por SUPER_ADMIN → crea membership
  - execute() por DOCTOR → InsufficientPermissionsError

PASO 28: Application — Remove/Change Membership Use Cases → ~35 tests
  - RemoveUserFromOrganizationUseCase
  - ChangeUserOrganizationRoleUseCase

PASO 29: Application — Get Use Cases                      → ~20 tests
  - GetUserOrganizationsUseCase
  - GetOrganizationMembersUseCase
  - GetAdminPermissionsUseCase

PASO 30: Interfaces — AdminController                     → ~30 tests
  - promoteToAdmin() → 200
  - promoteToAdmin() sin ser SUPER_ADMIN → 403
  - grantPermission() → 200
  - revokePermission() → 204
  - getPermissions() → 200

PASO 31: Interfaces — OrganizationsController             → ~35 tests
  - create() por SUPER_ADMIN → 201
  - create() por ADMIN con permiso → 201
  - create() por ADMIN sin permiso → 403
  - get(), list(), update(), delete()

PASO 32: Interfaces — MembershipsController               → ~35 tests
  - assign() por ORG_ADMIN → 201
  - assign() por ADMIN con ASSIGN_MEMBERS → 201
  - listMembers(), changeRole(), remove()

PASO 33: Interfaces — Middlewares                         → ~30 tests
  - requireSystemRole(['super_admin'])
  - requireSystemRole(['admin', 'super_admin'])
  - requirePermission(Permission.MANAGE_USERS)
  - requireOrganizationAccess(organizationId param)

PASO 34: Container Integration                            → ~5 tests

PASO 35: E2E Tests                                        → ~60 tests
  tests/e2e/admin/admin.e2e.ts
  - SUPER_ADMIN promociona USER a ADMIN → 200
  - SUPER_ADMIN otorga MANAGE_USERS a ADMIN → 200
  - ADMIN con MANAGE_USERS crea usuario → 201
  - ADMIN sin MANAGE_USERS intenta crear usuario → 403

  tests/e2e/organizations/organizations.e2e.ts
  - SUPER_ADMIN crea org → 201
  - ADMIN con MANAGE_ORGANIZATIONS crea org → 201
  - ADMIN sin MANAGE_ORGANIZATIONS intenta crear org → 403
  - ORG_ADMIN asigna miembro → 201
  - ADMIN con ASSIGN_MEMBERS asigna miembro → 201
                                                  ─────────────
                                                  ~600 tests nuevos
                                                  (~1500 tests total)
```

---

## Seguridad y Consideraciones

| Aspecto | Implementación |
|---------|---------------|
| **SUPER_ADMIN inicial** | Se crea automáticamente al arrancar la app desde credenciales .env; email y password hasheado |
| **Promoción a SUPER_ADMIN** | NO hay endpoint; solo se puede hacer manualmente en DB (UPDATE users SET system_role = 'super_admin' ...) |
| **ADMIN delegado** | SUPER_ADMIN puede promocionar USER → ADMIN, pero debe otorgar permisos explícitamente |
| **Restricciones ADMIN** | No puede modificar SUPER_ADMIN, no puede otorgar permisos, no puede auto-otorgarse permisos |
| **Isolation** | Recursos siempre filtrados por organizationId; middleware verifica membresía activa |
| **Auditoría** | `created_by` en memberships; `granted_by` en admin_permissions; timestamps en todas las tablas |
| **Cascade Delete** | Eliminar organización elimina memberships; eliminar usuario elimina permisos otorgados |

---

## Verificación

```bash
# 1. Aplicar migraciones SQL
# 007-010

# 2. Configurar .env
SUPER_ADMIN_EMAIL=superadmin@bigschool.com
SUPER_ADMIN_PASSWORD=SuperSecure123!@#
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin

# 3. Arrancar app (crea SUPER_ADMIN automáticamente)
npm run dev
# → Log: "SUPER_ADMIN created: superadmin@bigschool.com"

# 4. Login como SUPER_ADMIN
POST http://localhost:3000/auth/login
{
  "email": "superadmin@bigschool.com",
  "password": "SuperSecure123!@#"
}
# → 200 OK { accessToken, refreshToken, user: { systemRole: 'super_admin' } }

# 5. Promocionar usuario a ADMIN
POST http://localhost:3000/admin/users/:userId/promote
Authorization: Bearer <super-admin-token>
{ "systemRole": "admin" }
# → 200 OK

# 6. Otorgar permisos al ADMIN
POST http://localhost:3000/admin/users/:userId/permissions
{ "permissions": ["manage_users", "assign_members"] }
# → 201 Created

# 7. Como ADMIN, crear usuario
POST http://localhost:3000/users
Authorization: Bearer <admin-token>
{ ... }
# → 201 Created (si tiene MANAGE_USERS)

# 8. Como ADMIN, crear organización
POST http://localhost:3000/organizations
{ "name": "Hospital del Mar", "type": "hospital" }
# → 403 Forbidden (no tiene MANAGE_ORGANIZATIONS)

# 9. SUPER_ADMIN otorga MANAGE_ORGANIZATIONS
POST http://localhost:3000/admin/users/:adminId/permissions
{ "permissions": ["manage_organizations"] }
# → 201 Created

# 10. Como ADMIN, crear organización (ahora sí)
POST http://localhost:3000/organizations
{ "name": "Hospital del Mar", "type": "hospital" }
# → 201 Created
```

---

## Resultado Esperado

Al finalizar esta feature:
- ✅ Modelo multi-tenant RBAC completo
- ✅ 3 niveles de system roles: SUPER_ADMIN > ADMIN > USER
- ✅ SUPER_ADMIN inicial auto-creado desde .env al arrancar
- ✅ ADMIN con permisos granulares otorgados por SUPER_ADMIN
- ✅ Organization roles: ORG_ADMIN, DOCTOR, NURSE, SPECIALIST, STAFF, GUEST
- ✅ Tabla `admin_permissions` con permisos MANAGE_USERS, MANAGE_ORGANIZATIONS, ASSIGN_MEMBERS, VIEW_ALL_DATA
- ✅ Middleware `requireSystemRole()`, `requirePermission()`, `requireOrganizationAccess()`
- ✅ `RBACAuthorizationService` con lógica de permisos jerárquica
- ✅ ADMIN puede gestionar usuarios/organizaciones solo si SUPER_ADMIN le otorga permisos
- ✅ Usuarios auto-registrados tienen acceso limitado hasta asignación
- ✅ ~600 tests nuevos (~1500 tests total)
- ✅ Clean Architecture preservada
- ✅ 4 migraciones SQL aplicadas

---

## Integración con OAuth (Feature 011)

Cuando un usuario se registra vía OAuth:
- `systemRole` = USER (igual que registro con password)
- Sin membresías a organizaciones
- Debe esperar a que un ADMIN (con permisos) o SUPER_ADMIN lo asigne a una organización
