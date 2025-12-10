# Sistema de Autenticación JWT

## Uso

### Endpoints de Autenticación

#### 1. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

**Respuesta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN"
  }
}
```

#### 2. Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Logout
```http
POST /auth/logout
Authorization: Bearer {accessToken}
```

**Respuesta:** 204 No Content

### Proteger Rutas

#### Proteger con JWT (usuario autenticado)
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards';
import { CurrentUser } from './auth/decorators';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtectedData(@CurrentUser() user) {
    return { message: 'Datos protegidos', user };
  }
}
```

#### Proteger con Roles
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from './auth/guards';
import { Roles, CurrentUser } from './auth/decorators';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getDashboard(@CurrentUser() user) {
    return { message: 'Dashboard de admin', user };
  }

  @Get('super-admin-only')
  @Roles(UserRole.SUPER_ADMIN)
  getSuperAdminData(@CurrentUser('userId') userId: string) {
    return { message: 'Solo super admin', userId };
  }
}
```

### Obtener Usuario Actual

```typescript
// Obtener todo el objeto user
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: CurrentUserPayload) {
  return user;
}

// Obtener solo el userId
@Get('my-id')
@UseGuards(JwtAuthGuard)
getMyId(@CurrentUser('userId') userId: string) {
  return { userId };
}

// Obtener solo el email
@Get('my-email')
@UseGuards(JwtAuthGuard)
getMyEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

## Roles Disponibles

Definidos en `prisma/schema.prisma`:

```prisma
enum UserRole {
  SUPER_ADMIN  // Acceso total
  ADMIN        // Administrador
  USER         // Usuario estándar
  READONLY     // Solo lectura
}
```

## Rate Limiting

### Global
- **100 requests por minuto** por IP (configurado en `app.module.ts`)

### Login
- **5 intentos por minuto** por IP (configurado en `auth.controller.ts`)

### Personalizar Rate Limit

```typescript
import { Throttle } from '@nestjs/throttler';

@Post('custom-endpoint')
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests por minuto
customEndpoint() {
  return { message: 'Custom rate limit' };
}
```

## Mejores Prácticas de Seguridad

1. **Nunca commitear** el archivo `.env` con secrets reales
2. **Rotar secrets** regularmente en producción
3. **Usar HTTPS** en producción
4. **Implementar refresh token rotation** (opcional, más seguro)
5. **Monitorear intentos de login fallidos**
6. **Implementar 2FA** para usuarios críticos
7. **Logs de auditoría** para acciones sensibles

## Credenciales por Defecto

**SOLO PARA DESARROLLO**

- Email: `admin@example.com`
- Password: `Admin123!`

**Cambiar inmediatamente en producción**

## Testing con cURL

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Guardar tokens
ACCESS_TOKEN="tu_access_token_aqui"
REFRESH_TOKEN="tu_refresh_token_aqui"

# Acceder a ruta protegida
curl http://localhost:3000/protected \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Refresh token
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Troubleshooting

### Error: "JWT_SECRET is not defined"
- Verificar que `.env` existe y tiene `JWT_SECRET` y `JWT_REFRESH_SECRET`
- Reiniciar el servidor después de modificar `.env`

### Error: "Credenciales inválidas"
- Verificar que el usuario existe en la DB
- Verificar que `isActive: true`
- Verificar que la contraseña es correcta

### Error: "Refresh token inválido"
- El refresh token puede haber expirado (7 días)
- El usuario puede haber hecho logout
- Hacer login nuevamente

## Estructura de Archivos

```
src/auth/
├── auth.module.ts              # Módulo principal
├── auth.service.ts             # Lógica de autenticación
├── auth.controller.ts          # Endpoints REST
├── dto/
│   ├── login.dto.ts           # Validación de login
│   ├── refresh-token.dto.ts   # Validación de refresh
│   └── index.ts
├── guards/
│   ├── jwt-auth.guard.ts      # Guard de autenticación
│   ├── roles.guard.ts         # Guard de roles
│   └── index.ts
├── strategies/
│   └── jwt.strategy.ts        # Estrategia Passport JWT
└── decorators/
    ├── roles.decorator.ts     # @Roles()
    ├── current-user.decorator.ts  # @CurrentUser()
    └── index.ts
```
