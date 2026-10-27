# FleetCore API

API REST para gestionar el mantenimiento de la flota de vehículos de **FleetCore**: vehículos, mecánicos, talleres y el ciclo de vida completo de los mantenimientos preventivos y correctivos.

Construida con **NestJS**, **TypeScript**, **TypeORM**, **PostgreSQL** y **JWT**.

---

## Información del coder

| Campo  | Valor                 |
| ------ | --------------------- |
| Nombre | `Daniel Mendoza`  |         |
| Correo | `danielmendoza1515@gmail.com` |

---

## Documentación Swagger

Con la aplicación corriendo:

**http://localhost:3000/api/docs**

Para probar endpoints protegidos:

1. Ejecuta `POST /api/auth/login` con alguna de las [credenciales de prueba](#credenciales-de-prueba).
2. Copia el `accessToken` de la respuesta.
3. Pulsa **Authorize** → casilla **bearer** → pega el token (sin escribir "Bearer").
4. Para el endpoint de integraciones, pega la API Key en la casilla **x-api-key**.

---

## Tecnologías

- Node.js 22+ y NestJS
- TypeScript
- PostgreSQL 16 + TypeORM
- JWT (`@nestjs/jwt`) y bcrypt para el hash de contraseñas
- class-validator / class-transformer
- Swagger (`@nestjs/swagger`)
- Jest
- Docker y Docker Compose

---

## Instalación y ejecución local

### Requisitos previos

- Node.js 22 o superior
- Docker y Docker Compose (para PostgreSQL)

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/TU_USUARIO/fleetcore-api.git
cd fleetcore-api
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Completa los valores del `.env`:

| Variable         | Descripción                                                  | Ejemplo                      |
| ---------------- | ------------------------------------------------------------ | ---------------------------- |
| `PORT`           | Puerto de la API                                             | `3000`                       |
| `DB_HOST`        | Host de PostgreSQL (`localhost` si la API corre fuera de Docker) | `localhost`              |
| `DB_PORT`        | Puerto de PostgreSQL expuesto por Docker                     | `5435`                       |
| `DB_USERNAME`    | Usuario de la base de datos                                  | `fleetcore`                  |
| `DB_PASSWORD`    | Contraseña de la base de datos                               | `cambia_esta_clave`          |
| `DB_DATABASE`    | Nombre de la base de datos                                   | `fleetcore_db`               |
| `DB_SYNCHRONIZE` | Crea/actualiza las tablas desde las entidades                | `true`                       |
| `DB_LOGGING`     | Muestra el SQL ejecutado en consola                          | `false`                      |
| `JWT_SECRET`     | Clave para firmar los tokens                                 | `una_clave_larga_y_aleatoria` |
| `JWT_EXPIRES_IN` | Tiempo de vida del token                                     | `1h`                         |
| `API_KEY`        | Clave para integraciones externas (header `x-api-key`)       | `clave_integraciones`        |

### 3. Levantar PostgreSQL

```bash
docker compose up -d postgres
```

### 4. Poblar la base de datos (seeder)

```bash
npm run seed
```

El seeder es **idempotente**: puede ejecutarse varias veces sin duplicar registros.

> Detén `npm run start:dev` antes de ejecutar el seeder, ya que ambos compilan en la carpeta `dist`.

### 5. Iniciar la API

```bash
npm run start:dev
```

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs

---

## Ejecución con Docker (API + PostgreSQL)

`docker-compose.yml` levanta la API y PostgreSQL en una red interna (`fleetcore_network`) con un volumen para persistir los datos (`fleetcore_data`).

```bash
cp .env.example .env          # y completa los valores
docker compose up -d --build
docker compose exec api npm run seed:prod
```

Dentro de Docker la API se conecta a la base de datos por el nombre del servicio (`postgres:5432`); el `docker-compose.yml` sobrescribe `DB_HOST` y `DB_PORT` automáticamente.

Para detener todo:

```bash
docker compose down        # conserva los datos
docker compose down -v     # borra también el volumen de datos
```

---

## Credenciales de prueba

Creadas por el seeder:

| Rol        | Correo                   | Contraseña    | Mecánico vinculado |
| ---------- | ------------------------ | ------------- | ------------------ |
| ADMIN      | `admin@fleetcore.com`    | `Admin123!`   | —                  |
| TECHNICIAN | `tecnico1@fleetcore.com` | `Tecnico123!` | Carlos Pérez       |
| TECHNICIAN | `tecnico2@fleetcore.com` | `Tecnico123!` | Laura Gómez        |

**API Key** para integraciones: el valor de `API_KEY` en tu `.env`.

### Datos sembrados

| Entidad        | Registros                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------ |
| Usuarios       | 1 ADMIN, 2 TECHNICIAN                                                                      |
| Mecánicos      | Carlos Pérez (activo), Laura Gómez (activa), Jorge Ramírez (inactivo)                      |
| Talleres       | Taller Centro (activo), Taller Norte (inactivo)                                            |
| Vehículos      | `ABC123` y `DEF456` (AVAILABLE), `GHI789` (IN_MAINTENANCE), `JKL012` (INACTIVE)            |
| Mantenimientos | 2 COMPLETED de `ABC123` (historial) y 1 IN_PROGRESS de `GHI789`                            |

---

## Roles y permisos

| Rol            | Puede                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **ADMIN**      | Gestionar usuarios, vehículos, mecánicos, talleres y mantenimientos; consultar historiales y auditorías.                                |
| **TECHNICIAN** | Ver sus mantenimientos asignados y el taller de cada uno, consultar talleres activos y actualizar el estado de sus mantenimientos.      |

- El registro público (`POST /api/auth/register`) crea usuarios **TECHNICIAN**.
- Los usuarios **ADMIN** los crea otro ADMIN (`POST /api/users`) o el seeder.

---

## Endpoints

Todas las rutas usan el prefijo `/api`. Salvo las marcadas como públicas o con API Key, requieren `Authorization: Bearer <token>`.

### Auth (públicos)

| Método | Ruta             | Descripción                    |
| ------ | ---------------- | ------------------------------ |
| POST   | `/auth/register` | Registro de técnico            |
| POST   | `/auth/login`    | Inicio de sesión, devuelve JWT |

### Usuarios

| Método | Ruta        | Rol   | Descripción                      |
| ------ | ----------- | ----- | -------------------------------- |
| GET    | `/users/me` | Todos | Perfil del usuario autenticado   |
| GET    | `/users`    | ADMIN | Listar usuarios                  |
| POST   | `/users`    | ADMIN | Crear usuario con cualquier rol  |

### Vehículos (ADMIN)

| Método | Ruta                       | Descripción                                |
| ------ | -------------------------- | ------------------------------------------ |
| POST   | `/vehicles`                | Registrar vehículo                         |
| GET    | `/vehicles?status=`        | Listar (filtro opcional por estado)        |
| GET    | `/vehicles/:idOrPlate`     | Consultar por id o por placa               |
| PATCH  | `/vehicles/:id`            | Actualizar                                 |
| PATCH  | `/vehicles/:id/activate`   | Reactivar vehículo inactivo                |
| DELETE | `/vehicles/:id`            | Inactivación lógica (no borra el registro) |

### Talleres

| Método | Ruta                         | Rol               | Descripción                    |
| ------ | ---------------------------- | ----------------- | ------------------------------ |
| POST   | `/workshops`                 | ADMIN             | Registrar taller               |
| GET    | `/workshops`                 | ADMIN, TECHNICIAN | Listar talleres activos        |
| GET    | `/workshops/all`             | ADMIN             | Listar todos                   |
| GET    | `/workshops/:id`             | ADMIN, TECHNICIAN | Consultar taller               |
| PATCH  | `/workshops/:id`             | ADMIN             | Actualizar                     |
| PATCH  | `/workshops/:id/activate`    | ADMIN             | Activar                        |
| PATCH  | `/workshops/:id/deactivate`  | ADMIN             | Inactivar                      |

### Mecánicos (ADMIN)

| Método | Ruta                         | Descripción                                 |
| ------ | ---------------------------- | ------------------------------------------- |
| POST   | `/mechanics`                 | Registrar mecánico (opcional: `userId`)     |
| GET    | `/mechanics`                 | Listar todos                                |
| GET    | `/mechanics/:id`             | Consultar mecánico                          |
| PATCH  | `/mechanics/:id`             | Actualizar                                  |
| PATCH  | `/mechanics/:id/activate`    | Activar                                     |
| PATCH  | `/mechanics/:id/deactivate`  | Inactivar (conserva su historial)           |

### Mantenimientos

| Método | Ruta                                       | Rol               | Descripción                                 |
| ------ | ------------------------------------------ | ----------------- | ------------------------------------------- |
| POST   | `/maintenances`                            | ADMIN             | Crear (estado inicial `SCHEDULED`)          |
| GET    | `/maintenances?status=`                    | ADMIN             | Todos                                       |
| GET    | `/maintenances/active`                     | ADMIN             | Activos (`SCHEDULED` / `IN_PROGRESS`)       |
| GET    | `/maintenances/me`                         | TECHNICIAN        | Mis mantenimientos asignados                |
| GET    | `/maintenances/vehicle/:vehicleId`         | ADMIN             | Mantenimientos de un vehículo               |
| GET    | `/maintenances/vehicle/:vehicleId/history` | ADMIN             | Historial (`COMPLETED`) de un vehículo      |
| GET    | `/maintenances/mechanic/:mechanicId`       | ADMIN             | Asignados a un mecánico                     |
| GET    | `/maintenances/:id`                        | ADMIN, TECHNICIAN | Detalle (el técnico solo ve los suyos)      |
| GET    | `/maintenances/:id/logs`                   | ADMIN             | Auditoría de cambios de estado              |
| PATCH  | `/maintenances/:id/status`                 | ADMIN, TECHNICIAN | Cambiar estado                              |

### Integraciones externas (header `x-api-key`)

| Método | Ruta                                          | Descripción                                    |
| ------ | --------------------------------------------- | ---------------------------------------------- |
| GET    | `/integrations/vehicles/:plate/maintenances`  | Vehículo e historial de mantenimientos         |

```bash
curl -H "x-api-key: TU_API_KEY" http://localhost:3000/api/integrations/vehicles/ABC123/maintenances
```

---

## Reglas de negocio

### Creación de mantenimientos

- El vehículo debe existir y no estar `INACTIVE`.
- El mecánico debe existir y estar activo.
- El taller debe existir y estar activo.
- Un vehículo no puede tener más de un mantenimiento activo (`SCHEDULED` o `IN_PROGRESS`).
- Un mecánico no puede tener mantenimientos activos con horarios que se crucen, en el mismo taller o en otro. Un mantenimiento que termina a las 9:00 sí permite otro que empiece a las 9:00.
- El kilometraje registrado no puede ser inferior al kilometraje actual del vehículo.

### Transiciones de estado

```
SCHEDULED ──► IN_PROGRESS ──► COMPLETED   (final)
    │              │
    └──► CANCELLED ◄┘                      (final)
```

| Cambio                     | Efecto en el vehículo                              |
| -------------------------- | -------------------------------------------------- |
| → `IN_PROGRESS`            | Pasa a `IN_MAINTENANCE`                            |
| → `COMPLETED`              | Pasa a `AVAILABLE` y toma el kilometraje final     |
| `IN_PROGRESS` → `CANCELLED` | Vuelve a `AVAILABLE`                              |

- Para completar son obligatorios: `workPerformed`, `finalCost`, `completedAt` y `finalMileage`.
- Un mantenimiento `COMPLETED` no puede regresar a un estado anterior.
- Un mantenimiento `CANCELLED` no puede pasar a `IN_PROGRESS` ni a `COMPLETED`.
- Las transiciones inválidas responden **409** con un mensaje descriptivo.
- Cada cambio de estado queda registrado en la auditoría (quién, cuándo, de qué estado a cuál).
- La creación y el cambio de estado se ejecutan en **transacciones** con bloqueo de filas, para evitar inconsistencias por peticiones simultáneas.

---

## Formato de respuestas

**Éxito** (interceptor global):

```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "timestamp": "2026-10-20T19:00:00.000Z"
}
```

**Error** (filtro global de excepciones):

```json
{
  "success": false,
  "statusCode": 409,
  "message": "El vehículo ABC123 ya tiene un mantenimiento activo",
  "path": "/api/maintenances",
  "timestamp": "2026-10-20T19:00:00.000Z"
}
```

| Código | Cuándo                                                                 |
| ------ | ---------------------------------------------------------------------- |
| 400    | Datos inválidos o información de cierre incompleta                     |
| 401    | Sin token, token inválido/expirado o API Key incorrecta                |
| 403    | El rol del usuario no tiene permiso                                    |
| 404    | Recurso inexistente                                                    |
| 409    | Conflicto de negocio, transición inválida o dato único duplicado       |

Los errores de unicidad de la base de datos se convierten en **409**, nunca en 500.

---

## Pruebas

```bash
npm run test        # pruebas unitarias
npm run test:cov    # pruebas + reporte de cobertura (mínimo 40 % de líneas)
```

Cubren las reglas de cambio de estado y de creación de mantenimientos, `RolesGuard`, `ApiKeyGuard`, el filtro global de excepciones y el interceptor de respuestas. La cobertura se mide sobre la lógica de negocio: servicios, guards, filtro e interceptor.

---

## Estructura del proyecto

```
src/
├── auth/               # Registro, login y emisión de JWT
├── common/
│   ├── constants/      # Claves de metadatos
│   ├── decorators/     # @Public, @Roles, @CurrentUser, @ApiKeyAuth
│   ├── filters/        # Filtro global de excepciones
│   ├── guards/         # JwtAuthGuard, RolesGuard, ApiKeyGuard
│   ├── interceptors/   # Formato uniforme de respuestas
│   └── interfaces/
├── database/seeds/     # Seeder
├── health/             # Endpoint de estado
├── integrations/       # Endpoint para sistemas externos (x-api-key)
├── maintenances/       # Mantenimientos, estados y auditoría
├── mechanics/
├── users/
├── vehicles/
├── workshops/
├── app.module.ts
└── main.ts
```

---

## Entregables adicionales

- **Colección de Postman:** `postman/FleetCore.postman_collection.json`
- **Dump de la base de datos:** `fleetcore_dump.sql`, generado con:

```bash
docker exec fleetcore_postgres pg_dump -U fleetcore -d fleetcore_db > fleetcore_dump.sql
```