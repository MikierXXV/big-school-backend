# Health Care Suite — Backend

Sistema de autenticación y autorización de nivel empresarial para la plataforma de gestión hospitalaria Health Care Suite. Implementado con **Clean Architecture**, **Arquitectura Hexagonal (Ports & Adapters)** y **Domain-Driven Design**.

## Stack tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| Runtime | Node.js 20+ |
| Lenguaje | TypeScript 5.3 |
| HTTP Framework | Express.js 5 |
| Base de datos | PostgreSQL 16 |
| ORM/Driver | node-postgres (pg) |
| Autenticación | JWT (access + refresh token rotation) |
| Hashing | bcrypt (12 rounds) |
| Email | Resend SDK |
| Testing | Vitest + Playwright |

## Requisitos previos

- **Node.js** ≥ 20
- **Docker + Docker Compose** (para la base de datos local)
- **Git**

## Setup local

```bash
# 1. Entrar al directorio
cd backend

# 2. Copiar variables de entorno (los defaults funcionan para desarrollo local)
cp .env.example .env

# 3. Levantar PostgreSQL con Docker
docker compose up -d

# 4. Instalar dependencias
npm install

# 5. Ejecutar migraciones y seed del super admin inicial
npm run migrate

# 6. Iniciar el servidor con hot reload
npm run dev
```

El servidor arranca en **http://localhost:3000**.

**Verificar que funciona:**
```bash
curl http://localhost:3000/health
# → { "status": "ok", "version": "..." }
```

> **Nota sobre emails:** en desarrollo, si no hay `RESEND_API_KEY` configurada, los tokens de verificación de email y reset de contraseña se devuelven directamente en la respuesta HTTP (no se envían emails). Esto es el comportamiento esperado para desarrollo local.
>
> **Nota sobre Resend en producción:** el proyecto usa Resend SDK para el envío de emails transaccionales. Con el **free trial sin dominio verificado**, Resend solo permite enviar al email del propietario de la cuenta, por lo que el envío real de emails está **deshabilitado** para usuarios genéricos. Para habilitarlo completamente es necesario verificar un dominio propio en el dashboard de Resend.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con hot reload (`tsx watch`) |
| `npm run build` | Compilar TypeScript a `dist/` |
| `npm start` | Iniciar servidor compilado (producción) |
| `npm run typecheck` | Verificar tipos sin compilar |
| `npm run lint` | Linting con ESLint |
| `npm run migrate` | Ejecutar migraciones de base de datos + seed |
| `npm test` | Tests en modo watch |
| `npm run test:unit` | Tests unitarios |
| `npm run test:integration` | Tests de integración (requiere BD) |
| `npm run test:e2e` | Tests E2E con Playwright |
| `npm run test:coverage` | Tests con informe de cobertura |

## Testing

```bash
# Todos los tests (modo watch)
npm test

# Solo unitarios (sin BD)
npm run test:unit

# Integración (requiere docker compose up -d)
npm run test:integration

# Cobertura
npm run test:coverage
```

## Funcionalidades principales

| Área | Funcionalidades |
|------|----------------|
| **Autenticación** | Registro con verificación de email, login con email/password, JWT (access + refresh), rotación de tokens, bloqueo progresivo de cuentas (5 intentos → 15 min, 30 min, 1 h) |
| **OAuth2** | Inicio de sesión con Google y Microsoft (Authorization Code Flow, state JWT anti-CSRF, vinculación de cuentas existentes) |
| **RBAC** | 3 roles de sistema (`USER`, `ADMIN`, `SUPER_ADMIN`) + 4 permisos granulares de admin (`manage_users`, `manage_organizations`, `assign_members`, `view_all_data`) persistidos en PostgreSQL |
| **Organizaciones** | CRUD completo de organizaciones sanitarias (7 tipos), soft-delete, hard-delete |
| **Membresías** | Asignar/eliminar usuarios de organizaciones, cambiar rol dentro de la org (6 roles), listar miembros y organizaciones de un usuario |
| **Email transaccional** | Verificación de cuenta y recuperación de contraseña via Resend SDK; en desarrollo el token se devuelve en la respuesta HTTP |
| **Seguridad** | Rate limiting (5 req/min en auth, 100 req/15 min global), bcrypt (12 rounds), CORS configurable |

## Arquitectura

Cuatro capas con la regla de dependencia apuntando hacia adentro:

```
Interfaces → Application → Domain
     ↓            ↓
Infrastructure ───┘
```

| Capa | Carpeta | Contenido |
|------|---------|-----------|
| **Domain** | `src/domain/` | Entidades (`User`, `Organization`, `OrganizationMembership`, `AdminPermissionGrant`), Value Objects, interfaces de repositorios, errores de dominio |
| **Application** | `src/application/` | 30 casos de uso, DTOs, puertos (interfaces de servicios como `ITokenService`, `IHashingService`) |
| **Infrastructure** | `src/infrastructure/` | Repositorios PostgreSQL e InMemory, servicios (JWT, bcrypt, Resend, OAuth), contenedor DI, config |
| **Interfaces** | `src/interfaces/` | Controllers HTTP, rutas Express, middlewares, validators |

Para la documentación completa del proyecto ver [docs/PROJECT.md](docs/PROJECT.md).
Para diagramas de arquitectura, estructura de carpetas y convenciones de código ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Producción

El backend está desplegado en **Render Free**:
`https://health-care-suite-backend.onrender.com`

Ver [docs/PROJECT.md — Sección 18](docs/PROJECT.md) para detalles del entorno de producción, limitaciones del free tier y variables de entorno requeridas.
