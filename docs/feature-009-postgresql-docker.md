# Feature 009: PostgreSQL + Docker

## Resumen

Implementación de persistencia real con PostgreSQL, dockerización del backend para desarrollo local, y preparación para despliegue en Railway/Render.

---

## Planificación

### Objetivos

1. **Dockerizar** el backend y PostgreSQL en contenedores separados
2. **Implementar** repositorios PostgreSQL para todas las entidades
3. **Configurar** migraciones SQL con node-pg-migrate
4. **Preparar** para despliegue en plataformas cloud (Railway/Render)

### Tecnologías Seleccionadas

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Driver PostgreSQL | `pg` (node-postgres) | Driver nativo, maduro, sin abstracción innecesaria |
| Migraciones | `node-pg-migrate` | Ligero, SQL puro, sin ORM, control total |
| Connection Pool | `pg.Pool` | Incluido en `pg`, connection pooling eficiente |
| Contenedores | Docker + Docker Compose | Estándar de la industria, portable |
| PostgreSQL | `postgres:16-alpine` | Versión estable, imagen ligera |

### Arquitectura de Contenedores

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DESARROLLO LOCAL (Docker Compose)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐      ┌─────────────────────────┐               │
│  │     backend (Node.js)   │      │   postgres (PostgreSQL) │               │
│  │                         │      │                         │               │
│  │  - Express API          │ ───▶ │  - Puerto: 5432         │               │
│  │  - Puerto: 3000         │      │  - DB: big_school       │               │
│  │  - Hot reload (dev)     │      │  - Volumen persistente  │               │
│  │                         │      │                         │               │
│  └─────────────────────────┘      └─────────────────────────┘               │
│           │                                   │                              │
│           ▼                                   ▼                              │
│    host: localhost:3000              host: localhost:5432                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cambios Realizados

### 1. Docker Configuration

| Archivo | Descripción |
|---------|-------------|
| `Dockerfile.dev` | Imagen de desarrollo con hot reload |
| `Dockerfile` | Imagen de producción multi-stage optimizada |
| `.dockerignore` | Exclusiones para builds de Docker |
| `docker-compose.yaml` | Servicios postgres + backend con healthchecks |

### 2. Database Infrastructure

| Archivo | Descripción |
|---------|-------------|
| `src/infrastructure/config/database.config.ts` | Configuración de conexión con soporte DATABASE_URL |
| `src/infrastructure/database/connection.ts` | Pool de conexiones singleton |
| `src/infrastructure/database/index.ts` | Barrel export del módulo |

### 3. Migraciones SQL

| Archivo | Tablas/Índices |
|---------|----------------|
| `migrations/001_create_users_table.sql` | `users` + 3 índices |
| `migrations/002_create_refresh_tokens_table.sql` | `refresh_tokens` + 5 índices |
| `migrations/003_create_password_reset_tokens_table.sql` | `password_reset_tokens` + 3 índices |

### 4. Repositorios PostgreSQL

| Archivo | Métodos Implementados |
|---------|----------------------|
| `postgres-user.repository.ts` | save, update, delete, findById, findByEmail, existsByEmail, findAll |
| `postgres-refresh-token.repository.ts` | save, updateStatus, revoke, revokeAllByUser, revokeFamily, deleteExpired, findById, findByTokenHash, findActiveByUser, countActiveByUser, isActiveToken, findFamilyRootId |
| `postgres-password-reset-token.repository.ts` | save, markAsUsed, updateStatus, revokeAllByUser, deleteExpired, findById, findByTokenHash, findActiveByUserId, hasActiveToken, countRequestsSince |

### 5. Container DI Update

| Archivo | Cambio |
|---------|--------|
| `src/infrastructure/container/container.ts` | Selector `USE_POSTGRES` para elegir entre InMemory y PostgreSQL |

### 6. Package.json Scripts

```json
{
  "migrate": "node-pg-migrate up --migrations-dir migrations --migration-file-language sql",
  "migrate:down": "node-pg-migrate down --migrations-dir migrations --migration-file-language sql",
  "migrate:create": "node-pg-migrate create --migrations-dir migrations --migration-file-language sql"
}
```

---

## Pruebas Realizadas

### 1. TypeScript Compilation

