# Feature 007: E2E Auth Tests

## Descripcion

Tests End-to-End completos para los endpoints de autenticacion usando Playwright.

## Rama

`feature-007-e2e-auth-tests`

## Estructura de Archivos

```
tests/e2e/
├── auth/
│   ├── register.e2e.ts      # Tests de registro (15 tests)
│   ├── verify-email.e2e.ts  # Tests de verificacion email (7 tests)
│   ├── login.e2e.ts         # Tests de login (12 tests)
│   ├── refresh.e2e.ts       # Tests de refresh token (11 tests)
│   ├── logout.e2e.ts        # Tests de logout (4 tests)
│   └── flows.e2e.ts         # Tests de flujos completos (4 tests)
├── helpers/
│   ├── index.ts             # Barrel export
│   ├── api.helper.ts        # Utilidades HTTP (post, postWithAuth)
│   ├── auth.helper.ts       # Helpers de autenticacion
│   ├── token.helper.ts      # Helpers de tokens
│   └── test-data.helper.ts  # Generadores de datos de prueba
└── types/
    └── index.ts             # Tipos compartidos para tests
```

## Cobertura de Tests

### register.e2e.ts (15 tests)

| Test | Descripcion |
|------|-------------|
| should register a new user successfully | Registro exitoso retorna 201 |
| should return verification token in development | Retorna token de verificacion |
| should generate unique user ID (UUID v4) | ID de usuario es UUID valido |
| should reject duplicate email | Email duplicado retorna 409 |
| should validate required fields - email missing | Validacion campo email |
| should validate required fields - password missing | Validacion campo password |
| should validate required fields - firstName missing | Validacion campo firstName |
| should validate required fields - lastName missing | Validacion campo lastName |
| should validate email format | Formato email invalido |
| should validate password confirmation match | Passwords no coinciden |
| should require terms acceptance | Terms no aceptados |
| should reject password too short | Password muy corto |
| should reject password without uppercase | Sin mayuscula |
| should reject password without lowercase | Sin minuscula |
| should reject password without number | Sin numero |
| should reject password without special character | Sin caracter especial |

### verify-email.e2e.ts (7 tests)

| Test | Descripcion |
|------|-------------|
| should verify email with valid token | Verificacion exitosa |
| should return user data after verification | Retorna datos usuario |
| should reject invalid token | Token invalido |
| should reject empty token | Token vacio |
| should reject malformed token | Token malformado |
| should reject verification for already verified email | Email ya verificado |

### login.e2e.ts (12 tests)

| Test | Descripcion |
|------|-------------|
| should login with valid credentials | Login exitoso |
| should return user data on login | Retorna datos usuario |
| should return access token with correct structure | Estructura accessToken |
| should return refresh token with correct structure | Estructura refreshToken |
| should include device info in session if provided | DeviceInfo opcional |
| should reject invalid password | Password incorrecto |
| should reject non-existent email | Email no existe |
| should not reveal whether email exists or password is wrong | Seguridad: error generico |
| should reject login for unverified user | Usuario no verificado |
| should validate required email | Email requerido |
| should validate required password | Password requerido |

### refresh.e2e.ts (11 tests)

| Test | Descripcion |
|------|-------------|
| should refresh session with valid token | Refresh exitoso |
| should return new access token | Nuevo accessToken |
| should rotate refresh token | Rotacion de refreshToken |
| should return correct token expiration times | Tiempos de expiracion |
| should invalidate old refresh token after rotation | Token anterior invalido |
| SECURITY: should detect token reuse and revoke family | Deteccion de reuso |
| should allow sequential refreshes with new tokens | Refreshes secuenciales |
| should reject invalid refresh token | Token invalido |
| should reject empty refresh token | Token vacio |
| should reject malformed refresh token | Token malformado |
| should validate required refreshToken | RefreshToken requerido |

### logout.e2e.ts (4 tests)

