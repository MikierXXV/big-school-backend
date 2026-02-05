# Feature 006: Email Verification Endpoint

## Overview

Implementación del endpoint de verificación de email que permite a los usuarios activar su cuenta después del registro.

## Flujo de Usuario

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│  Register   │────▶│ Verify Email │────▶│    Login    │────▶│   Refresh   │
│  (PENDING)  │     │   (ACTIVE)   │     │  (tokens)   │     │  (rotate)   │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
```

## Endpoints

### POST /auth/register
Registra un nuevo usuario con estado `PENDING_VERIFICATION`.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "passwordConfirmation": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "acceptTerms": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "User registered successfully. Please verify your email.",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "status": "PENDING_VERIFICATION",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "requiresEmailVerification": true,
      "verificationToken": "eyJhbG..." // Solo en desarrollo
    }
  }
}
```

### POST /auth/verify-email
Verifica el email del usuario y cambia su estado a `ACTIVE`.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Email verified successfully",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "status": "ACTIVE"
    }
  }
}
```

### POST /auth/login
Autentica al usuario (requiere email verificado).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Login successful",
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbG...",
      "tokenType": "Bearer",
      "expiresIn": 18000,
      "expiresAt": "2024-01-15T15:00:00.000Z",
      "refreshToken": "eyJhbG...",
      "refreshExpiresIn": 259200
    }
  }
}
```

### POST /auth/refresh
Renueva los tokens usando refresh token rotation.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Session refreshed successfully",
    "tokens": {
      "accessToken": "eyJhbG...",
      "tokenType": "Bearer",
      "expiresIn": 18000,
      "expiresAt": "...",
      "refreshToken": "eyJhbG...",
      "refreshExpiresIn": 259200
    }
  }
}
```

## Errores

| Código | Descripción |
|--------|-------------|
| `DOMAIN_INVALID_VERIFICATION_TOKEN` | Token malformado o inválido |
| `DOMAIN_VERIFICATION_TOKEN_EXPIRED` | Token expirado |
| `DOMAIN_EMAIL_ALREADY_VERIFIED` | Email ya verificado |
| `DOMAIN_USER_NOT_FOUND` | Usuario no existe |
| `DOMAIN_INVALID_CREDENTIALS` | Credenciales inválidas o email no verificado |
| `DOMAIN_INVALID_REFRESH_TOKEN` | Refresh token inválido |

## Archivos Implementados

### Application Layer
- `src/application/use-cases/auth/verify-email.use-case.ts`
- `src/application/dtos/auth/verify-email.dto.ts`
- `src/application/use-cases/auth/register-user.use-case.ts` (modificado)

### Domain Layer
- `src/domain/errors/authentication.errors.ts` (nuevos errores)

### Infrastructure Layer
- `src/infrastructure/container/container.ts` (modificado)
- `src/infrastructure/persistence/in-memory/in-memory-refresh-token.repository.ts` (fix hash)
- `src/infrastructure/services/jwt-token.service.ts` (fix ESM import)

### Interfaces Layer
- `src/interfaces/http/controllers/auth.controller.ts` (modificado)
- `src/interfaces/http/validators/auth.validators.ts` (modificado)
- `src/interfaces/http/app.factory.ts` (modificado)

### Tests
- `tests/unit/application/use-cases/verify-email.use-case.test.ts` (16 tests)

## Testing con PowerShell

### Flujo Completo (copiar y ejecutar en orden)

```powershell
# 1. REGISTRO
$reg = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"user@test.com","password":"Test123!@#","passwordConfirmation":"Test123!@#","firstName":"Ana","lastName":"Garcia","acceptTerms":true}'; Write-Host "1. Registrado: $($reg.data.user.email) - Status: $($reg.data.user.status)"

# 2. VERIFICAR EMAIL
$verify = Invoke-RestMethod -Uri "http://localhost:3000/auth/verify-email" -Method POST -ContentType "application/json" -Body "{`"token`":`"$($reg.data.user.verificationToken)`"}"; Write-Host "2. Verificado: $($verify.data.user.status)"

# 3. LOGIN
$login = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"user@test.com","password":"Test123!@#"}'; Write-Host "3. Login OK - User: $($login.data.user.email)"

# 4. REFRESH
$refresh = Invoke-RestMethod -Uri "http://localhost:3000/auth/refresh" -Method POST -ContentType "application/json" -Body "{`"refreshToken`":`"$($login.data.tokens.refreshToken)`"}"; Write-Host "4. Refresh OK - Nuevo token obtenido"

# 5. LOGOUT
$logout = Invoke-RestMethod -Uri "http://localhost:3000/auth/logout" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer $($login.data.tokens.accessToken)"} -Body '{}'; Write-Host "5. Logout: $($logout.data.message)"
```

### Resultado Esperado

```
1. Registrado: user@test.com - Status: PENDING_VERIFICATION
2. Verificado: ACTIVE
3. Login OK - User: user@test.com
4. Refresh OK - Nuevo token obtenido
5. Logout: Logged out successfully
```

## Notas de Implementación

### Token de Verificación
- Se genera como AccessToken con claim `purpose: 'email_verification'`
- Validez: 5 horas (mismo que access token)
- En desarrollo: se incluye en la respuesta de registro
- En producción: se enviaría por email

### Refresh Token Rotation
- Cada refresh genera un nuevo par de tokens
- El token anterior se marca como `ROTATED`
- Si se detecta reuso de token rotado → se revoca toda la familia (seguridad)

### Hash de Tokens
- Los refresh tokens se almacenan hasheados (SHA256)
- Importante: el repositorio In-Memory debe usar el mismo algoritmo que `JwtTokenService.hashRefreshToken()`

## Tests

```bash
# Ejecutar tests de la feature
npx vitest run tests/unit/application/use-cases/verify-email.use-case.test.ts

# Ejecutar todos los tests unitarios
npx vitest run tests/unit

# Total: 363 tests passing
```