```bash
npm run typecheck
# ✅ Sin errores de tipos
```

### 2. Unit Tests

```bash
npx vitest run
# ✅ 460 tests passed
```

### 3. Docker Build & Start

```bash
docker-compose up -d
# ✅ Contenedores iniciados correctamente
# - big_school_postgres: Healthy
# - big_school_backend: Started
```

### 4. Database Migrations

```bash
docker-compose exec backend npm run migrate
# ✅ 3 migraciones ejecutadas:
# - 001_create_users_table
# - 002_create_refresh_tokens_table
# - 003_create_password_reset_tokens_table
```

### 5. Health Check

```bash
docker-compose exec backend wget -qO- http://localhost:3000/health
# ✅ {"success":true,"data":{"status":"ok",...}}
```

### 6. Flujo Completo de Autenticación

#### 6.1 Registro de Usuario
```bash
# Request
POST /auth/register
{
  "email": "test2@example.com",
  "password": "StrongPass123@abc",
  "passwordConfirmation": "StrongPass123@abc",
  "firstName": "Juan",
  "lastName": "Garcia",
  "acceptTerms": true
}

# Response ✅
{
  "success": true,
  "data": {
    "user": {
      "id": "4ab506e1-54a6-4951-b559-09e9be73216c",
      "email": "test2@example.com",
      "status": "PENDING_VERIFICATION"
    },
    "verificationToken": "eyJhbGc..."
  }
}
```

#### 6.2 Verificación en PostgreSQL
```sql
SELECT id, email, status FROM users;
-- ✅ 1 registro: test2@example.com | PENDING_VERIFICATION
```

#### 6.3 Verificación de Email
```bash
# Request
POST /auth/verify-email
{ "token": "<verification_token>" }

# Response ✅
{
  "success": true,
  "data": {
    "user": { "status": "ACTIVE" }
  }
}
```

#### 6.4 Login
```bash
# Request
POST /auth/login
{
  "email": "test2@example.com",
  "password": "StrongPass123@abc"
}

# Response ✅
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "expiresIn": 18000
    }
  }
}
```

#### 6.5 Verificación de Refresh Token en PostgreSQL
```sql
SELECT id, status, expires_at FROM refresh_tokens;
-- ✅ 1 registro: ACTIVE | 2026-02-11
```

---

## Comandos Docker

### Gestión de Servicios

```bash
# Iniciar todos los servicios
docker-compose up -d

# Iniciar solo PostgreSQL
docker-compose up -d postgres

# Iniciar solo Backend
docker-compose up -d backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (¡BORRA DATOS!)
docker-compose down -v

# Reiniciar un servicio
docker-compose restart backend

# Ver estado de servicios
docker-compose ps
```

### Logs

```bash
# Ver logs de todos los servicios
docker-compose logs

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs postgres

# Ver últimas N líneas
docker-compose logs --tail 50 backend
```

### Ejecución de Comandos

```bash
# Ejecutar comando en contenedor
docker-compose exec backend npm run migrate
docker-compose exec backend npm run typecheck

# Acceder a shell del contenedor
docker-compose exec backend sh
docker-compose exec postgres sh

# Acceder a PostgreSQL CLI
docker-compose exec postgres psql -U big_school_user -d big_school
```

### Queries SQL Útiles

```bash
# Ver usuarios
docker-compose exec postgres psql -U big_school_user -d big_school \
  -c "SELECT id, email, status FROM users;"

# Ver refresh tokens
docker-compose exec postgres psql -U big_school_user -d big_school \
  -c "SELECT id, user_id, status, expires_at FROM refresh_tokens;"

# Ver password reset tokens
docker-compose exec postgres psql -U big_school_user -d big_school \
  -c "SELECT id, user_id, used_at, revoked_at FROM password_reset_tokens;"

# Contar registros
docker-compose exec postgres psql -U big_school_user -d big_school \
  -c "SELECT 'users' as table_name, COUNT(*) FROM users
      UNION ALL SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens
      UNION ALL SELECT 'password_reset_tokens', COUNT(*) FROM password_reset_tokens;"
```

### Build y Reconstrucción

```bash
# Reconstruir imagen del backend
docker-compose build backend

# Reconstruir sin cache
docker-compose build --no-cache backend

# Reconstruir y reiniciar
docker-compose up -d --build backend
```

