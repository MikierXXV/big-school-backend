# Feature 008: Password Reset

## Resumen Ejecutivo

Implementación del flujo completo de recuperación de contraseña mediante token JWT de un solo uso, permitiendo a usuarios que han olvidado su contraseña restablecerla de forma segura.

---

## Caso de Uso

### Descripción

Como **usuario registrado** que ha olvidado su contraseña, quiero poder solicitar un enlace de recuperación para restablecer mi contraseña y recuperar el acceso a mi cuenta.

### Actores (Stakeholders)

| Actor | Rol | Interés |
|-------|-----|---------|
| **Usuario Final** | Actor principal | Recuperar acceso a su cuenta |
| **Sistema de Autenticación** | Sistema | Validar identidad y gestionar tokens |
| **Servicio de Email** | Sistema externo | Entregar token al usuario (futuro) |
| **Equipo de Seguridad** | Stakeholder interno | Garantizar que el proceso sea seguro |
| **Soporte Técnico** | Stakeholder interno | Asistir usuarios con problemas |

### Flujo Principal

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE PASSWORD RESET                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuario → POST /auth/password-reset { email }               │
│     └─► Sistema genera token JWT (30 min validez)               │
│     └─► Sistema guarda hash SHA-256 del token                   │
│     └─► Respuesta: 200 OK (mensaje genérico)                    │
│                                                                  │
│  2. Usuario recibe token (dev: en respuesta / prod: por email)  │
│                                                                  │
│  3. Usuario → POST /auth/password-reset/confirm                 │
│     { token, newPassword, passwordConfirmation }                │
│     └─► Sistema valida token (firma, expiración, no usado)      │
│     └─► Sistema valida fortaleza de nueva contraseña            │
│     └─► Sistema actualiza contraseña hasheada                   │
│     └─► Sistema marca token como usado                          │
│     └─► Sistema revoca todas las sesiones activas               │
│     └─► Respuesta: 200 OK                                       │
│                                                                  │
│  4. Usuario puede hacer login con nueva contraseña              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Reglas de Negocio

| ID | Regla | Descripción |
|----|-------|-------------|
| **RN-01** | Validez del token | Token válido por 30 minutos (1800 segundos) |
| **RN-02** | Token de un solo uso | Una vez usado, el token se invalida permanentemente |
| **RN-03** | Invalidación de tokens anteriores | Nueva solicitud revoca todos los tokens previos del usuario |
| **RN-04** | Validación de password | Mismas reglas que registro: 8+ chars, mayúscula, minúscula, número, carácter especial |
| **RN-05** | No revelar existencia de email | Respuesta genérica siempre (previene enumeración) |
| **RN-06** | Revocación de sesiones | Tras reset exitoso, se revocan todas las sesiones activas |
| **RN-07** | Usuarios elegibles | Solo usuarios con status ACTIVE o PENDING_VERIFICATION |
| **RN-08** | Almacenamiento seguro | Solo se guarda hash SHA-256 del token, nunca el valor |

---

## Requisitos de Seguridad

### Generación del Token
- JWT firmado con secret dedicado (`JWT_PASSWORD_RESET_SECRET`)
- Payload: `{ userId, email, purpose: 'password_reset', jti (tokenId) }`
- Expiración: 30 minutos (`exp` claim)

### Almacenamiento
- Hash SHA-256 del token en repositorio
- Campos: `id`, `userId`, `tokenHash`, `createdAt`, `expiresAt`, `usedAt`

### Validación
1. Verificar firma JWT
2. Verificar expiración
3. Verificar `purpose === 'password_reset'`
4. Buscar por hash en BD → verificar existe y no usado
5. Verificar userId del token coincide con usuario

---

## Componentes Implementados

### Domain Layer
- `PasswordResetTokenExpiredError` - Error de token expirado
- `PasswordResetTokenAlreadyUsedError` - Error de token ya usado
- `InvalidPasswordResetTokenError` - Error de token inválido
- `PasswordResetTokenRepository` - Interfaz del repositorio

### Application Layer
- `RequestPasswordResetUseCase` - Solicitar reset de contraseña
- `ConfirmPasswordResetUseCase` - Confirmar reset con token
- DTOs: `RequestPasswordResetRequestDto`, `ConfirmPasswordResetRequestDto`

### Infrastructure Layer
- `InMemoryPasswordResetTokenRepository` - Implementación in-memory
- Extensión de `JwtTokenService` para tokens de password reset

### Interfaces Layer
- Validators: `validateRequestPasswordResetRequest`, `validateConfirmPasswordResetRequest`
- Controller: `AuthController.requestPasswordReset()`, `AuthController.confirmPasswordReset()`
- Rutas: `POST /auth/password-reset`, `POST /auth/password-reset/confirm`

### Tests
- Tests unitarios para use cases (~22 tests)
- Tests unitarios para repositorio (~8 tests)
- Tests E2E completos (~15 tests)

---

## Endpoints API

### POST /auth/password-reset

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If this email exists, you will receive reset instructions",
  "data": {
    "resetToken": "eyJhbG..." // Solo en desarrollo
  }
}
```

### POST /auth/password-reset/confirm

**Request:**
```json
{
  "token": "eyJhbG...",
  "newPassword": "NewSecureP@ss123",
  "passwordConfirmation": "NewSecureP@ss123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

---

## Variables de Entorno

```env
JWT_PASSWORD_RESET_SECRET=your_password_reset_secret_min_32_chars
```

---

## Verificación

```bash
# Tests unitarios
npx vitest run tests/unit/application/use-cases/request-password-reset.use-case.test.ts
npx vitest run tests/unit/application/use-cases/confirm-password-reset.use-case.test.ts

# Tests E2E
npm run test:e2e -- tests/e2e/auth/password-reset.e2e.ts

# Todos los tests
npm test
```

---

## Historial de Cambios

| Fecha | Versión | Descripción |
|-------|---------|-------------|
| 2026-02-07 | 1.0.0 | Implementación inicial completa |
