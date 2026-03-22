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

## Arquitectura

Cuatro capas con la regla de dependencia apuntando hacia adentro:

```
Interfaces → Application → Domain
     ↓            ↓
Infrastructure ───┘
```

- **Domain** — Entidades, Value Objects, interfaces de repositorios, errores de dominio
- **Application** — Casos de uso (29), DTOs, puertos (interfaces de servicios)
- **Infrastructure** — Repositorios PostgreSQL/InMemory, servicios (JWT, bcrypt, Resend, OAuth)
- **Interfaces** — Controllers HTTP, rutas, middlewares, validators

Para la documentación completa del proyecto ver [docs/PROJECT.md](docs/PROJECT.md).

## Producción

El backend está desplegado en **Render Free**:
`https://health-care-suite-backend.onrender.com`

Ver [docs/PROJECT.md — Sección 18](docs/PROJECT.md) para detalles del entorno de producción, limitaciones del free tier y variables de entorno requeridas.
