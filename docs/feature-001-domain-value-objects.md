# Feature 001: Domain Value Objects

**Rama:** `feature-001-domain-value-objects`
**Fecha:** 2026-02-01
**Estado:** Completado ✅

## Resumen

Implementación de la capa de dominio siguiendo TDD (Test-Driven Development). Se crearon todos los Value Objects y la entidad User (Aggregate Root) con validación completa.

## Componentes Implementados

### Value Objects

| Componente | Archivo | Tests |
|------------|---------|-------|
| UserId | `src/domain/value-objects/user-id.value-object.ts` | 11 |
| Email | `src/domain/value-objects/email.value-object.ts` | 20 |
| PasswordHash | `src/domain/value-objects/password-hash.value-object.ts` | 10 |
| AccessToken | `src/domain/value-objects/access-token.value-object.ts` | 15 |
| RefreshToken | `src/domain/value-objects/refresh-token.value-object.ts` | 18 |

### Entidades

| Componente | Archivo | Tests |
|------------|---------|-------|
| User (Aggregate Root) | `src/domain/entities/user.entity.ts` | 35 |

**Total: 109 tests**

## Funcionalidades por Componente

### UserId
- Validación de formato UUID
- Factory methods: `create()`, `fromGenerated()`
- Comparación por valor (`equals()`)

### Email
- Validación de formato email
- Normalización (lowercase, trim)
- Longitud máxima: 254 caracteres
- Extracción de `localPart` y `domain`

### PasswordHash
- Validación de longitud mínima (50 caracteres)
- Factory methods: `fromHash()`, `fromNewlyHashed()`
- Protección en `toString()` para logs seguros

### AccessToken
- Validez: 5 horas (18000 segundos)
- Validación de token no vacío
- Verificación de expiración (`isExpired()`)
- Cálculo de tiempo restante (`remainingTimeSeconds()`)

### RefreshToken
- Validez: 3 días (259200 segundos)
- Estados: ACTIVE, ROTATED, REVOKED, EXPIRED
- Soporte para rotación de tokens (`markAsRotated()`)
- Tracking de familia de tokens (`parentTokenId`)
- Validación para uso (`isValidForUse()`)

### User Entity
- Estados: PENDING_VERIFICATION, ACTIVE, SUSPENDED, DEACTIVATED
- Verificación de email (`verifyEmail()`)
- Registro de login (`recordLogin()`)
- Cambio de contraseña (`updatePassword()`)
- Suspensión/Reactivación (`suspend()`, `reactivate()`)
- Inmutabilidad (cada operación retorna nueva instancia)

## Metodología TDD

Cada componente se implementó siguiendo el ciclo:

1. **RED**: Escribir tests que fallen
2. **GREEN**: Implementar código mínimo para pasar
3. **REFACTOR**: Mejorar sin romper tests

## Comandos de Verificación

```bash
# Ejecutar todos los tests del domain
npm run test:unit -- --dir tests/unit/domain

# Ejecutar tests específicos
npx vitest run tests/unit/domain/value-objects/
npx vitest run tests/unit/domain/entities/
```

## Archivos Modificados

```
src/domain/value-objects/
├── user-id.value-object.ts      (modificado)
├── email.value-object.ts        (modificado)
├── password-hash.value-object.ts (modificado)
├── access-token.value-object.ts  (modificado)
└── refresh-token.value-object.ts (modificado)

tests/unit/domain/
├── value-objects/
│   ├── user-id.value-object.test.ts      (creado)
│   ├── email.value-object.test.ts        (modificado)
│   ├── password-hash.value-object.test.ts (creado)
│   ├── access-token.value-object.test.ts  (modificado)
│   └── refresh-token.value-object.test.ts (creado)
└── entities/
    └── user.entity.test.ts               (modificado)
```

## Próximos Pasos

- **Fase 2**: Application Layer (Use Cases)
  - RegisterUserUseCase
  - LoginUserUseCase
  - RefreshSessionUseCase