| Test | Descripcion |
|------|-------------|
| should logout successfully with valid token | Logout exitoso |
| should return success message on logout | Mensaje de exito |
| should reject logout without token | Sin token |
| should reject logout with invalid token | Token invalido |

### flows.e2e.ts (4 tests)

| Test | Descripcion |
|------|-------------|
| should complete full authentication lifecycle | Flujo completo: register -> verify -> login -> refresh -> logout |
| should handle multiple refresh cycles | 5 refreshes secuenciales |
| should handle login from multiple devices | Multi-dispositivo |
| should allow re-login after failed login attempts | Recuperacion de errores |

## Comandos de Ejecucion

### Ejecutar Todos los Tests E2E

```bash
npm run test:e2e
```

### Ejecutar con Output Verbose

```bash
npx playwright test --reporter=list
```

### Ejecutar Tests Individuales

```bash
# Register tests
npx playwright test tests/e2e/auth/register.e2e.ts

# Verify email tests
npx playwright test tests/e2e/auth/verify-email.e2e.ts

# Login tests
npx playwright test tests/e2e/auth/login.e2e.ts

# Refresh tests
npx playwright test tests/e2e/auth/refresh.e2e.ts

# Logout tests
npx playwright test tests/e2e/auth/logout.e2e.ts

# Flows tests (complete journeys)
npx playwright test tests/e2e/auth/flows.e2e.ts
```

### Ejecutar Test Especifico por Nombre

```bash
# Ejemplo: solo el test de token reuse
npx playwright test -g "should detect token reuse"

# Ejemplo: solo tests de seguridad
npx playwright test -g "SECURITY"
```

### Ejecutar en Modo Debug

```bash
npx playwright test --debug
```

### Generar Reporte HTML

```bash
npx playwright test --reporter=html
npx playwright show-report
```

## Helpers Disponibles

### test-data.helper.ts

```typescript
generateUniqueEmail()     // Email unico con timestamp
generateValidUserData()   // Datos de registro validos
WEAK_PASSWORDS           // Passwords debiles para tests negativos
VALID_PASSWORD           // Password valido
```

### api.helper.ts

```typescript
post(request, path, data, headers?)           // POST request
postWithAuth(request, path, data, accessToken) // POST con Authorization
get(request, path, headers?)                   // GET request
getWithAuth(request, path, accessToken)        // GET con Authorization
```

### auth.helper.ts

```typescript
registerUser(request, userData?)      // Registrar usuario
verifyUserEmail(request, token)       // Verificar email
createVerifiedUser(request, userData?) // Crear usuario verificado
loginUser(request, email, password)    // Login
createLoggedInUser(request, userData?) // Crear usuario logueado
```

### token.helper.ts

```typescript
refreshSession(request, refreshToken)  // Refresh exitoso (con expect)
attemptRefresh(request, refreshToken)  // Intento de refresh (permite fallo)
```

## Configuracion de Playwright

El archivo `playwright.config.ts` esta configurado para:

- **testDir:** `./tests/e2e`
- **baseURL:** `http://localhost:3000`
- **webServer:** Inicia automaticamente con `npm run dev`
- **Health check:** `/health`
- **Timeout:** 30 segundos por test
- **Retries:** 2 en CI, 0 en local

## Tests de Seguridad

El test mas importante de seguridad es:

```typescript
test('SECURITY: should detect token reuse and revoke family')
```

Este test verifica:
1. Login obtiene token A
2. Refresh con token A genera token B (A queda ROTATED)
3. Atacante intenta usar token A de nuevo
4. Sistema detecta reuso y revoca toda la familia
5. Token B tambien queda invalido

## Notas Tecnicas

- Los tests usan emails unicos con timestamp para evitar colisiones
- El servidor retorna `verificationToken` en desarrollo para facilitar tests
- Access tokens pueden ser identicos si se generan en el mismo segundo (mismo `iat`)
- El sistema no revela si un email existe o no (error generico de credenciales)