### Limpieza

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes sin usar
docker image prune

# Eliminar volúmenes sin usar
docker volume prune

# Limpieza completa (¡CUIDADO!)
docker system prune -a --volumes
```

### Migraciones

```bash
# Ejecutar migraciones pendientes
docker-compose exec backend npm run migrate

# Revertir última migración
docker-compose exec backend npm run migrate:down

# Crear nueva migración
docker-compose exec backend npm run migrate:create -- nombre_migracion
```

---

## Variables de Entorno

### Desarrollo Local (docker-compose.yaml)

```yaml
environment:
  NODE_ENV: development
  PORT: 3000
  HOST: "0.0.0.0"  # IMPORTANTE: Necesario para aceptar conexiones desde el host
  DATABASE_HOST: postgres
  DATABASE_PORT: 5432
  DATABASE_NAME: big_school
  DATABASE_USER: big_school_user
  DATABASE_PASSWORD: local_dev_password_123
  DATABASE_SSL: "false"
  DATABASE_URL: postgresql://big_school_user:password@postgres:5432/big_school
  USE_POSTGRES: "true"
  JWT_ACCESS_SECRET: dev_access_secret_min_32_characters_here_ok
  JWT_REFRESH_SECRET: dev_refresh_secret_min_32_characters_here_ok
  JWT_PASSWORD_RESET_SECRET: dev_reset_secret_min_32_characters_here_ok
  HASH_SALT_ROUNDS: 12
```

### Producción (Railway/Render)

```bash
# Railway/Render proporcionan DATABASE_URL automáticamente
DATABASE_URL=postgresql://user:pass@host:5432/database?sslmode=require

# Variables adicionales requeridas
NODE_ENV=production
PORT=3000
USE_POSTGRES=true
JWT_ACCESS_SECRET=<secret-32-chars-min>
JWT_REFRESH_SECRET=<secret-32-chars-min>
JWT_PASSWORD_RESET_SECRET=<secret-32-chars-min>
HASH_SALT_ROUNDS=12
```

---

## Notas de Producción

### SSL/TLS

El sistema detecta automáticamente el `sslmode` en DATABASE_URL:

```typescript
// database.config.ts
const sslmode = parsed.searchParams.get('sslmode');
const requireSsl = sslmode === 'require' || sslmode === 'verify-full';
ssl: requireSsl ? { rejectUnauthorized: false } : false
```

### Selector de Repositorios

El contenedor DI selecciona automáticamente según `USE_POSTGRES`:

```typescript
// container.ts
if (usePostgres) {
  userRepository = new PostgresUserRepository(pool);
  // ...
} else {
  userRepository = new InMemoryUserRepository();
  // ...
}
```

---

## Troubleshooting

### Error: "The server does not support SSL connections"

**Causa:** DATABASE_URL sin `sslmode` en desarrollo local.

**Solución:** No incluir `sslmode=require` en DATABASE_URL para desarrollo:
```
DATABASE_URL: postgresql://user:pass@postgres:5432/big_school
```

### Error: "Connection refused"

**Causa:** PostgreSQL no está listo.

**Solución:** Verificar healthcheck:
```bash
docker-compose ps
# postgres debe mostrar "(healthy)"
```

### Migraciones no se ejecutan

**Causa:** node-pg-migrate no encuentra DATABASE_URL.

**Solución:** Verificar que DATABASE_URL esté configurado:
```bash
docker-compose exec backend env | grep DATABASE
```

### Backend no responde desde el host (Windows/Mac)

**Causa:** El servidor está escuchando en `localhost` dentro del contenedor, no en `0.0.0.0`.

**Síntoma:** Docker muestra contenedores "Up", pero `curl http://localhost:3000/health` falla.

**Solución:** Agregar `HOST: "0.0.0.0"` en las variables de entorno del backend:
```yaml
environment:
  HOST: "0.0.0.0"  # Acepta conexiones desde cualquier interfaz
```

Después de modificar, recrear el contenedor:
```bash
docker-compose up -d backend
```

---

## Fecha de Implementación

- **Fecha:** 2026-02-08
- **Tests Pasados:** 460 unitarios + 67 E2E automatizados
- **Estado:** ✅ Completado y funcional
