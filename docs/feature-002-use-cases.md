# Feature 002: Application Layer Use Cases

**Rama:** `feature-002-use-cases`
**Fecha:** 2026-02-03
**Estado:** Completado ✅

## Resumen

Implementación de la capa de aplicación siguiendo TDD (Test-Driven Development). Se implementaron los tres casos de uso principales de autenticación con validación completa, manejo de errores y seguridad.

## Componentes Implementados

### Use Cases

| Componente | Archivo | Tests |
|------------|---------|-------|
| RegisterUserUseCase | `src/application/use-cases/auth/register-user.use-case.ts` | 19 |
| LoginUserUseCase | `src/application/use-cases/auth/login-user.use-case.ts` | 16 |
| RefreshSessionUseCase | `src/application/use-cases/auth/refresh-session.use-case.ts` | 18 |

**Total: 53 tests de Application Layer**
**Total acumulado: 162 tests (Domain + Application)**

## Funcionalidades por Use Case

### RegisterUserUseCase
- Validación de contraseñas coincidentes
- Validación de aceptación de términos
- Validación de fortaleza de contraseña:
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número
  - Al menos un carácter especial
- Verificación de email único
- Hash de contraseña antes de guardar
- Usuario creado con estado `PENDING_VERIFICATION`
- Logging de operaciones

### LoginUserUseCase
- Verificación de credenciales
- Verificación de estado del usuario (ACTIVE requerido)
- Generación de Access Token (5 horas)
- Generación de Refresh Token (3 días)
- Almacenamiento de Refresh Token en BD
- Actualización de `lastLoginAt`
- Seguridad: mensaje genérico para credenciales inválidas
- Logging de intentos de login

### RefreshSessionUseCase
- Validación de Refresh Token
- **Rotación de tokens** (seguridad):
  - Token antiguo marcado como `ROTATED`
  - Nuevo token generado con referencia al padre
- **Detección de reuso** (CRÍTICO):
  - Si se detecta uso de token `ROTATED` → compromiso
  - Revocación de toda la familia de tokens
  - Log de evento de seguridad
- Verificación de usuario activo
- Verificación de expiración
- Logging de operaciones

## Metodología TDD

Cada use case se implementó siguiendo el ciclo:

1. **RED**: Escribir tests que fallen (mocks completos)
2. **GREEN**: Implementar código mínimo para pasar
3. **REFACTOR**: Mejorar sin romper tests

## Errores Manejados

### Application Errors
- `PasswordMismatchError`: Contraseñas no coinciden
- `TermsNotAcceptedError`: Términos no aceptados

### Domain Errors (Authentication)
- `InvalidCredentialsError`: Email o contraseña incorrectos
- `WeakPasswordError`: Contraseña no cumple requisitos
- `InvalidRefreshTokenError`: Token inválido o malformado
- `RefreshTokenExpiredError`: Token expirado
- `RefreshTokenRevokedError`: Token revocado
- `RefreshTokenReuseDetectedError`: Reuso detectado (seguridad)

### Domain Errors (User)
- `UserAlreadyExistsError`: Email ya registrado
- `UserNotFoundError`: Usuario no existe
- `UserNotActiveError`: Usuario suspendido/desactivado

## Comandos de Verificación

```bash
# Ejecutar todos los tests de application
npx vitest run tests/unit/application/

# Ejecutar tests específicos
npx vitest run tests/unit/application/use-cases/register-user.use-case.test.ts
npx vitest run tests/unit/application/use-cases/login-user.use-case.test.ts
npx vitest run tests/unit/application/use-cases/refresh-session.use-case.test.ts

# Ejecutar todos los tests (domain + application)
npx vitest run tests/unit/
```

## Archivos Modificados/Creados

```
src/application/use-cases/auth/
├── register-user.use-case.ts     (implementado)
├── login-user.use-case.ts        (implementado)
└── refresh-session.use-case.ts   (implementado)

src/application/ports/
└── token.service.port.ts         (fix exactOptionalPropertyTypes)

tests/unit/application/use-cases/
├── register-user.use-case.test.ts     (implementado)
├── login-user.use-case.test.ts        (implementado)
└── refresh-session.use-case.test.ts   (implementado)
```

## Dependencias (Inyección)

Cada use case recibe sus dependencias por constructor:

### RegisterUserUseCase
- `userRepository`: Persistencia de usuarios
- `hashingService`: Hash de contraseñas
- `uuidGenerator`: Generación de IDs
- `dateTimeService`: Fecha/hora
- `logger`: Logging

### LoginUserUseCase
- `userRepository`: Persistencia de usuarios
- `refreshTokenRepository`: Persistencia de tokens
- `tokenService`: Generación de tokens
- `hashingService`: Verificación de contraseñas
- `uuidGenerator`: Generación de IDs
- `dateTimeService`: Fecha/hora
- `logger`: Logging

### RefreshSessionUseCase
- `userRepository`: Persistencia de usuarios
- `refreshTokenRepository`: Persistencia de tokens
- `tokenService`: Generación/validación de tokens
- `uuidGenerator`: Generación de IDs
- `dateTimeService`: Fecha/hora
- `logger`: Logging

## Próximos Pasos

- **Fase 4**: Infrastructure Layer
  - Servicios: JWT, Bcrypt, UUID Generator
  - Repositorios: PostgreSQL / In-Memory
- **Fase 5**: Interfaces Layer
  - Controllers HTTP
  - Validators
  - Middlewares
- **Fase 6**: Tests E2E
