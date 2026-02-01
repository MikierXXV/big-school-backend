# Big School Backend

Backend de autenticación para Big School, implementado con Clean Architecture, Arquitectura Hexagonal y Domain-Driven Design.

## Stack Tecnológico

- **Runtime**: Node.js
- **Lenguaje**: TypeScript
- **Tests unitarios**: Vitest
- **Tests E2E**: Playwright
- **Autenticación**: JWT (Access Token + Refresh Token)

## Estructura del Proyecto

```
src/
├── domain/          # Entidades, Value Objects, interfaces de repositorios
├── application/     # Casos de uso, DTOs, puertos (interfaces de servicios)
├── infrastructure/  # Implementaciones de repositorios y servicios
└── interfaces/      # Controllers, rutas, middlewares HTTP
```

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Verificar tipos
npm run typecheck

# Ejecutar tests
npm test

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e
```

## Configuración

1. Copiar `.env.example` a `.env`
2. Configurar las variables de entorno

## Documentación

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para detalles de la arquitectura.

## Estado

Este proyecto contiene la estructura y stubs. La implementación está pendiente.
